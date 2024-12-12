import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import {
  createError,
  createSlug,
  getFileName,
  imageURL,
  removeImage,
} from "@/helpers/helper";
import constants from "@/utils/constants";
import message from "./quizConstant";
import Quiz from "@/models/quiz";
import Question from "@/models/question";
import { Types } from "mongoose";

const addQuiz = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Quiz.exists({
      skillId: req.body.skill_id && req.body.skill_id,
      slug: await createSlug(req.body.quiz_name),
      type: req.body.quiz_type,
      isDeleted: false,
    });

    if (data) {
      req.file && (await removeImage(req.file.filename));
      return next(
        await createError(constants.code.preconditionFailed, message.existQuiz)
      );
    } else {
      const questions: any = await Question.find(
        {
          _id: { $in: req.body.question_id },
          level: req.body.quiz_level,
          survey: false,
          isDeleted: false,
        },
        { _id: 0, questionId: "$_id" }
      );

      if (!questions.length) {
        req.file && (await removeImage(req.file.filename));
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        Quiz.create({
          "image.localUrl":
            req.file && (await imageURL(req.headers.host, req.file.filename)),
          skillId: req.body.skill_id && req.body.skill_id,
          name: req.body.quiz_name,
          slug: await createSlug(req.body.quiz_name),
          type: req.body.quiz_type,
          level: req.body.quiz_level,
          description: JSON.parse(req.body.description),
          question: questions,
          createdBy: req.id,
        }).then(async (data) => {
          if (data) {
            return await responseHandler(req, res, message.quizSuccess);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

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
          slug: 1,
          type: 1,
          level: 1,
          image: 1,
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
      const data = await Quiz.findOne({
        _id: req.params.quiz_id,
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
      return await responseHandler(req, res, message.quizDetailSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const updateQuiz = async (req: any, res: Response, next: NextFunction) => {
  try {
    const quiz: any = await Quiz.findOne({
      _id: req.params.quiz_id,
      isDeleted: false,
    });

    if (!quiz) {
      req.file && (await removeImage(req.file.filename));
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      Quiz.exists({
        _id: { $nin: [quiz._id] },
        slug: await createSlug(req.body.quiz_name),
        skillId: req.body.skill_id && req.body.skill_id,
        type: req.body.quiz_type,
        isDeleted: false,
      }).then(async (data) => {
        if (data) {
          req.file && (await removeImage(req.file.filename));
          return next(
            await createError(
              constants.code.preconditionFailed,
              message.existQuiz
            )
          );
        } else {
          const questions: any = await Question.find(
            {
              _id: { $in: req.body.question_id },
              isDeleted: false,
            },
            { _id: 0, questionId: "$_id" }
          );

          if (!questions.length) {
            req.file && (await removeImage(req.file.filename));
            return next(
              await createError(
                constants.code.dataNotFound,
                constants.message.dataNotFound
              )
            );
          } else {
            req.file &&
              quiz.image.localUrl &&
              (await removeImage(await getFileName(quiz.image.localUrl)));

            Quiz.findOneAndUpdate(
              {
                _id: quiz._id,
              },
              {
                "image.localUrl":
                  req.file &&
                  (await imageURL(req.headers.host, req.file.filename)),
                skillId: req.body.skill_id && req.body.skill_id,
                name: req.body.quiz_name,
                slug: await createSlug(req.body.quiz_name),
                type: req.body.quiz_type,
                level: req.body.quiz_level,
                description: JSON.parse(req.body.description),
                question: questions,
                updatedBy: req.id,
              },
              { new: true }
            ).then(async (data) => {
              if (data) {
                await clearKey(req.params.quiz_id);
                return await responseHandler(
                  req,
                  res,
                  message.quizUpdateSuccess
                );
              }
            });
          }
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const deleteQuiz = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Quiz.find({
        _id: { $in: req.body.quiz_id },
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
        Quiz.updateMany(
          { _id: { $in: req.body.quiz_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.quiz_id.length; i++) {
              await clearKey(req.body.quiz_id[i]);
            }
            return await responseHandler(req, res, message.quizDeleteSuccess);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

export default {
  addQuiz,
  quizList,
  quizDetail,
  updateQuiz,
  deleteQuiz,
};
