import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { createError } from "@/helpers/helper";
import { getOrSetCache } from "@/config/redis";
import constants from "@/utils/constants";
import message from "./quizConstant";
import Quiz from "@/models/quiz";
import { Types } from "mongoose";

const quizList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Quiz.aggregate([
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
              ...(req.query.filter.type
                ? {
                    type: req.query.filter.type,
                  }
                : {}),
            },
            {
              ...(req.query.filter.level
                ? {
                    level: req.query.filter.level,
                  }
                : {}),
            },
            {
              ...(req.query.filter.skillId
                ? {
                    skillId: new Types.ObjectId(req.query.filter.skillId),
                  }
                : {}),
            },
          ],
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "activities",
          let: { quizId: "$_id", userId: new Types.ObjectId(req.id) },
          pipeline: [
            {
              $unwind: {
                path: "$quizzes",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$quizzes.quizId", "$$quizId"] },
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $project: {
                answeredQuestion: { $size: "$quizzes.question" },
                quizId: "$quizzes.quizId",
              },
            },
          ],
          as: "myQuizzes",
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          skillId: "$skillId",
          name: "$name",
          slug: "$slug",
          image: "$image",
          level: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$level", constants.levels.easy] },
                  then: "Level 1",
                },
                {
                  case: { $eq: ["$level", constants.levels.medium] },
                  then: "Level 2",
                },
                {
                  case: { $eq: ["$level", constants.levels.hard] },
                  then: "Level 3",
                },
                {
                  case: { $eq: ["$level", constants.levels.expert] },
                  then: "Level 4",
                },
                {
                  case: { $eq: ["$level", constants.levels.master] },
                  then: "Level 5",
                },
                {
                  case: { $eq: ["$level", constants.levels.extreme] },
                  then: "Level 6",
                },
              ],
            },
          },
          totalQuestion: { $size: "$question" },
          answeredQuestion: { $first: "$myQuizzes.answeredQuestion" },
          progress: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $first: "$myQuizzes.answeredQuestion" },
                      { $size: "$question" },
                    ],
                  },
                  100,
                ],
              },
              2,
            ],
          },
          isCompleted: {
            $cond: [
              {
                $eq: [
                  { $size: "$question" },
                  { $first: "$myQuizzes.answeredQuestion" },
                ],
              },
              true,
              false,
            ],
          },
          isLock: {
            $cond: [
              {
                $eq: [
                  { $size: "$question" },
                  { $first: "$myQuizzes.answeredQuestion" },
                ],
              },
              false,
              true,
            ],
          },
        },
      },
      {
        $sort: {
          level: 1,
          createdAt: 1,
        },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              id: "$id",
             skillId: "$skillId",
              name: "$name",
              slug: "$slug",
              image: "$image",
              level: "$level",
              totalQuestion: "$totalQuestion",
              answeredQuestion: "$answeredQuestion",
              progress: "$progress",
              isCompleted: "$isCompleted",
              isLock: "$isLock",
            },
          },
        },
      },
      {
        $addFields: {
          next: {
            $function: {
              body: function (data: any) {
                let lastIndex = 0;
                for (let i = 0; i < data.length; i++) {
                  if (data[i].isCompleted === true) {
                    lastIndex = i + 1;
                  }
                }
                return lastIndex === data.length && lastIndex !== 0
                  ? lastIndex - 1
                  : lastIndex;
              },
              args: ["$data"],
              lang: "js",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          data: 1,
          next: {
            $arrayElemAt: ["$data", "$next"],
          },
        },
      },
      { $unwind: "$data" },
      {
        $group: {
          _id: "$data.level",
          data: {
            $push: {
              id: "$data.id",
              skillId: "$data.skillId",
              name: "$data.name",
              slug: "$data.slug",
              image: "$data.image",
              level: "$data.level",
              totalQuestion: "$data.totalQuestion",
              answeredQuestion: "$data.answeredQuestion",
              progress: "$data.progress",
              isCompleted: "$data.isCompleted",
              isLock: "$data.isLock",
            },
          },
          next: { $first: "$next" },
        },
      },
      {
        $sort: { _id: sort },
      },
      {
        $project: {
          _id: 0,
          level: "$_id",
          data: 1,
          next: {
            $setField: {
              field: "isLock",
              value: false,
              input: {
                $first: {
                  $filter: {
                    input: "$data",
                    as: "data",
                    cond: {
                      $eq: ["$$data.id", "$next.id"],
                    },
                  },
                },
              },
            },
          },
          completed: { $allElementsTrue: ["$data.isCompleted"] },
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
        return await responseHandler(req, res, message.quizListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const quizDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.quiz_id, async () => {
      const data = await Quiz.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(req.params.quiz_id),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "questions",
            localField: "question.questionId",
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
                  title: 1,
                  description: 1,
                  type: 1,
                  option: 1,
                  duration: 1,
                  survey: 1,
                },
              },
            ],
            as: "question",
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id",
            image: 1,
            name: 1,
            description: 1,
            question: 1,
          },
        },
      ]);
      return data[0];
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(req, res, message.quizDetailSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

export default {
  quizList,
  quizDetail,
};
