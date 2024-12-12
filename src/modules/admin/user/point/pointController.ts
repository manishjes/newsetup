import { Request, Response, NextFunction } from "express";
import { createError } from "@/helpers/helper";
import { responseHandler } from "@/middlewares/handler";
import constants from "@/utils/constants";
import message from "./pointConstant";
import Activity from "@/models/activity";
import { Types } from "mongoose";

const pointsList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    const points = await Activity.findOne(
      {
        userId: req.query.filter.userId,
      },
      {
        _id: 0,
        walnut: {
          overall: "$walnut.total",
          total: "$walnut.remaining",
        },
        xp: {
          overall: "$xp.total",
          total: "$xp.remaining",
        },
      }
    );

    const transaction = await Activity.aggregate([
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
        $unwind:
          req.query.filter.pointType === "walnut"
            ? "$walnut.transaction"
            : "$xp.transaction",
      },
      {
        $project: {
          _id: 0,
          title:
            req.query.filter.pointType === "walnut"
              ? "$walnut.transaction.title"
              : "$xp.transaction.title",
          type:
            req.query.filter.pointType === "walnut"
              ? "$walnut.transaction.type"
              : "$xp.transaction.type",
          transactionType:
            req.query.filter.pointType === "walnut"
              ? "$walnut.transaction.transactionType"
              : "$xp.transaction.transactionType",
          value:
            req.query.filter.pointType === "walnut"
              ? "$walnut.transaction.value"
              : "$xp.transaction.value",
          createdOn:
            req.query.filter.pointType === "walnut"
              ? { $toLong: "$walnut.transaction.createdOn" }
              : { $toLong: "$xp.transaction.createdOn" },
        },
      },
      {
        $sort: { createdOn: sort },
      },
      {
        $match: {
          $and: [
            {
              $or: [
                {
                  title: {
                    $regex: "^" + req.query.search + ".*",
                    $options: "i",
                  },
                },
              ],
            },
            {
              ...(req.query.filter.transactionType
                ? {
                    transactionType: req.query.filter.transactionType,
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

    if (!transaction[0].data.length) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      const pointsData = {
        points: points,
        transaction: transaction,
      };

      return await responseHandler(
        req,
        res,
        message.pointListSuccess,
        pointsData
      );
    }
  } catch (err) {
    next(err);
  }
};

export default {
  pointsList,
};
