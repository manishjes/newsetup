import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import constants from "@/utils/constants";
import message from "./notificationConstant";
import Notification from "@/models/notification";
import { Types } from "mongoose";
import { createError } from "@/helpers/helper";

const notificationList = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Notification.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(req.id),
          isDeleted: false,
        },
      },
      {
        $unwind: "$notifications",
      },
      {
        $project: {
          _id: 0,
          id: "$notifications._id",
          read: "$notifications.isRead",
          message: "$notifications.message",
          createdOn: { $toLong: "$notifications.createdOn" },
          isDeleted: "$notifications.isDeleted",
        },
      },
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $sort: { createdOn: sort },
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
          message.notificationListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const readNotification = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.is_read) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      Notification.findOneAndUpdate(
        {
          userId: req.id,
          isDeleted: false,
          "notifications._id": req.params.notification_id,
        },
        {
          $set: {
            "notifications.$[xxx].isRead": req.body.is_read,
          },
        },
        {
          arrayFilters: [
            {
              "xxx._id": req.params.notification_id,
            },
          ],
        }
      ).then(async (data) => {
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
            message.notificationReadSuccess
          );
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const deleteNotification = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      Notification.updateMany(
        {
          userId: req.id,
          "notifications._id": { $in: req.body.notification_id },
          isDeleted: false,
        },
        {
          $set: {
            "notifications.$[xxx].isDeleted": true,
          },
        },
        {
          arrayFilters: [
            {
              "xxx._id": { $in: req.body.notification_id },
            },
          ],
        }
      ).then(async (data) => {
        if (data.modifiedCount) {
          return await responseHandler(
            req,
            res,
            message.notificationDeletedSuccess
          );
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

export default {
  notificationList,
  readNotification,
  deleteNotification,
};
