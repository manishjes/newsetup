import { Request, Response, NextFunction } from "express";
import { createError, createSlug } from "@/helpers/helper";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import constants from "@/utils/constants";
import message from "./pageConstant";
import Page from "@/models/page";

const create = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Page.exists({
      slug: req.body.title && (await createSlug(req.body.title)),
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
      Page.create({
        title: req.body.title,
        slug: await createSlug(req.body.title),
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
          return await responseHandler(req, res, message.pageSuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const pagesList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Page.aggregate([
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
        return await responseHandler(req, res, message.pageListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const detail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.page_id, async () => {
      const data = await Page.findOne({
        _id: req.params.page_id,
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
      return await responseHandler(req, res, message.pageDetailSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const update = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = await getOrSetCache(req.params.page_id, async () => {
      const data = await Page.findOne({
        _id: req.params.page_id,
        isDeleted: false,
      });
      return data;
    });

    if (!page) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      Page.exists({
        $and: [
          { slug: req.body.title && (await createSlug(req.body.title)) },
          { _id: { $nin: [page.id] } },
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
          Page.findOneAndUpdate(
            {
              _id: page.id,
            },
            {
              title: req.body.title,
              slug: req.body.title && (await createSlug(req.body.title)),
              body: req.body.body,
              updatedBy: req.id,
            },
            { new: true }
          ).then(async (data) => {
            if (data) {
              await clearKey(req.params.page_id);
              return await responseHandler(req, res, message.pageUpdateSuccess);
            }
          });
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const managePage = async (req: any, res: Response, next: NextFunction) => {
  try {
    Page.findOneAndUpdate(
      {
        _id: req.params.page_id,
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
        await clearKey(req.params.page_id);
        return await responseHandler(req, res, message.pageDeactivated);
      } else {
        await clearKey(req.params.page_id);
        return await responseHandler(req, res, message.pageActivated);
      }
    });
  } catch (err) {
    next(err);
  }
};

const deletePage = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Page.find({
        _id: { $in: req.body.page_id },
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
        Page.updateMany(
          { _id: { $in: req.body.page_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.page_id.length; i++) {
              await clearKey(req.body.page_id[i]);
            }
            return await responseHandler(req, res, message.pageDeleted);
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
  pagesList,
  detail,
  update,
  managePage,
  deletePage,
};
