import { Request, Response, NextFunction } from "express";
import { createError, createSlug } from "@/helpers/helper";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import constants from "@/utils/constants";
import message from "./faqConstant";
import Category from "@/models/category";
import FAQ from "@/models/faq";
import { Types } from "mongoose";

const create = async (req: any, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findOne({
      _id: req.body.category_id,
      type: constants.catalougeTypes.faq,
      isDeleted: false,
    });

    if (!category) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      const data = await FAQ.exists({
        slug: req.body.question && (await createSlug(req.body.question)),
        categoryId: category._id,
        isDeleted: false,
      });

      if (data) {
        return next(
          await createError(
            constants.code.preconditionFailed,
            message.alreadyExist
          )
        );
      } else {
        FAQ.create({
          categoryId: category._id,
          question: req.body.question,
          slug: await createSlug(req.body.question),
          answer: req.body.answer,
          createdBy: req.id,
        }).then(async (data) => {
          if (!data) {
            return next(
              await createError(
                constants.code.dataNotFound,
                constants.message.dataNotFound
              )
            );
          } else {
            return await responseHandler(req, res, message.faqSuccess);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const faqList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    FAQ.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                {
                  question: {
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
          question: 1,
          slug: 1,
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
        return await responseHandler(req, res, message.faqListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const detail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.faq_id, async () => {
      const data = await FAQ.findOne({
        _id: req.params.faq_id,
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
      return await responseHandler(req, res, message.faqDetailSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const update = async (req: any, res: Response, next: NextFunction) => {
  try {
    const faq = await FAQ.findOne({
      _id: req.params.faq_id,
      isDeleted: false,
    });

    if (!faq) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      const category = await Category.findOne({
        _id: req.body.category_id,
        type: constants.catalougeTypes.faq,
        isDeleted: false,
      });

      if (!category) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        FAQ.exists({
          slug: req.body.question && (await createSlug(req.body.question)),
          _id: { $nin: [faq.id] },
          categoryId: category._id,
          isDeleted: false,
        }).then(async (data) => {
          if (data) {
            return next(
              await createError(
                constants.code.preconditionFailed,
                message.alreadyExist
              )
            );
          } else {
            FAQ.findOneAndUpdate(
              {
                _id: faq.id,
              },
              {
                categoryId: category._id,
                question: req.body.question,
                slug:
                  req.body.question && (await createSlug(req.body.question)),
                answer: req.body.answer,
                updatedBy: req.id,
              },
              { new: true }
            ).then(async (data) => {
              if (data) {
                await clearKey(req.params.faq_id);
                return await responseHandler(
                  req,
                  res,
                  message.faqUpdateSuccess
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

const deleteFAQ = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await FAQ.find({
        _id: { $in: req.body.faq_id },
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
        FAQ.updateMany(
          { _id: { $in: req.body.faq_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.faq_id.length; i++) {
              await clearKey(req.body.faq_id[i]);
            }
            return await responseHandler(req, res, message.faqDeleted);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  faqList,
  detail,
  update,
  deleteFAQ,
};
