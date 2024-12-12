import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import {
  createError,
  createSlug,
  getFileName,
  imageURL,
  removeImage,
} from "@/helpers/helper";
import constants from "@/utils/constants";
import message from "./brandConstant";
import Brand from "@/models/brand";

const addBrand = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Brand.exists({
      slug: await createSlug(req.body.brand_name),
      isDeleted: false,
    });

    if (data) {
      req.file && (await removeImage(req.file.filename));
      return next(
        await createError(constants.code.preconditionFailed, message.existBrand)
      );
    } else {
      Brand.create({
        "image.localUrl":
          req.file && (await imageURL(req.headers.host, req.file.filename)),
        name: req.body.brand_name,
        slug: await createSlug(req.body.brand_name),
        createdBy: req.id,
      }).then(async (data) => {
        if (data) {
          return await responseHandler(req, res, message.brandSuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const brandList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Brand.aggregate([
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
        return await responseHandler(req, res, message.brandListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const brandDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.brand_id, async () => {
      const data = await Brand.findOne({
        _id: req.params.brand_id,
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
      return await responseHandler(req, res, message.brandDetailSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const updateBrand = async (req: any, res: Response, next: NextFunction) => {
  try {
    const brand: any = await Brand.findOne({
      _id: req.params.brand_id,
      isDeleted: false,
    });

    if (!brand) {
      req.file && (await removeImage(req.file.filename));
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      Brand.exists({
        _id: { $nin: [brand._id] },
        slug: await createSlug(req.body.brand_name),
        isDeleted: false,
      }).then(async (data) => {
        if (data) {
          req.file && (await removeImage(req.file.filename));
          return next(
            await createError(
              constants.code.preconditionFailed,
              message.existBrand
            )
          );
        } else {
          req.file &&
            brand.image.localUrl &&
            (await removeImage(await getFileName(brand.image.localUrl)));

          Brand.findOneAndUpdate(
            {
              _id: brand._id,
            },
            {
              "image.localUrl":
                req.file &&
                (await imageURL(req.headers.host, req.file.filename)),
              name: req.body.brand_name,
              slug: await createSlug(req.body.brand_name),
              updatedBy: req.id,
            },
            { new: true }
          ).then(async (data) => {
            if (data) {
              await clearKey(req.params.brand_id);
              return await responseHandler(
                req,
                res,
                message.brandUpdateSuccess
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

const deleteBrand = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Brand.find({
        _id: { $in: req.body.brand_id },
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
        Brand.updateMany(
          { _id: { $in: req.body.brand_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.brand_id.length; i++) {
              await clearKey(req.body.brand_id[i]);
            }
            return await responseHandler(req, res, message.brandDeleteSuccess);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

export default {
  addBrand,
  brandList,
  brandDetail,
  updateBrand,
  deleteBrand,
};
