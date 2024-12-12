import { Request, Response, NextFunction } from "express";
import { createError } from "@/helpers/helper";
import { responseHandler } from "@/middlewares/handler";
import constants from "@/utils/constants";
import message from "./referralConstant";
import Referral from "@/models/referral";
import { Types } from "mongoose";

const referralList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Referral.aggregate([
      {
        $match: {
          $and: [
            {
              userId: new Types.ObjectId(req.query.filter.userId),
            },
            { isDeleted: false },
          ],
        },
      },
      {
        $unwind: "$referred",
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$referred.userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$userId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
          ],
          as: "referred",
        },
      },
      {
        $unwind: {
          path: "$referred",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "activities",
          let: { userId: "$referred._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                isCompleted: {
                  $cond: [
                    {
                      $gte: [{ $size: "$quizzes" }, 3],
                    },
                    true,
                    false,
                  ],
                },
              },
            },
          ],
          as: "activity",
        },
      },
      {
        $unwind: {
          path: "$activity",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$referred._id",
          name: "$referred.name",
          isCompleted: "$activity.isCompleted",
        },
      },
      {
        $match: {
          $and: [
            {
              $or: [
                {
                  "name.firstName": {
                    $regex: "^" + req.query.search + ".*",
                    $options: "i",
                  },
                },
              ],
            },
            {
              ...(req.query.filter.isCompleted
                ? {
                    isCompleted:
                      req.query.filter.isCompleted === "true" ? true : false,
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
          message.referralListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

export default {
  referralList,
};
