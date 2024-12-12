import { Request, Response, NextFunction } from "express";
import { createError, createSlug } from "@/helpers/helper";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import constants from "@/utils/constants";
import message from "./planConstant";
import Plan from "@/models/plan";

const create = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Plan.exists({
      slug: await createSlug(req.body.name),
      type: req.body.type,
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
      Plan.create({
        name: req.body.name,
        slug: await createSlug(req.body.name),
        description: req.body.description,
        type: req.body.type,
        price: {
          currency: {
            code: req.body.currency_code,
            symbol: req.body.currency_symbol,
          },
          value: req.body.price,
        },
        recurringCycle: req.body.recurring_cycle,
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
          return await responseHandler(req, res, message.planSuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const plansList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Plan.aggregate([
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
            {
              ...(req.query.filter.recurringCycle
                ? { recurringCycle: req.query.filter.recurringCycle }
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
          type: 1,
          price: 1,
          recurringCycle: 1,
          status: 1,
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
        return await responseHandler(req, res, message.planListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const detail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.plan_id, async () => {
      const data = await Plan.findOne({
        _id: req.params.plan_id,
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
      return await responseHandler(req, res, message.planDetailSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const update = async (req: any, res: Response, next: NextFunction) => {
  try {
    const plan = await getOrSetCache(req.params.plan_id, async () => {
      const data = await Plan.findOne({
        _id: req.params.plan_id,
        isDeleted: false,
      });
      return data;
    });

    if (!plan) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      Plan.exists({
        _id: { $nin: [plan.id] },
        slug: await createSlug(req.body.name),
        type: !req.body.type ? plan.type : req.body.type,
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
          Plan.findOneAndUpdate(
            {
              _id: plan.id,
            },
            {
              name: req.body.name,
              slug: await createSlug(req.body.name),
              description: req.body.description,
              type: req.body.type,
              "price.currency.code": req.body.currency_code,
              "price.currency.symbol": req.body.currency_symbol,
              "price.value": req.body.price,
              recurringCycle: req.body.recurring_cycle,
              updatedBy: req.id,
            },
            { new: true }
          ).then(async (data) => {
            if (data) {
              await clearKey(req.params.plan_id);
              return await responseHandler(req, res, message.planUpdateSuccess);
            }
          });
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const managePlan = async (req: any, res: Response, next: NextFunction) => {
  try {
    Plan.findOneAndUpdate(
      {
        _id: req.params.plan_id,
        isDeleted: false,
      },
      {
        status: req.body.status,
        updatedBy: req.id,
      },
      { new: true }
    ).then(async (data) => {
      if (!data) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else if (!data.status) {
        await clearKey(req.params.plan_id);
        return await responseHandler(req, res, message.planDeactivated);
      } else {
        await clearKey(req.params.plan_id);
        return await responseHandler(req, res, message.planActivated);
      }
    });
  } catch (err) {
    next(err);
  }
};

const deletePlan = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Plan.find({
        _id: { $in: req.body.plan_id },
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
        Plan.updateMany(
          { _id: { $in: req.body.plan_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.plan_id.length; i++) {
              await clearKey(req.body.plan_id[i]);
            }
            return await responseHandler(req, res, message.planDeleted);
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
  plansList,
  detail,
  update,
  managePlan,
  deletePlan,
};
