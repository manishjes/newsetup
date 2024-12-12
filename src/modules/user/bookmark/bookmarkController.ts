import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import constants from "@/utils/constants";
import message from "./bookmarkConstant";
import Bookmark from "@/models/bookmark";
import { createError } from "@/helpers/helper";
import { Types } from "mongoose";
import Glossary from "@/models/glossary";
import { clearKey } from "@/config/redis";

const saveBookmark = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data: any = await Bookmark.exists({
      userId: req.id,
      "glossaries.glossaryId": req.body.glossary_id,
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
      const glossary = await Glossary.exists({
        _id: req.body.glossary_id,
        isDeleted: false,
      });

      if (!glossary) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        Bookmark.findOneAndUpdate(
          {
            userId: req.id,
            isDeleted: false,
          },
          {
            userId: req.id,
            $push: {
              glossaries: {
                glossaryId: glossary._id,
              },
            },
          },
          { new: true, upsert: true }
        ).then(async (data) => {
          if (data) {
            await clearKey(req.body.glossary_id);
            return await responseHandler(req, res, message.bookmarkSuccess);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const bookmarkList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Bookmark.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(req.id),
          isDeleted: false,
        },
      },
      {
        $unwind: "$glossaries",
      },
      {
        $lookup: {
          from: "glossaries",
          localField: "glossaries.glossaryId",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$isDeleted", false] }],
                },
              },
            },
          ],
          as: "glossaries.glossary",
        },
      },
      {
        $unwind: "$glossaries.glossary",
      },
      {
        $group: {
          _id: {
            $cond: [
              {
                $regexMatch: {
                  input: { $substr: ["$glossaries.glossary.name", 0, 1] },
                  regex: /^[a-zA-Z]$/,
                },
              },
              { $substr: ["$glossaries.glossary.name", 0, 1] },
              "#",
            ],
          },
          data: {
            $push: {
              id: "$glossaries.glossary._id",
              letter: {
                $cond: [
                  {
                    $regexMatch: {
                      input: { $substr: ["$glossaries.glossary.name", 0, 1] },
                      regex: /^[a-zA-Z]$/,
                    },
                  },
                  { $substr: ["$glossaries.glossary.name", 0, 1] },
                  "#",
                ],
              },
              name: "$glossaries.glossary.name",
              slug: "$glossaries.glossary.slug",
            },
          },
        },
      },
      {
        $sort: { _id: sort },
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
          message.bookmarkListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const deleteBookmark = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      Bookmark.findOneAndUpdate(
        {
          userId: req.id,
          isDeleted: false,
          "glossaries.glossaryId": req.params.glossary_id,
        },
        {
          $pull: {
            glossaries: {
              glossaryId: req.params.glossary_id,
            },
          },
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
        } else {
          await clearKey(req.body.glossary_id);
          return await responseHandler(
            req,
            res,
            message.bookmarkDeletedSuccess
          );
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

export default {
  saveBookmark,
  bookmarkList,
  deleteBookmark,
};
