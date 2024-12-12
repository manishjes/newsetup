import { Request, Response, NextFunction } from "express";
import constants from "@/utils/constants";
import message from "./templateConstant";
import Template from "@/models/template";
import { createError, createSlug } from "@/helpers/helper";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";

const create = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Template.exists({
      slug: req.body.title && (await createSlug(req.body.title)),
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
      Template.create({
        title: req.body.title,
        slug: await createSlug(req.body.title),
        type: req.body.type,
        templateId: req.body.template_id,
        subject: req.body.subject,
        body: req.body.body,
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
          return await responseHandler(req, res, message.templateSuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const templatesList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Template.aggregate([
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
                {
                  subject: {
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
          title: 1,
          slug: 1,
          type: 1,
          templateId: 1,
          subject: 1,
          body: 1,
          status: 1,
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
          message.templateListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const detail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.template_id, async () => {
      const data = await Template.findOne({
        _id: req.params.template_id,
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
        message.templateDetailSuccess,
        data
      );
    }
  } catch (err) {
    next(err);
  }
};

const update = async (req: any, res: Response, next: NextFunction) => {
  try {
    const template = await getOrSetCache(req.params.template_id, async () => {
      const data = await Template.findOne({
        _id: req.params.template_id,
        isDeleted: false,
      });
      return data;
    });

    if (!template) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      Template.exists({
        $and: [
          { slug: req.body.title && (await createSlug(req.body.title)) },
          { type: req.body.type },
          { _id: { $nin: [template.id] } },
          { isDeleted: false },
        ],
      }).then(async (data) => {
        if (data) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              message.alreadyExist
            )
          );
        } else {
          Template.findOneAndUpdate(
            {
              _id: template.id,
            },
            {
              title: req.body.title,
              slug: await createSlug(req.body.title),
              type: req.body.type,
              templateId: req.body.template_id,
              subject: req.body.subject,
              body: req.body.body,
              updatedBy: req.id,
            },
            { new: true }
          ).then(async (data) => {
            if (data) {
              await clearKey(req.params.template_id);
              return await responseHandler(
                req,
                res,
                message.templateUpdateSuccess
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

const manageTemplate = async (req: any, res: Response, next: NextFunction) => {
  try {
    Template.findOneAndUpdate(
      {
        _id: req.params.template_id,
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
        await clearKey(req.params.template_id);
        return await responseHandler(req, res, message.templateDeactivated);
      } else {
        await clearKey(req.params.template_id);
        return await responseHandler(req, res, message.templateActivated);
      }
    });
  } catch (err) {
    next(err);
  }
};

const deleteTemplate = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Template.find({
        _id: { $in: req.body.template_id },
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
        Template.updateMany(
          { _id: { $in: req.body.template_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.template_id.length; i++) {
              await clearKey(req.body.template_id[i]);
            }
            return await responseHandler(req, res, message.templateDeleted);
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
  templatesList,
  detail,
  update,
  manageTemplate,
  deleteTemplate,
};
