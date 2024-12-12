import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import { createError, createSlug, validateExcelColumns, removeFile } from "@/helpers/helper";
import excelToJson from "convert-excel-to-json";
import constants from "@/utils/constants";
import message from "./questionConstant";
import Question from "@/models/question";
import mongoose from "mongoose";

const addQuestion = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Question.exists({
      slug: await createSlug(req.body.question_title),
      type: req.body.question_type,
      isDeleted: false,
    });

    if (data) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          message.existQuestion
        )
      );
    } else {
      Question.create({
        title: req.body.question_title,
        slug: await createSlug(req.body.question_title),
        description: req.body.description,
        type: req.body.question_type,
        level: req.body.question_level,
        option: {
          isShuffle: req.body.option_is_shuffle,
          options: req.body.options,
        },
        answer: {
          answers: req.body.answer,
          description: req.body.answer_description,
        },
        hint: req.body.hint,
        points: req.body.points,
        duration: req.body.duration,
        survey: req.body.is_survey,
        createdBy: req.id,
      }).then(async (data) => {
        if (data) {
          return await responseHandler(req, res, message.questionSuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const questionList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Question.aggregate([
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
              ...(req.query.filter.survey
                ? {
                    survey: req.query.filter.survey === "true" ? true : false,
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
          title: 1,
          slug: 1,
          type: 1,
          level: 1,
          survey: 1,
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
          message.questionListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const questionDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.question_id, async () => {
      const data = await Question.findOne({
        _id: req.params.question_id,
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
        message.questionDetailSuccess,
        data
      );
    }
  } catch (err) {
    next(err);
  }
};

const updateQuestion = async (req: any, res: Response, next: NextFunction) => {
  try {
    const question = await getOrSetCache(req.params.question_id, async () => {
      const data = await Question.findOne({
        _id: req.params.question_id,
        isDeleted: false,
      });
      return data;
    });

    if (!question) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      Question.exists({
        _id: { $nin: [question.id] },
        slug: await createSlug(req.body.question_title),
        type: !req.body.question_type ? question.type : req.body.question_type,
        isDeleted: false,
      }).then(async (data) => {
        if (data) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              message.existQuestion
            )
          );
        } else {
          Question.findOneAndUpdate(
            {
              _id: question.id,
            },
            {
              title: req.body.question_title,
              slug: await createSlug(req.body.question_title),
              description: req.body.description,
              type: req.body.question_type,
              level: req.body.question_level,
              "option.isShuffle": req.body.option_is_shuffle,
              "option.options": req.body.options,
              "answer.answers": req.body.answer,
              "answer.description": req.body.answer_description,
              hint: req.body.hint,
              points: req.body.points,
              duration: req.body.duration,
              survey: req.body.is_survey,
              updatedBy: req.id,
            },
            { new: true }
          ).then(async (data) => {
            if (data) {
              await clearKey(req.params.question_id);
              return await responseHandler(
                req,
                res,
                message.questionUpdateSuccess
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

const deleteQuestion = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data: any = await Question.find({
        _id: { $in: req.body.question_id },
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
        Question.updateMany(
          { _id: { $in: req.body.question_id }, isDeleted: false },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.question_id.length; i++) {
              await clearKey(req.body.question_id[i]);
            }
            return await responseHandler(
              req,
              res,
              message.questionDeleteSuccess
            );
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

// const questionBulkUpload = async(req:any, res:Response, next:NextFunction)=>{
//   try{

//     let createdBy = req?.id;
//     const data = excelToJson({
//       sourceFile: req.file.path,
//       sheets: ["questionUpload"],
//       sheetStubs: true,
//     });

//     const columns: any = [
//       "Title",
//       "Description",
//       "Type",
//       "Level",
//       "Option1",
//       "Option2",
//       "Option3",
//       "Option4",
//       "Answer1",
//       "Answer2",
//       "Answer3",
//       "Answer4",
//       "IsShuffle",
//       "Hint",
//       "Points",
//       "Duration",
//       "AnswerDescripton",
//       "IsSurvey",
//     ];
    
//     const excelData = await validateExcelColumns(columns, data["questionUpload"]);
//     excelData.shift();

//     for (const element of excelData) {
//       const title = element["Title"];
//       const slug = await createSlug(title);
//       const type = element["Type"];
//       const level = element["Level"];
      
      
//       // Collect options only if they are not null
//       const options = [];
//       for (let i = 1; i <= 4; i++) {
//         const optionValue = element[`Option${i}`];
//         if (optionValue) {
//           options.push({ value: optionValue.trim() });
//         }
//       }

//       // Collect answers only if they are not null
//       const answers = [];
//       for (let i = 1; i <= 4; i++) {
//         const answerValue = element[`Answer${i}`];
//         if (answerValue) {
//           answers.push({ value: String(answerValue).trim() });
//         }
//       }
//       const hint = element["Hint"];
//       const description = element["Description"]
//       const points = Number.isNaN(Number(element["Points"])) ? 0 : Number(element["Points"]);
//       const duration = Number.isNaN(Number(element["Duration"])) ? 0 : Number(element["Duration"]);
//       const answerdescription = element["AnswerDescripton"]
//       const isshuffle = (typeof element["IsShuffle"] === 'string') 
//       ? element["IsShuffle"].toLowerCase() === 'true' || element["IsShuffle"] === '1'
//       : Boolean(element["IsShuffle"]);
//       const isSurvey = (typeof element["IsSurvey"] === 'string') 
//       ? element["IsSurvey"].toLowerCase() === 'true' || element["IsSurvey"] === '1'
//       : Boolean(element["IsSurvey"]);
      
//               const questionData:any = await Question.findOneAndUpdate(
//             {
//               slug:slug,
//               isDeleted: false,
//             },
//             {
//                title:title,
//                slug:slug,
//                description:description,
//                type:type,
//                level:level,
//                option: {
//                 isShuffle: isshuffle,
//                 options: options,
//               },
//               answer: {
//                 answers: answers,
//                 description:answerdescription,
//               },
//               hint: hint,
//               points: points,
//               duration: duration,
//               survey: isSurvey,
//               createdBy: new mongoose.Types.ObjectId(req?.id),
//               updatedBy: new mongoose.Types.ObjectId(req?.id),
//               isDeleted: false,
//             },
//             { new: true, upsert: true }
//           );
  
//           if (!questionData) throw new Error(message.questionBulkFailed);

     

     
//     }

//     await removeFile(req.file.filename);
//     return res.status(constants.code.success).json({
//       status: constants.status.statusTrue,
//       userStatus: req.status,
//       message: message.questionBulkSuccess,
//     });


//   } catch (error: any) {
//     console.log("errorr", error);

//     return res.status(constants.code.preconditionFailed).json({
//       status: constants.status.statusFalse,
//       userStatus: req.status,
//       message: error.message ? error.message : error
//     });
//   }
// }

const questionBulkUpload = async(req:any, res:Response, next:NextFunction) => {
  try {
    let createdBy = req?.id;
    const data = excelToJson({
      sourceFile: req.file.path,
      sheets: ["questionUpload"],
      sheetStubs: true,
    });

    const columns: any = [
      "Title",
      "Description",
      "Type",
      "Level",
      "Option1",
      "Option2",
      "Option3",
      "Option4",
      "Answer1",
      "Answer2",
      "Answer3",
      "Answer4",
      "IsShuffle",
      "Hint",
      "Points",
      "Duration",
      "AnswerDescripton",
      "IsSurvey",
    ];

    const excelData = await validateExcelColumns(columns, data["questionUpload"]);
    excelData.shift();

    for (const element of excelData) {
      const title = element["Title"];
      const slug = await createSlug(title);
      const type = element["Type"];
      const level = element["Level"];
      
      // Collect options only if they are not null
      const options = [];
      for (let i = 1; i <= 4; i++) {
        const optionValue = element[`Option${i}`];
        if (optionValue) {
          options.push({ value: optionValue.trim() });
        }
      }

      // Collect answers, allowing for multiple valid answers
      const answers = [];
      for (let i = 1; i <= 4; i++) {
          const answerValue = element[`Answer${i}`];
          if (answerValue !== null && answerValue !== undefined && answerValue.trim() !== '' && answerValue.trim().toLowerCase() !== 'null') {
              answers.push({ value: String(answerValue).trim() });
          }
      }

      const hint = element["Hint"];
      const description = element["Description"];
      const points = Number.isNaN(Number(element["Points"])) ? 0 : Number(element["Points"]);
      const duration = Number.isNaN(Number(element["Duration"])) ? 0 : Number(element["Duration"]);
      const answerdescription = element["AnswerDescripton"];
      const isshuffle = (typeof element["IsShuffle"] === 'string') 
        ? element["IsShuffle"].toLowerCase() === 'true' || element["IsShuffle"] === '1'
        : Boolean(element["IsShuffle"]);
      const isSurvey = (typeof element["IsSurvey"] === 'string') 
        ? element["IsSurvey"].toLowerCase() === 'true' || element["IsSurvey"] === '1'
        : Boolean(element["IsSurvey"]);
      
      const questionData:any = await Question.findOneAndUpdate(
        {
          slug: slug,
          isDeleted: false,
        },
        {
          title: title,
          slug: slug,
          description: description,
          type: type,
          level: level,
          option: {
            isShuffle: isshuffle,
            options: options,
          },
          answer: {
            answers: answers, // This will now only contain valid answers
            description: answerdescription,
          },
          hint: hint,
          points: points,
          duration: duration,
          survey: isSurvey,
          createdBy: new mongoose.Types.ObjectId(req?.id),
          updatedBy: new mongoose.Types.ObjectId(req?.id),
          isDeleted: false,
        },
        { new: true, upsert: true }
      );

      if (!questionData) throw new Error(message.questionBulkFailed);
    }

    await removeFile(req.file.filename);
    return res.status(constants.code.success).json({
      status: constants.status.statusTrue,
      userStatus: req.status,
      message: message.questionBulkSuccess,
    });

  } catch (error: any) {
    console.log("errorr", error);

    return res.status(constants.code.preconditionFailed).json({
      status: constants.status.statusFalse,
      userStatus: req.status,
      message: error.message ? error.message : error
    });
  }
}


export default {
  addQuestion,
  questionList,
  questionDetail,
  updateQuestion,
  deleteQuestion,
  questionBulkUpload
};
