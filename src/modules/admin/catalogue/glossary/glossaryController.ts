import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import { createError, createSlug, removeImage, imageURL, logoURL, removeLogo, getFileName, validateExcelColumns, removeFile } from "@/helpers/helper";
import constants from "@/utils/constants";
import message from "./glossaryConstant";
import Glossary from "@/models/glossary";
import excelToJson from "convert-excel-to-json";
import mongoose from "mongoose";


const addGlossary = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Glossary.exists({
      slug: await createSlug(req.body.glossary_name),
      isDeleted: false,
    });

    if (data) {
      if (req.files) {
        if (req.files.image) {
          await removeImage(req.files.image[0].filename);
        }
        if (req.files.logo) {
          await removeLogo(req.files.logo[0].filename);
        }
      }
      return next(
        await createError(
          constants.code.preconditionFailed,
          message.existGlossary
        )
      );
    } else {
      Glossary.create({
        name: req.body.glossary_name,
        slug: await createSlug(req.body.glossary_name),
        description: req.body.description,
        longdescription: req.body.longdescription,
        "image.localUrl": req.files && req.files.image ? await imageURL(req.headers.host, req.files.image[0].filename) : null,
        "logo.localUrl": req.files && req.files.logo ? await logoURL(req.headers.host, req.files.logo[0].filename) : null,
        createdBy: req.id,
      }).then(async (data) => {
        if (data) {
          return await responseHandler(req, res, message.glossarySuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const glossaryList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Glossary.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                {
                  name: {
                    $regex: "^" + req.query.search + ".*",
                    $options: "i",
                  },
                },
              ],
            },
          ],
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$isDeleted", false] }],
                },
              },
            },
            {
              $project: {
                _id: 0,
                id: "$_id",
                name: 1,
              },
            },
          ],
          as: "createdBy",
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "updatedBy",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$isDeleted", false] }],
                },
              },
            },
            {
              $project: {
                _id: 0,
                id: "$_id",
                name: 1,
              },
            },
          ],
          as: "updatedBy",
        },
      },
      {
        $unwind: {
          path: "$updatedBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          slug: 1,
          description:1,
          longdescription:1,
          image:1,
          logo:1,
          isDeleted: 1,
          createdAt: { $toLong: "$createdAt" },
          updatedAt: { $toLong: "$updatedAt" },
          createdBy: 1,
          updatedBy: 1,
        },
      },
      {
        $sort: { createdAt: sort },
      },
      {
        $facet: {
          metadata: [
            { $count: "total" },
            { $addFields: { page: Number(page) } },
            {
              $addFields: {
                totalPages: {
                  $cond: [
                    Number(req.query.limit) !== 0,
                    { $ceil: { $divide: ["$total", limit] } },
                    { $sum: [Number(page), Number(1)] },
                  ],
                },
              },
            },
            {
              $addFields: {
                hasPrevPage: {
                  $cond: [
                    Number(req.query.limit) !== 0,
                    {
                      $cond: [
                        {
                          $lt: [{ $subtract: [page, Number(1)] }, Number(0)],
                        },
                        false,
                        true,
                      ],
                    },
                    false,
                  ],
                },
              },
            },
            {
              $addFields: {
                prevPage: {
                  $cond: [
                    Number(req.query.limit) !== 0,
                    {
                      $cond: [
                        {
                          $lt: [{ $subtract: [page, Number(1)] }, Number(0)],
                        },
                        null,
                        { $subtract: [page, Number(1)] },
                      ],
                    },
                    null,
                  ],
                },
              },
            },
            {
              $addFields: {
                hasNextPage: {
                  $cond: [
                    Number(req.query.limit) !== 0,
                    {
                      $cond: [
                        {
                          $gt: [
                            {
                              $subtract: [
                                {
                                  $ceil: { $divide: ["$total", limit] },
                                },
                                Number(1),
                              ],
                            },
                            "$page",
                          ],
                        },
                        true,
                        false,
                      ],
                    },
                    false,
                  ],
                },
              },
            },
            {
              $addFields: {
                nextPage: {
                  $cond: [
                    Number(req.query.limit) !== 0,
                    { $sum: [page, Number(1)] },
                    null,
                  ],
                },
              },
            },
          ],
          data: data,
        },
      },
    ]).then(async (data) => {
      if (!data[0].data.length) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        return await responseHandler(
          req,
          res,
          message.glossaryListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const glossaryDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.glossary_id, async () => {
      const data = await Glossary.findOne({
        _id: req.params.glossary_id,
        isDeleted: false,
      });
      return data;
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(
        req,
        res,
        message.glossaryDetailSuccess,
        data
      );
    }
  } catch (err) {
    next(err);
  }
};

const updateGlossary = async (req: any, res: Response, next: NextFunction) => {
  try {
    const glossary = await getOrSetCache(req.params.glossary_id, async () => {
      const data = await Glossary.findOne({
        _id: req.params.glossary_id,
        isDeleted: false,
      });
      return data;
    });

    if (!glossary) {
      if (req.files) {
        if (req.files.image) {
          await removeImage(req.files.image[0].filename);
        }
        if (req.files.logo) {
          await removeLogo(req.files.logo[0].filename);
        }
      }
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      Glossary.exists({
        $and: [
          {
            slug:
              req.body.glossary_name &&
              (await createSlug(req.body.glossary_name)),
          },
          { _id: { $nin: [glossary.id] } },
          { isDeleted: false },
        ],
      }).then(async (data) => {
        if (data) {
          if (req.files) {
            if (req.files.image) {
              await removeImage(req.files.image[0].filename);
            }
            if (req.files.logo) {
              await removeLogo(req.files.logo[0].filename);
            }
          }
          return next(
            await createError(
              constants.code.preconditionFailed,
              message.existGlossary
            )
          );
        } else {
          if (req.files && glossary.image.localUrl) {
            await removeImage(await getFileName(glossary.image.localUrl));
          }
          if (req.files && glossary.logo.localUrl) {
            await removeLogo(await getFileName(glossary.logo.localUrl));
          }
          Glossary.findOneAndUpdate(
            {
              _id: glossary.id,
            },
            {
              name: req.body.glossary_name,
              slug:
                req.body.glossary_name &&
                (await createSlug(req.body.glossary_name)),
              description: req.body.description,
              longdescription: req.body.longdescription,
        "image.localUrl": req.files && req.files.image ? await imageURL(req.headers.host, req.files.image[0].filename) : null,
        "logo.localUrl": req.files && req.files.logo ? await logoURL(req.headers.host, req.files.logo[0].filename) : null,
              updatedBy: req.id,
            },
            { new: true }
          ).then(async (data) => {
            if (data) {
              await clearKey(req.params.glossary_id);
              return await responseHandler(
                req,
                res,
                message.glossaryUpdateSuccess
              );
            }
          });
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const deleteGlossary = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Glossary.find({
        _id: { $in: req.body.glossary_id },
        isDeleted: false,
      });

      if (!data.length) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        Glossary.updateMany(
          { _id: { $in: req.body.glossary_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.glossary_id.length; i++) {
              await clearKey(req.body.glossary_id[i]);
            }
            return await responseHandler(
              req,
              res,
              message.glossaryDeleteSuccess
            );
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};


const bulkGlossaryUpload = async(req:any, res:Response, next:NextFunction)=>{
  try {
    let createdBy = req?.id;
    const data = excelToJson({
      sourceFile: req.file.path,
      sheets: ["glossariesUpload"],
      sheetStubs: true
    });

    const columns: any = [
     "Name",
     "Description",
     "LongDescription",
    ];
    const excelData = await validateExcelColumns(columns, data["glossariesUpload"]);
    excelData.shift();
   
   
     for (const element of excelData) {
        const name = element["Name"];
        const slug = await createSlug(element["Name"])

  
        const glossaryData:any = await Glossary.findOneAndUpdate(
            {
              name:name,
              isDeleted: false,
            },
            {
              name:name,
              slug:slug,
              description: element["Description"],
              longdescription: element["LongDescription"],
              "image.localUrl":null,
              "logo.localUrl":null,
              createdBy: new mongoose.Types.ObjectId(req?.id),
              updatedBy: new mongoose.Types.ObjectId(req?.id),
              isDeleted: false,
            },
            { new: true, upsert: true }
          );
  
          if (!glossaryData) throw new Error(message.bulkFailed);
      }
    await removeFile(req.file.filename);
    return res.status(constants.code.success).json({
      status: constants.status.statusTrue,
      userStatus: req.status,
      message: message.bulkSuccess
    });
  } catch (error: any) {
    console.log("errorr", error);

    return res.status(constants.code.preconditionFailed).json({
      status: constants.status.statusFalse,
      userStatus: req.status,
      message: error.message ? error.message : error
    });
  }
}

export default {
  addGlossary,
  glossaryList,
  glossaryDetail,
  updateGlossary,
  deleteGlossary,
  bulkGlossaryUpload
};
