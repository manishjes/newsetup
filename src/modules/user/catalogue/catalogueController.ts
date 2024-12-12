import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import { createError } from "@/helpers/helper";
import Page from "@/models/page"
import constants from "@/utils/constants";
import message from "./catalogueConstant";
import Category from "@/models/category";
import Skill from "@/models/skill";
import mongoose, { Types } from "mongoose";
import Activity from "@/models/activity";



const listpages = async(req:Request, res:Response, next:NextFunction)=>{
    try{
     
        Page.aggregate([
            {
                $match:{
                  slug: { $in: [constants.pageSlug.termscondition, constants.pageSlug.privacypolicy] },
                    isDeleted: false
                }
            },
            {
                $project:{
                    _id: 0,
                    id: "$_id",
                    title:1,
                    slug: 1,
                    body:1
                }
            },
            {
                $sort: { createdAt: -1 },
              },
        ]).then(async (data) => {
            if (!data) {
              return next(
                await createError(
                  constants.code.dataNotFound,
                  constants.message.dataNotFound
                )
              );
            } else {
              return await responseHandler(req, res, message.pageListsuccess, data);
            }
          });
    } catch(err){
        next(err)
    }
}


const categoryInterstList = async(req:any, res:Response, next:NextFunction)=>{
  try{
     const interstList:any = await Activity.findOne({
      isDeleted:false,
      userId: new mongoose.Types.ObjectId(req.id)
     })
     const categoryIds:any = await interstList.interests.map((interest:any) => interest.categoryId);
     await Category.aggregate([
      {
        $match:{
          isDeleted:false,
          _id: {
            $in: categoryIds,
          },
        }
      },
      {
        $lookup: {
          from: "skills",
          let: { skillId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$categoryId", "$$skillId"] },
                isDeleted: false,
              },
            },
            {
              $count: "usageCount",
            },
          ],
          as: "usage",
        },
      },
      {
        $addFields: {
          skillCount: { $ifNull: [{ $arrayElemAt: ["$usage.usageCount", 0] }, 0] },
        },
      },
      {
        $project:{
            _id: 0,
            id: "$_id",
            name:1,
            image: 1,
            skillCount:1
        }
    },
  
]).then(async (data) => {
    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(req, res, message.categoryInterstList, data);
    }
  })
  }catch(err){
    next(err)
  }
}

const categoryList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.category_id, async () => {
      const data = await Category.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(req.params.category_id),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "skills",
            let: { categoryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$userId", new Types.ObjectId(req.id)] },
                      { $eq: ["$$categoryId", "$categoryId"] }, 
                      { $eq: ["$isDeleted", false] }
                    ],
                  },
                },
              },
            ],
            as: "skills",
          },
        },
        {
          $project: {
            _id: 0,
            name: 1, 
            skillCount: {
              $size: {
                $ifNull: ['$skills', []] 
              }
            }
          }
        }
      ]);
      return data;
    });

    if (!data || data.length === 0) {
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
        message.categoryListSuccess,
        data
      );
    }
  } catch (err) {
    next(err);
  }
};

// const categoryList = async (req: Request, res: Response, next: NextFunction) => {
//   try {
    
//       const categories = await Category.aggregate([
//           {
//               $lookup: {
//                   from: 'skills', 
//                   localField: '_id',
//                   foreignField: 'categoryId', 
//                   as: 'skills'
//               }
//           },
//           {
//               $project: {
//                   _id: 0,
//                   // id: '$_id',
//                   name: 1,
//                   // skills: 1, 
//                   skillCount: { $size: '$skills' } 
//               }
//           },
//           {
//               $sort: { createdAt: -1 } 
//           }
//       ]);

//       if (!categories.length) {
//           return next(
//               createError(
//                   constants.code.dataNotFound,
//                   constants.message.dataNotFound
//               )
//           );
//       } else {
//           return responseHandler(req, res, message.categoryListSuccess, categories);
//       }
//   } catch (err) {
//       next(err);
//   }
// };



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


const skillDetails = async (req:any, res:Response, next: NextFunction) =>{
  try {
    const skillId = req.params.skillId;
    const userId = req.user.id; 

    const data = await Skill.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(skillId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'activities',
          let: { skillId: new Types.ObjectId(skillId), userId: new Types.ObjectId(userId) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $ne: ['$isDeleted', true] },
                  ],
                },
              },
            },
            {
              $project: {
                quizzes: {
                  $filter: {
                    input: '$quizzes',
                    as: 'quiz',
                    cond: {
                      $eq: ['$$quiz.quizId', '$$skillId'],
                    },
                  },
                },
                walnut: '$walnut.total', // Get total walnut points
              },
            },
          ],
          as: 'userActivities',
        },
      },
      {
        $project: {
          _id: 0,
          skillId: '$_id',
          name: '$name',
          description: '$description',
          totalQuizzes: {
            $size: '$userActivities.quizzes',
          },
          completedQuizzes: {
            $size: {
              $filter: {
                input: '$userActivities.quizzes',
                as: 'quiz',
                cond: {
                  $eq: [
                    { $size: '$$quiz.question' },
                    {
                      $size: {
                        $filter: {
                          input: '$$quiz.question',
                          as: 'q',
                          cond: { $eq: ['$$q.isCorrect', true] },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          walnutPoints: {
            $sum: {
              $map: {
                input: '$userActivities',
                as: 'activity',
                in: '$$activity.walnut', 
              },
            },
          },
        },
      },
    ]);

    if (!data.length) {
      return next(createError(constants.code.dataNotFound, constants.message.dataNotFound));
    }

    return responseHandler(req, res, "Skill details retrieved successfully", data[0]);
  } catch (err) {
    next(err);
  }
}


export default {
    listpages,
    categoryList,
    skillList,
    skillDetails,
    categoryInterstList
};
