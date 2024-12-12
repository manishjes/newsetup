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
import message from "./categoryConstant";
import Category from "@/models/category";

const addCategory = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Category.exists({
      slug: await createSlug(req.body.category_name),
      type: req.body.category_type,
      isDeleted: false,
    });

    if (data) {
      req.file && (await removeImage(req.file.filename));
      return next(
        await createError(
          constants.code.preconditionFailed,
          message.existCategory
        )
      );
    } else {
      Category.create({
        "image.localUrl":
          req.file && (await imageURL(req.headers.host, req.file.filename)),
        name: req.body.category_name,
        slug: await createSlug(req.body.category_name),
        type: req.body.category_type,
        createdBy: req.id,
      }).then(async (data) => {
        if (data) {
          return await responseHandler(req, res, message.categorySuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const categoryList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Category.aggregate([
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
              ...(req.query.filter.type ? { type: req.query.filter.type } : {}),
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
          type: 1,
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
        return await responseHandler(
          req,
          res,
          message.categoryListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const categoryDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.category_id, async () => {
      const data = await Category.findOne({
        _id: req.params.category_id,
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
        message.categoryDetailSuccess,
        data
      );
    }
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req: any, res: Response, next: NextFunction) => {
  try {
    const category: any = await Category.findOne({
      _id: req.params.category_id,
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
      Category.exists({
        _id: { $nin: [category._id] },
        slug: await createSlug(req.body.category_name),
        type: !req.body.category_type ? category.type : req.body.category_type,
        isDeleted: false,
      }).then(async (data) => {
        if (data) {
          req.file && (await removeImage(req.file.filename));
          return next(
            await createError(
              constants.code.preconditionFailed,
              message.existCategory
            )
          );
        } else {
          req.file &&
            category.image.localUrl &&
            (await removeImage(await getFileName(category.image.localUrl)));

          Category.findOneAndUpdate(
            {
              _id: category._id,
            },
            {
              "image.localUrl":
                req.file &&
                (await imageURL(req.headers.host, req.file.filename)),
              name: req.body.category_name,
              slug: await createSlug(req.body.category_name),
              type: req.body.category_type,
              updatedBy: req.id,
            },
            { new: true }
          ).then(async (data) => {
            if (data) {
              await clearKey(req.params.category_id);
              return await responseHandler(
                req,
                res,
                message.categoryUpdateSuccess
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

const deleteCategory = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Category.find({
        _id: { $in: req.body.category_id },
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
        Category.updateMany(
          { _id: { $in: req.body.category_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.category_id.length; i++) {
              await clearKey(req.body.category_id[i]);
            }
            return await responseHandler(
              req,
              res,
              message.categoryDeleteSuccess
            );
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

export default {
  addCategory,
  categoryList,
  categoryDetail,
  updateCategory,
  deleteCategory,
};
