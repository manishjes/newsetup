import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import excelToJson from "convert-excel-to-json";
import {
  createError,
  createSlug,
  getFileName,
  imageURL,
  removeImage,
  removeFile,
  validateExcelColumns
} from "@/helpers/helper";
import constants from "../../../../utils/constants";
import message from "./skillConstant";
import Category from "@/models/category";
import Skill from "@/models/skill";
import User from "@/models/user";
import { Types } from "mongoose";
import path from "node:path";
import { fork } from "node:child_process";
import { spawn } from 'child_process';
import mongoose from "mongoose";

const addSkill = async (req: any, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findOne({
      _id: req.body.category_id,
      type: constants.catalougeTypes.skill,
      isDeleted: false,
    });

    if (!category) {
      req.file && (await removeImage(req.file.filename));
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      const data = await Skill.exists({
        slug: await createSlug(req.body.skill_name),
        categoryId: category._id,
        isDeleted: false,
      });

      if (data) {
        req.file && (await removeImage(req.file.filename));
        return next(
          await createError(
            constants.code.preconditionFailed,
            message.existSkill
          )
        );
      } else {
        Skill.create({
          "image.localUrl":
            req.file && (await imageURL(req.headers.host, req.file.filename)),
          categoryId: category._id,
          name: req.body.skill_name,
          description: req.body.description,
          slug: await createSlug(req.body.skill_name),
          isPremium: req.body.is_premium,
          createdBy: req.id,
        }).then(async (data) => {
          if (data) {
            return await responseHandler(req, res, message.skillSuccess);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const skillList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Skill.aggregate([
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
            {
              ...(req.query.filter.categoryId
                ? {
                    categoryId: new Types.ObjectId(req.query.filter.categoryId),
                  }
                : {}),
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
          isPremium: 1,
          image: 1,
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
        return await responseHandler(req, res, message.skillListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const skillDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.skill_id, async () => {
      const data = await Skill.findOne({
        _id: req.params.skill_id,
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
      return await responseHandler(req, res, message.skillDetailSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const updateSkill = async (req: any, res: Response, next: NextFunction) => {
  try {
    const skill: any = await Skill.findOne({
      _id: req.params.skill_id,
      isDeleted: false,
    });

    if (!skill) {
      req.file && (await removeImage(req.file.filename));
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      const category = await Category.findOne({
        _id: req.body.category_id,
        type: constants.catalougeTypes.skill,
        isDeleted: false,
      });

      if (!category) {
        req.file && (await removeImage(req.file.filename));
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        Skill.exists({
          _id: { $nin: [skill._id] },
          slug: await createSlug(req.body.skill_name),
          categoryId: category._id,
          isDeleted: false,
        }).then(async (data) => {
          if (data) {
            req.file && (await removeImage(req.file.filename));
            return next(
              await createError(
                constants.code.preconditionFailed,
                message.existSkill
              )
            );
          } else {
            req.file &&
              skill.image.localUrl &&
              (await removeImage(await getFileName(skill.image.localUrl)));

            Skill.findOneAndUpdate(
              {
                _id: skill._id,
              },
              {
                "image.localUrl":
                  req.file &&
                  (await imageURL(req.headers.host, req.file.filename)),
                categoryId: category._id,
                name: req.body.skill_name,
                description: req.body.description,
                slug: await createSlug(req.body.skill_name),
                isPremium: req.body.is_premium,
                updatedBy: req.id,
              },
              { new: true }
            ).then(async (data) => {
              if (data) {
                await clearKey(req.params.skill_id);
                return await responseHandler(
                  req,
                  res,
                  message.skillUpdateSuccess
                );
              }
            });
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const deleteSkill = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Skill.find({
        _id: { $in: req.body.skill_id },
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
        Skill.updateMany(
          { _id: { $in: req.body.skill_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.skill_id.length; i++) {
              await clearKey(req.body.skill_id[i]);
            }
            return await responseHandler(req, res, message.skillDeleteSuccess);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

// const addSkillBulk = async (req: any, res: Response, next: NextFunction) => {
//   try {
//     const forkedScriptPath = path.join(__dirname, 'bulkUpload.ts');
//     const child = fork(forkedScriptPath);

//     child.send({ filePath: req.file.path, userId: req.id });

//     child.on('message', (data) => {
//       if (data) {
//         res.status(constants.code.success).json({
//           status: constants.status.statusTrue,
//           userStatus: req.status,
//           message: "skill upload successfully",
//         });
//       } else {
//         res.status(constants.code.preconditionFailed).json({
//           status: constants.status.statusFalse,
//           userStatus: req.status,
//           message: "Server Error",
//         });
//       }

//     //  removeFile(req.file.filename);
//     });

//     child.on('error', (error) => {
//       console.error('Error in child process:', error);
//       res.status(constants.code.preconditionFailed).json({
//         status: constants.status.statusFalse,
//         userStatus: req.status,
//         message: 'Internal Server Error',
//       });
//       // Remove the file after processing
//       //removeFile(req.file.filename);
//     });

//     child.on('exit', (code) => {
//       console.log(`Child process exited with code ${code}`);
//     });
//   } catch (error) {
//     console.error('Error occurred:', error);
//     res.status(constants.code.preconditionFailed).json({
//       status: constants.status.statusFalse,
//       userStatus: req.status,
//       message: 'Internal Server Error',
//     });
//   }
// };

const addSkillBulk = async(req:any, res:Response, next:NextFunction)=>{
  try {
    let createdBy = req?.id;
    const data = excelToJson({
      sourceFile: req.file.path,
      sheets: ["skillUpload"],
      sheetStubs: true
    });

    const columns: any = [
     "Name",
     "Description",
     "Category",
     "IsPremium",
    ];
    const excelData = await validateExcelColumns(columns, data["skillUpload"]);
    excelData.shift();
   
   
     for (const element of excelData) {
        const name = element["Name"];
        const slug = await createSlug(element["Name"])
        const categoryIds = await Category.findOne({
            name:  element["Category"],
            isDeleted:false
        },{_id:1})
  
        const isPremium = (typeof element["IsPremium"] === 'string') 
                ? element["IsPremium"].toLowerCase() === 'true' || element["IsPremium"] === '1'
                : Boolean(element["IsPremium"]);
        const skillData:any = await Skill.findOneAndUpdate(
            {
              name:name,
              isDeleted: false,
            },
            {
                name:name,
                slug:slug,
                description: element["Description"],
                categoryId: categoryIds?._id,
                isPremium: isPremium,
                "image.localUrl":null,
              createdBy: new mongoose.Types.ObjectId(req?.id),
              updatedBy: new mongoose.Types.ObjectId(req?.id),
              isDeleted: false,
            },
            { new: true, upsert: true }
          );
  
          if (!skillData) throw new Error(message.bulkFailed);
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
  addSkill,
  skillList,
  skillDetail,
  updateSkill,
  deleteSkill,
  addSkillBulk
};
