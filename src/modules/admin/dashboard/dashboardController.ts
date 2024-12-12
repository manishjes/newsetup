import { Request, Response, NextFunction } from "express";
import { createError, createSlug } from "@/helpers/helper";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import constants from "@/utils/constants";
import message from "./dashboardConstant";
import User from "@/models/user";
import Product from "@/models/product";
import Skill from "@/models/skill";
import Order from "@/models/order";
import Activity from "@/models/activity";
import mongoose from "mongoose";

const detail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.aggregate([
      {
        $match: {
          role: {
            $nin: [
              constants.accountLevel.superAdmin,
              constants.accountLevel.admin,
            ],
          },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          users: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ["$status", false] }, 1, 0] } },
          male: {
            $sum: {
              $cond: [{ $eq: ["$gender", constants.gender.male] }, 1, 0],
            },
          },
          female: {
            $sum: {
              $cond: [{ $eq: ["$gender", constants.gender.female] }, 1, 0],
            },
          },
          other: {
            $sum: {
              $cond: [{ $eq: ["$gender", constants.gender.other] }, 1, 0],
            },
          },
          premium: { $sum: { $cond: [{ $eq: ["$isPremium", true] }, 1, 0] } },
          free: { $sum: { $cond: [{ $eq: ["$isPremium", false] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$users",
          status: [
            ["Status", "Total"],
            ["Active", "$active"],
            ["Inactive", "$inactive"],
          ],
          gender: [
            ["Gender", "Percentage"],
            ["Male", "$male"],
            ["Female", "$female"],
            ["Other", "$other"],
          ],
          subscription: [
            ["Status", "Total"],
            ["Premium", "$premium"],
            ["Free", "$free"],
          ],
        },
      },
    ]);

    const products = await Product.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          products: { $sum: 1 },
          outOfStock: { $sum: { $cond: [{ $eq: ["$quantity", 0] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$products",
          outOfStock: 1,
        },
      },
    ]);

    const skills = await Skill.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          skills: { $sum: 1 },
          premium: { $sum: { $cond: [{ $eq: ["$isPremium", true] }, 1, 0] } },
          free: { $sum: { $cond: [{ $eq: ["$isPremium", false] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$skills",
          status: [
            ["Stats", "Total"],
            ["Premium", "$premium"],
            ["Free", "$free"],
          ],
        },
      },
    ]);

    const orders = await Order.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          open: {
            $sum: {
              $cond: [
                {
                  $eq: [{ $last: "$status.value" }, constants.orderStatus.open],
                },
                1,
                0,
              ],
            },
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.pending,
                  ],
                },
                1,
                0,
              ],
            },
          },
          onHold: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.onHold,
                  ],
                },
                1,
                0,
              ],
            },
          },
          awaitingFulfillment: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.awaitingFulfillment,
                  ],
                },
                1,
                0,
              ],
            },
          },
          awaitingShipment: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.awaitingShipment,
                  ],
                },
                1,
                0,
              ],
            },
          },
          shipped: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.shipped,
                  ],
                },
                1,
                0,
              ],
            },
          },
          partiallyShipped: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.partiallyShipped,
                  ],
                },
                1,
                0,
              ],
            },
          },
          inTransit: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.inTransit,
                  ],
                },
                1,
                0,
              ],
            },
          },
          outForDelivery: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.outForDelivery,
                  ],
                },
                1,
                0,
              ],
            },
          },
          completed: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.completed,
                  ],
                },
                1,
                0,
              ],
            },
          },
          partiallyCompleted: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.partiallyCompleted,
                  ],
                },
                1,
                0,
              ],
            },
          },
          cancelled: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.cancelled,
                  ],
                },
                1,
                0,
              ],
            },
          },
          returned: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.returned,
                  ],
                },
                1,
                0,
              ],
            },
          },
          refund: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $last: "$status.value" },
                    constants.orderStatus.refund,
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$orders",
          status: [
            ["Status", "Total"],
            ["Open", "$open"],
            ["Pending", "$pending"],
            ["On Hold", "$onHold"],
            ["Awaiting Fulfillment", "$awaitingFulfillment"],
            ["Awaiting Shipment", "$awaitingShipment"],
            ["Shipped", "$shipped"],
            ["Partially Shipped", "$partiallyShipped"],
            ["In Transit", "$inTransit"],
            ["Out for Delivery", "$outForDelivery"],
            ["Completed", "$completed"],
            ["Partially Completed", "$partiallyCompleted"],
            ["Cancelled", "$cancelled"],
            ["Returned", "$returned"],
            ["Refund", "$refund"],
          ],
        },
      },
    ]);

    return await responseHandler(req, res, message.dashboardDetailSuccess, {
      users: users[0],
      products: products[0],
      skills: skills[0],
      orders: orders[0],
    });
  } catch (err) {
    next(err);
  }
};

const leaderboard = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];




  await  Activity.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      // {
      //   $lookup: {
      //     from: "users",
      //     foreignField: "_id",
      //     localField: "userId",
      //     as: "user",
      //   },
      // },
      {
        $lookup: {
          from: "users",
          let: { included: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$included"] },
                isDeleted: false,
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
          id: "$userId",
          xp: "$xp.total",
          walnut: "$walnut.total",
          isPremium: "$user.isPremium",
          name: "$user.name",
          photo: "$user.photo",
        },
      },
      {
        $sort: { xp: sort },
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
          message.leaderboarddata,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

export default {
  detail,
  leaderboard
};
