import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import { createError } from "@/helpers/helper";
import constants from "@/utils/constants";
import message from "./reviewConstant";
import Review from "@/models/review";
import { Types } from "mongoose";

const reviewsList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Review.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
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
                image: { $first: "$images" },
              },
            },
          ],
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
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
        $group: {
          _id: "$productId",
          image: { $first: "$product.image" },
          name: { $first: "$product.name" },
          rating: { $avg: "$rating" },
          ratedBy: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          image: 1,
          name: 1,
          rating: { $round: [{ $ifNull: ["$rating", 0] }, 1] },
          ratedBy: 1,
        },
      },
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
              ...(req.query.filter.rating
                ? {
                    rating: Number(req.query.filter.rating),
                  }
                : {}),
            },
          ],
        },
      },
      {
        $sort: { rating: sort, ratedBy: sort },
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
        return await responseHandler(req, res, message.reviewListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const detail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    const productInfo = await Review.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(req.query.filter.reviewId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
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
                image: { $first: "$images" },
              },
            },
          ],
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$productId",
          image: { $first: "$product.image" },
          name: { $first: "$product.name" },
          rating: { $avg: "$rating" },
          ratedBy: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          image: 1,
          name: 1,
          rating: { $round: [{ $ifNull: ["$rating", 0] }, 1] },
          ratedBy: 1,
        },
      },
    ]);

    const reviews = await Review.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(req.query.filter.reviewId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
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
                photo: 1,
              },
            },
          ],
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          images: 1,
          description: 1,
          rating: 1,
          createdAt: { $toLong: "$updatedAt" },
          user: {
            id: "$user.id",
            photo: "$user.photo",
            name: "$user.name",
          },
        },
      },
      {
        $sort: { createdAt: sort },
      },
      {
        $match: {
          $and: [
            {
              ...(req.query.filter.rating
                ? {
                    rating: Number(req.query.filter.rating),
                  }
                : {}),
            },
          ],
        },
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
    ]);

    if (!productInfo.length) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      const reviewData = {
        productInfo: productInfo[0],
        reviewsList: reviews[0],
      };

      return await responseHandler(
        req,
        res,
        message.reviewDetailSuccess,
        reviewData
      );
    }
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Review.find({
        _id: { $in: req.body.review_id },
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
        Review.updateMany(
          { _id: { $in: req.body.review_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.review_id.length; i++) {
              await clearKey(req.body.review_id[i]);
            }
            return await responseHandler(req, res, message.reviewDeleted);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

export default {
  reviewsList,
  detail,
  deleteReview,
};
