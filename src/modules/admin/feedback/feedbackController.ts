import { Request, Response, NextFunction } from "express";
import { createError, createSlug } from "@/helpers/helper";
import { responseHandler } from "@/middlewares/handler";
import constants from "@/utils/constants";
import message from "./feedbackConstant";
import Feedback from "@/models/feedback";
import { Types } from "mongoose";
import { clearKey } from "@/config/redis";

const giveFeedback = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Feedback.findOneAndUpdate(
      { userId: req.id, type: req.body.feedback_type },
      {
        userId: req.id,
        type: req.body.feedback_type,
        reason: req.body.reason,
        description: req.body.description,
        rating: req.body.rating,
        createdBy: req.id,
      },
      { new: true, upsert: true }
    );

    if (data) {
      return await responseHandler(req, res, message.feedbackSuccess);
    }
  } catch (err) {
    next(err);
  }
};

const feedbacksList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Feedback.aggregate([
      {
        $match: {
          $and: [
            {
              ...(req.query.filter.type ? { type: req.query.filter.type } : {}),
            },
            {
              ...(req.query.filter.userId
                ? { userId: new Types.ObjectId(req.query.filter.userId) }
                : {}),
            },
          ],
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
          user: 1,
          type: 1,
          reason: 1,
          description: 1,
          rating: 1,
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
          message.feedbackListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const deleteFeedback = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Feedback.find({
        _id: { $in: req.body.feedback_id },
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
        Feedback.updateMany(
          { _id: { $in: req.body.feedback_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.feedback_id.length; i++) {
              await clearKey(req.body.feedback_id[i]);
            }
            return await responseHandler(req, res, message.feedbackDeleted);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

export default {
  giveFeedback,
  feedbacksList,
  deleteFeedback,
};
