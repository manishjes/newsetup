import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import constants from "@/utils/constants";
import message from "./skillConstant";
import { createError } from "@/helpers/helper";
import Skill from "@/models/skill";
import mongoose, { Types } from "mongoose";
import Activity from "@/models/activity";
import Quiz from "@/models/quiz";

const skillList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Skill.aggregate([
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
              ...(req.query.filter.categoryId
                ? {
                    categoryId: new Types.ObjectId(req.query.filter.categoryId),
                  }
                : {}),
            },
          ],
          isDeleted: false,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          slug: 1,
          isPremium: 1,
          image: 1,
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
        return await responseHandler(req, res, message.skillListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};


const skillLearningList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Skill.aggregate([
      {
        $match: {
          isDeleted: false,
          categoryId: new mongoose.Types.ObjectId(req.body.categoryId)
        },
      },
      {
        $lookup:{
          from: "quizzes",
          let: {skillId: "$_id"},
          pipeline:[
            {
              $match:{
                $expr:{$eq: ["$skillId", "$$skillId"]}
              }
            },
            {
              $count: "quizCount",
            },
          ],
          as: "skillData"
        }
      },
      {
        $unwind: {
          path: "$skillData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          quizCount: { $ifNull: ["$skillData.quizCount", 0] },
        },
      },
     
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          slug: 1,
          description:1,
          isPremium: 1,
          image: 1,
          quizCount:1
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
        return await responseHandler(req, res, message.skillListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const skillCompletedQuiz = async(req:any, res:Response, next:NextFunction)=>{
  try{
    const completedQuizzes = await Quiz.aggregate([
      {
        $match: {
          skillId: new mongoose.Types.ObjectId(req.body.skillId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "activities",
          let: { quizId: "$_id", userId: new mongoose.Types.ObjectId(req.id) },
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
          name: "$name",
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
            $eq: [
              { $size: "$question" },
              { $first: "$myQuizzes.answeredQuestion" },
            ],
          },
        },
      },
      {
        $match: {
          isCompleted: true, 
        },
      },
    ]);

    const totalCompleted = completedQuizzes.length;

    return res.status(200).json({
      success: true,
      data: {
        totalCompleted,
      },
    });

  } catch (err) {
    next(err);
  }
}

const ActiveSkill = async(req:any, res:Response, next:NextFunction)=>{
  try{
  const data=  await Activity.aggregate([
      {
        $match:{
          isDeleted:false,
          userId: new mongoose.Types.ObjectId(req.id)
        }
      },
      {
        $project: {
          lastQuizId: {
            $arrayElemAt: ['$quizzes.quizId', -1] 
          }
        }
      },
      {
        $lookup:{
          from: "quizzes",
          let: {quizId:"$lastQuizId"},
          pipeline:[
            {
              $match:{
                $expr: {$eq:["$_id", "$$quizId"]},
                isDeleted:false
              }
            }
          ],
          as: "quizDetail"
        }
      },
      {
        $unwind: {
          path: "$quizDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project:{
          _id:0,
          skillId: "$quizDetail.skillId",
        }
      }
    ])
    if (!data.length) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(req, res, message.activeSkill, data);
    }
  } catch(err){
    next(err)
  }
}

const skillListwithoutPremium = async(req:any, res:Response, next:NextFunction)=>{
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Skill.aggregate([
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
              ...(req.query.filter.categoryId
                ? {
                    categoryId: new Types.ObjectId(req.query.filter.categoryId),
                  }
                : {}),
            },
          ],
          isPremium:false,
          isDeleted: false,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          slug: 1,
          isPremium: 1,
          image: 1,
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
        return await responseHandler(req, res, message.skillListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
}

export default {
  skillList,
  skillLearningList,
  skillCompletedQuiz,
  ActiveSkill,
  skillListwithoutPremium
};
