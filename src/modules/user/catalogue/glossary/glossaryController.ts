import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { createError } from "@/helpers/helper";
import { getOrSetCache } from "@/config/redis";
import constants from "@/utils/constants";
import message from "./glossaryConstant";
import Glossary from "@/models/glossary";
import { Types } from "mongoose";

const glossaryList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Glossary.aggregate([
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
          ],
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              {
                $regexMatch: {
                  input: { $substr: ["$name", 0, 1] },
                  regex: /^[a-zA-Z]$/,
                },
              },
              { $substr: ["$name", 0, 1] },
              "#",
            ],
          },
          data: {
            $push: {
              id: "$_id",
              letter: {
                $cond: [
                  {
                    $regexMatch: {
                      input: { $substr: ["$name", 0, 1] },
                      regex: /^[a-zA-Z]$/,
                    },
                  },
                  { $substr: ["$name", 0, 1] },
                  "#",
                ],
              },
              name: "$name",
              slug: "$slug",
              description: "$description",
              longdescription: "$longdescription",
              image: "$image",
              logo: "$logo"
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
          message.glossaryListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const glossaryDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.glossary_id, async () => {
      const data = await Glossary.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(req.params.glossary_id),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "bookmarks",
            let: { glossaryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$userId", new Types.ObjectId(req.id)] },
                      { $in: ["$$glossaryId", "$glossaries.glossaryId"] },
                      { $eq: ["$isDeleted", false] },
                    ],
                  },
                },
              },
            ],
            as: "bookmark",
          },
        },
        {
          $addFields: {
            isBookmarked: { $gt: [{ $size: "$bookmark" }, 0] },
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id",
            name: 1,
            description: 1,
            longdescription:1,
            image:1,
            logo:1,
            isBookmarked: 1,
          },
        },
      ]);
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
        message.glossaryDetailSuccess,
        data
      );
    }
  } catch (err) {
    next(err);
  }
};

export default {
  glossaryList,
  glossaryDetail,
};
