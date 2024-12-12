import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { addWhiteSpace, checkAnswer, createError } from "@/helpers/helper";
import constants from "@/utils/constants";
import message from "./activityConstant";
import Activity from "@/models/activity";
import Quiz from "@/models/quiz";
import Question from "@/models/question";
import mongoose, { Types } from "mongoose";
import User from "@/models/user";

const streakList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Activity.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(req.id),
          isDeleted: false,
        },
      },
      {
        $unwind: "$quizzes",
      },
      {
        $facet: {
          streakList: [
            {
              $lookup: {
                from: "quizzes",
                let: { quizId: "$quizzes.quizId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$_id", "$$quizId"] },
                          { $eq: ["$isDeleted", false] },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      questions: { $size: "$question" },
                    },
                  },
                ],
                as: "quizInfo",
              },
            },
            {
              $unwind: {
                path: "$quizInfo",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 0,
                id: "$_id",
                quizId: "$quizzes.quizId",
                isCompleted: {
                  $cond: [
                    {
                      $eq: [
                        { $size: "$quizzes.question" },
                        "$quizInfo.questions",
                      ],
                    },
                    true,
                    false,
                  ],
                },
                updatedOn: {
                  $dateTrunc: {
                    date: "$quizzes.updatedOn",
                    unit: "day",
                  },
                },
              },
            },
            {
              $group: {
                _id: {
                  id: "$id",
                  updatedOn: "$updatedOn",
                },
                quiz: {
                  $push: {
                    quizId: "$quizId",
                    isCompleted: "$isCompleted",
                    updatedOn: "$updatedOn",
                  },
                },
              },
            },
            {
              $addFields: {
                quiz: { $first: "$quiz" },
              },
            },
            {
              $project: {
                _id: "$_id.id",
                dates: {
                  $map: {
                    input: { $range: [1, 8] },
                    as: "i",
                    in: {
                      date: {
                        $dateTrunc: {
                          date: {
                            $cond: [
                              { $lte: ["$$i", { $dayOfWeek: new Date() }] },
                              {
                                $dateSubtract: {
                                  startDate: new Date(),
                                  unit: "day",
                                  amount: { $subtract: ["$$i", 1] },
                                },
                              },
                              {
                                $dateAdd: {
                                  startDate: new Date(),
                                  unit: "day",
                                  amount: {
                                    $subtract: [
                                      "$$i",
                                      { $dayOfWeek: new Date() },
                                    ],
                                  },
                                },
                              },
                            ],
                          },
                          unit: "day",
                        },
                      },
                      isCompleted: {
                        $cond: [
                          {
                            $eq: [
                              "$quiz.updatedOn",
                              {
                                $dateTrunc: {
                                  date: {
                                    $cond: [
                                      {
                                        $lte: [
                                          "$$i",
                                          { $dayOfWeek: new Date() },
                                        ],
                                      },
                                      {
                                        $dateSubtract: {
                                          startDate: new Date(),
                                          unit: "day",
                                          amount: { $subtract: ["$$i", 1] },
                                        },
                                      },
                                      {
                                        $dateAdd: {
                                          startDate: new Date(),
                                          unit: "day",
                                          amount: {
                                            $subtract: [
                                              "$$i",
                                              { $dayOfWeek: new Date() },
                                            ],
                                          },
                                        },
                                      },
                                    ],
                                  },
                                  unit: "day",
                                },
                              },
                            ],
                          },
                          "$quiz.isCompleted",
                          false,
                        ],
                      },
                    },
                  },
                },
              },
            },
            {
              $unwind: "$dates",
            },
            {
              $group: {
                _id: { $toLong: "$dates.date" },
                isCompleted: { $max: "$dates.isCompleted" },
              },
            },
            {
              $sort: { _id: -1 },
            },
            {
              $project: {
                _id: 0,
                date: "$_id",
                isCompleted: "$isCompleted",
              },
            },
          ],
          streaksCount: [
            {
              $group: {
                _id: {
                  $dateTrunc: {
                    date: "$quizzes.updatedOn",
                    unit: "day",
                  },
                },
                count: { $sum: 1 },
              },
            },
            {
              $sort: {
                _id: 1,
              },
            },
            {
              $group: {
                _id: null,
                dates: {
                  $push: {
                    date: "$_id",
                    amount: "$count",
                  },
                },
              },
            },
            {
              $addFields: {
                dates: {
                  $map: {
                    input: "$dates",
                    as: "d",
                    in: {
                      date: "$$d.date",
                      row: {
                        $add: [
                          { $indexOfArray: ["$dates.date", "$$d.date"] },
                          1,
                        ],
                      },
                      dateMinusRow: {
                        $dateSubtract: {
                          startDate: "$$d.date",
                          unit: "day",
                          amount: {
                            $add: [
                              { $indexOfArray: ["$dates.date", "$$d.date"] },
                              1,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $unwind: "$dates",
            },
            {
              $sort: {
                "dates.date": -1,
              },
            },
            {
              $group: {
                _id: "$dates.dateMinusRow",
                date: { $first: "$dates.date" },
                streakCount: { $sum: 1 },
              },
            },
            {
              $sort: {
                date: -1,
              },
            },
            {
              $group: {
                _id: null,
                data: {
                  $push: {
                    _id: "$_id",
                    date: "$date",
                    streakCount: "$streakCount",
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                // id: { $first: "$data._id" },
                // date: { $first: "$data.date" },
                streaks: {
                  $cond: [
                    {
                      $eq: [
                        { $first: "$data.date" },
                        {
                          $toDate: {
                            $dateToString: {
                              format: "%Y-%m-%d",
                              date: new Date(),
                            },
                          },
                        },
                      ],
                    },
                    { $first: "$data.streakCount" },
                    {
                      $cond: [
                        {
                          $eq: [
                            { $first: "$data.date" },
                            {
                              $dateSubtract: {
                                startDate: {
                                  $toDate: {
                                    $dateToString: {
                                      format: "%Y-%m-%d",
                                      date: new Date(),
                                    },
                                  },
                                },
                                unit: "day",
                                amount: 1,
                              },
                            },
                          ],
                        },
                        { $first: "$data.streakCount" },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    ]);

    // const data = await Activity.aggregate([
    //   {
    //     $match: {
    //       isDeleted: false,
    //     },
    //   },
    //   {
    //     $unwind: "$quizzes",
    //   },
    //   {
    //     $lookup: {
    //       from: "quizzes",
    //       let: {
    //         quizId: "$quizzes.quizId",
    //         question: "$quizzes.question",
    //         userId: "$userId",
    //       },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: { $eq: ["$_id", "$$quizId"] },
    //           },
    //         },
    //         {
    //           $lookup: {
    //             from: "quizzes",
    //             localField: "skillId",
    //             foreignField: "skillId",
    //             as: "quizzes",
    //           },
    //         },
    //         {
    //           $project: {
    //             quizId: "$_id",
    //             skillId: 1,
    //             userId: "$$userId",
    //             answeredQuestions: { $size: "$$question" },
    //             totalQuestions: { $size: "$question" },
    //             totalQuizzes: { $size: "$quizzes" },
    //           },
    //         },
    //       ],
    //       as: "quizzes",
    //     },
    //   },
    //   {
    //     $unwind: "$quizzes",
    //   },
    //   {
    //     $match: {
    //       $expr: {
    //         $eq: ["$quizzes.answeredQuestions", "$quizzes.totalQuestions"],
    //       },
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: { skillId: "$quizzes.skillId", userId: "$userId" },
    //       quizzesAttempted: { $sum: 1 },
    //       totalQuizzes: { $first: "$quizzes.totalQuizzes" },
    //     },
    //   },
    //   {
    //     $match: {
    //       $expr: { $eq: ["$quizzesAttempted", "$totalQuizzes"] },
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: "$_id.userId",
    //       newBadges: {
    //         $push: { skillId: "$_id.skillId" },
    //       },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "activities",
    //       localField: "_id",
    //       foreignField: "userId",
    //       as: "existingDoc",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$existingDoc",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $set: {
    //       badges: {
    //         $setUnion: [
    //           { $ifNull: ["$existingDoc.badges", []] },
    //           {
    //             $filter: {
    //               input: "$newBadges",
    //               as: "badge",
    //               cond: {
    //                 $not: {
    //                   $in: [
    //                     "$$badge.skillId",
    //                     { $ifNull: ["$existingDoc.badges.skillId", []] },
    //                   ],
    //                 },
    //               },
    //             },
    //           },
    //         ],
    //       },
    //       walnut: {
    //         transactions: {
    //           $concatArrays: [
    //             { $ifNull: ["$existingDoc.walnut.transactions", []] },
    //             {
    //               $filter: {
    //                 input: {
    //                   $map: {
    //                     input: "$newBadges",
    //                     as: "badge",
    //                     in: {
    //                       title: await addWhiteSpace(
    //                         constants.pointTypes.badges
    //                       ),
    //                       type: constants.pointTypes.badges,
    //                       value: 50,
    //                       transactionType: "credit",
    //                       skillId: "$$badge.skillId",
    //                     },
    //                   },
    //                 },
    //                 as: "newTransaction",
    //                 cond: {
    //                   $not: {
    //                     $in: [
    //                       "$$newTransaction.skillId",
    //                       {
    //                         $ifNull: [
    //                           {
    //                             $map: {
    //                               input: "$existingDoc.walnuts.transactions",
    //                               as: "existingTransaction",
    //                               in: "$$existingTransaction.skillId",
    //                             },
    //                           },
    //                           [],
    //                         ],
    //                       },
    //                     ],
    //                   },
    //                 },
    //               },
    //             },
    //           ],
    //         },
    //       },
    //       xp: {
    //         transactions: {
    //           $concatArrays: [
    //             { $ifNull: ["$existingDoc.xp.transactions", []] },
    //             {
    //               $filter: {
    //                 input: {
    //                   $map: {
    //                     input: "$newBadges",
    //                     as: "badge",
    //                     in: {
    //                       title: await addWhiteSpace(
    //                         constants.pointTypes.badges
    //                       ),
    //                       type: constants.pointTypes.badges,
    //                       value: 1000,
    //                       transactionType: "credit",
    //                       skillId: "$$badge.skillId",
    //                     },
    //                   },
    //                 },
    //                 as: "newTransaction",
    //                 cond: {
    //                   $not: {
    //                     $in: [
    //                       "$$newTransaction.skillId",
    //                       {
    //                         $ifNull: [
    //                           {
    //                             $map: {
    //                               input: "$existingDoc.xp.transactions",
    //                               as: "existingTransaction",
    //                               in: "$$existingTransaction.skillId",
    //                             },
    //                           },
    //                           [],
    //                         ],
    //                       },
    //                     ],
    //                   },
    //                 },
    //               },
    //             },
    //           ],
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $replaceRoot: {
    //       newRoot: {
    //         $mergeObjects: [
    //           "$existingDoc",
    //           { badges: "$badges", walnut: "$walnut", xp: "$xp" },
    //         ],
    //       },
    //     },
    //   },
    //   {
    //     $merge: {
    //       into: "activities",
    //       on: "_id",
    //       whenMatched: "replace",
    //       whenNotMatched: "insert",
    //     },
    //   },
    // ]);

    return await responseHandler(req, res, message.streakListSuccess, data);
  } catch (err) {
    next(err);
  }
};

const giveAnswer = async (req: any, res: Response, next: NextFunction) => {
  try {
    const lives: any = await Activity.findOne(
      { userId: req.id, isDeleted: false },
      { lives: 1 }
    );

    if (lives.lives.value === 0 && !req.premium) {
      return next(
        await createError(constants.code.preconditionFailed, message.outOfLives)
      );
    } else {
      const quiz = await Quiz.findOne({
        _id: req.body.quiz_id,
        "question.questionId": req.body.question_id,
        isDeleted: false,
      });

      if (!quiz) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        const question: any = await Question.findOne({
          _id: req.body.question_id,
          survey: false,
          isDeleted: false,
        });

        if (!question) {
          return next(
            await createError(
              constants.code.dataNotFound,
              constants.message.dataNotFound
            )
          );
        } else {
          const data: any = await Activity.exists({
            userId: req.id,
            "quizzes.quizId": req.body.quiz_id,
            isDeleted: false,
          });

          if (!data) {
            Activity.findOneAndUpdate(
              {
                userId: req.id,
                isDeleted: false,
              },
              {
                $addToSet: {
                  quizzes: {
                    quizId: quiz._id,
                    question: {
                      questionId: question._id,
                      answer: req.body.answer,
                      isCorrect: await checkAnswer(
                        question.answer.answers,
                        req.body.answer
                      ),
                      duration: req.body.duration,
                    },
                  },
                },
              },
              { new: true, upsert: true }
            ).then(async (data) => {
              if (data) {
                if (
                  !(await checkAnswer(question.answer.answers, req.body.answer))
                ) {
                  await Activity.findOneAndUpdate(
                    { userId: req.id, isDeleted: false },
                    {
                      $inc: {
                        "lives.value": -1,
                      },
                      "lives.updatedOn": new Date(),
                    },
                    { new: true }
                  );
                } else {
                  await Activity.findOneAndUpdate(
                    { userId: req.id, isDeleted: false },
                    {
                      userId: req.id,
                      $addToSet: {
                        "walnut.transaction": {
                          title: await addWhiteSpace(
                            constants.pointTypes.learning
                          ),
                          type: constants.pointTypes.learning,
                          transactionType: constants.transactionTypes.credit,
                          value: question.points,
                        },
                        "xp.transaction": {
                          title: await addWhiteSpace(
                            constants.pointTypes.learning
                          ),
                          type: constants.pointTypes.learning,
                          transactionType: constants.transactionTypes.credit,
                          value: question.points * 5,
                        },
                      },
                    },
                    { new: true, upsert: true }
                  ).then(async (data) => {
                    const total: any = await Activity.aggregate([
                      {
                        $match: {
                          userId: new Types.ObjectId(req.id),
                          isDeleted: false,
                        },
                      },
                      {
                        $addFields: {
                          walnutTransaction: {
                            $filter: {
                              input: "$walnut.transaction",
                              as: "item",
                              cond: {
                                $eq: [
                                  "$$item.transactionType",
                                  constants.transactionTypes.credit,
                                ],
                              },
                            },
                          },
                          xpTransaction: {
                            $filter: {
                              input: "$xp.transaction",
                              as: "item",
                              cond: {
                                $eq: [
                                  "$$item.transactionType",
                                  constants.transactionTypes.credit,
                                ],
                              },
                            },
                          },
                        },
                      },
                      {
                        $project: {
                          _id: 0,
                          walnut: {
                            $sum: "$walnutTransaction.value",
                          },
                          xp: {
                            $sum: "$xpTransaction.value",
                          },
                        },
                      },
                    ]);

                    await Activity.findOneAndUpdate(
                      {
                        userId: req.id,
                        isDeleted: false,
                      },
                      {
                        "walnut.total": total[0].walnut,
                        "walnut.remaining": total[0].walnut,
                        "xp.total": total[0].xp,
                        "xp.remaining": total[0].xp,
                      },
                      { new: true }
                    );
                  });
                }

                return await responseHandler(
                  req,
                  res,
                  message.answeredSuccess,
                  {
                    isCorrect: await checkAnswer(
                      question.answer.answers,
                      req.body.answer
                    ),
                    correctAnswer: question.answer.answers[0].value,
                    description: question.answer.description,
                  }
                );
              }
            });
          } else {
            const checkQuestion: any = await Activity.exists({
              userId: req.id,
              quizzes: {
                $elemMatch: {
                  quizId: quiz._id,
                  "question.questionId": question._id,
                },
              },
              isDeleted: false,
            });

            if (checkQuestion) {
              return next(
                await createError(
                  constants.code.preconditionFailed,
                  message.alreadyAnswered
                )
              );
            } else {
              Activity.findOneAndUpdate(
                {
                  userId: req.id,
                  isDeleted: false,
                },
                {
                  $addToSet: {
                    "quizzes.$[xxx].question": {
                      questionId: question._id,
                      answer: req.body.answer,
                      isCorrect: await checkAnswer(
                        question.answer.answers,
                        req.body.answer
                      ),
                      duration: req.body.duration,
                    },
                  },
                },
                {
                  arrayFilters: [
                    {
                      "xxx.quizId": quiz._id,
                    },
                  ],
                }
              ).then(async (data) => {
                if (data) {
                  if (
                    !(await checkAnswer(
                      question.answer.answers,
                      req.body.answer
                    ))
                  ) {
                    await Activity.findOneAndUpdate(
                      { userId: req.id, isDeleted: false },
                      {
                        $inc: {
                          "lives.value": -1,
                        },
                        "lives.updatedOn": new Date(),
                      },
                      { new: true }
                    );
                  } else {
                    await Activity.findOneAndUpdate(
                      { userId: req.id, isDeleted: false },
                      {
                        userId: req.id,
                        $addToSet: {
                          "walnut.transaction": {
                            title: await addWhiteSpace(
                              constants.pointTypes.learning
                            ),
                            type: constants.pointTypes.learning,
                            transactionType: constants.transactionTypes.credit,
                            value: question.points,
                          },
                          "xp.transaction": {
                            title: await addWhiteSpace(
                              constants.pointTypes.learning
                            ),
                            type: constants.pointTypes.learning,
                            transactionType: constants.transactionTypes.credit,
                            value: question.points * 5,
                          },
                        },
                      },
                      { new: true, upsert: true }
                    ).then(async (data) => {
                      const total: any = await Activity.aggregate([
                        {
                          $match: {
                            userId: new Types.ObjectId(req.id),
                            isDeleted: false,
                          },
                        },
                        {
                          $addFields: {
                            walnutTransaction: {
                              $filter: {
                                input: "$walnut.transaction",
                                as: "item",
                                cond: {
                                  $eq: [
                                    "$$item.transactionType",
                                    constants.transactionTypes.credit,
                                  ],
                                },
                              },
                            },
                            xpTransaction: {
                              $filter: {
                                input: "$xp.transaction",
                                as: "item",
                                cond: {
                                  $eq: [
                                    "$$item.transactionType",
                                    constants.transactionTypes.credit,
                                  ],
                                },
                              },
                            },
                          },
                        },
                        {
                          $project: {
                            _id: 0,
                            walnut: {
                              $sum: "$walnutTransaction.value",
                            },
                            xp: {
                              $sum: "$xpTransaction.value",
                            },
                          },
                        },
                      ]);

                      await Activity.findOneAndUpdate(
                        {
                          userId: req.id,
                          isDeleted: false,
                        },
                        {
                          "walnut.total": total[0].walnut,
                          "walnut.remaining": total[0].walnut,
                          "xp.total": total[0].xp,
                          "xp.remaining": total[0].xp,
                        },
                        { new: true }
                      );
                    });
                  }

                  return await responseHandler(
                    req,
                    res,
                    message.answeredSuccess,
                    {
                      isCorrect: await checkAnswer(
                        question.answer.answers,
                        req.body.answer
                      ),
                      correctAnswer: question.answer.answers[0].value,
                      description: question.answer.description,
                    }
                  );
                }
              });
            }
          }
        }
      }
    }
  } catch (err) {
    next(err);
  }
};

const refillLives = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data: any = await Activity.findOne(
      {
        userId: req.id,
        isDeleted: false,
      },
      { walnut: 1, lives: 1 }
    );

    if (data.lives.value > 0) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          message.alreadyHaveLife
        )
      );
    } else if (data.walnut.remaining < 120) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          message.notEnoughWalnut
        )
      );
    } else {
      await Activity.findOneAndUpdate(
        { userId: req.id, isDeleted: false },
        {
          $addToSet: {
            "walnut.transaction": {
              title: await addWhiteSpace(constants.pointTypes.lifeRefill),
              type: constants.pointTypes.lifeRefill,
              transactionType: constants.transactionTypes.debit,
              value: 120,
            },
          },
        },
        { new: true, upsert: true }
      ).then(async (data) => {
        const walnut: any = await Activity.aggregate([
          {
            $match: {
              userId: new Types.ObjectId(req.id),
              isDeleted: false,
            },
          },
          {
            $addFields: {
              transaction: {
                $filter: {
                  input: "$walnut.transaction",
                  as: "item",
                  cond: {
                    $eq: [
                      "$$item.transactionType",
                      constants.transactionTypes.debit,
                    ],
                  },
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              total: {
                $sum: "$transaction.value",
              },
            },
          },
        ]);

        await Activity.findOneAndUpdate(
          {
            userId: req.id,
            isDeleted: false,
          },
          {
            lives: {
              value: 3,
              updatedOn: new Date(),
            },
            $inc: {
              "walnut.remaining": -walnut[0].total,
            },
          },
          { new: true }
        );
      });

      return await responseHandler(req, res, message.refilledSuccess);
    }
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


   

    const userPoints: any = await User.findOne({
      _id: new mongoose.Types.ObjectId(req.id),
      isDeleted:false
    }, { name: 1, _id:1, photo:1 })

    const userActivityData:any = await Activity.findOne({
      userId: new mongoose.Types.ObjectId(req.id),
      isDeleted:false
    }, { xp: 1, _id:0 })

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

        const finalData = {
          leaderboard: data,
          existing:  {
            id: userPoints ._id,
            xp: userActivityData .xp.total,
            name: userPoints .name,
            photo: userPoints.photo
          },
        };
        return await responseHandler(
          req,
          res,
          message.leaderboardSuccess,
          finalData
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

export default {
  streakList,
  giveAnswer,
  refillLives,
  leaderboard,
};
