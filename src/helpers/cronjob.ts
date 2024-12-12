import Activity from "@/models/activity";
import Setting from "@/models/setting";
import User from "@/models/user";
import Skill from "@/models/skill";
import Subscription from "@/models/subscription";
import { notificationQueue } from "./queue/queue";
import constants from "@/utils/constants";
import { schedule } from "node-cron";
import mongoose from "mongoose";

// Abort maintenance
const abortMaintenance = async () => {
  await Setting.findOneAndUpdate(
    { "maintenance.status": true, "maintenance.time": { $lt: new Date() } },
    {
      $set: {
        maintenance: {
          $unset: { time: 1 },
          status: false,
        },
      },
    },
    { new: true }
  );
};

// Refill lives
const refillLives = async () => {
  const currentTime = new Date();

  const data = await Activity.aggregate([
    {
      $match: {
        "lives.value": 0,
        isDeleted: false,
      },
    },
    {
      $project: {
        _id: 0,
        id: "$_id",
        userId: "$userId",
        timeDifference: {
          $dateDiff: {
            startDate: "$lives.updatedOn",
            endDate: currentTime,
            unit: "minute",
          },
        },
      },
    },
  ]);

  for (let i = 0; i < data.length; i++) {
    if (data[i].timeDifference >= 120) {
      await Activity.findOneAndUpdate(
        {
          _id: data[i].id,
          userId: data[i].userId,
          isDeleted: false,
        },
        {
          lives: {
            value: 3,
            updatedOn: new Date(),
          },
        },
        { new: true }
      );

      const notificationPayload = {
        to: data[i].userId,
        title: constants.templateTitle.lifeRefill,
        data: {},
      };

      notificationQueue.add(data[i].userId, notificationPayload, {
        removeOnComplete: true,
        removeOnFail: true,
      });
    }
  }
};

// Check Skills
const checkSkill = async () => {
  const data = await Activity.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $unwind: "$quizzes",
    },
    {
      $lookup: {
        from: "quizzes",
        let: {
          quizId: "$quizzes.quizId",
          question: "$quizzes.question",
          userId: "$userId",
        },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$quizId"] },
            },
          },
          {
            $lookup: {
              from: "quizzes",
              localField: "skillId",
              foreignField: "skillId",
              as: "quizzes",
            },
          },
          {
            $project: {
              quizId: "$_id",
              skillId: 1,
              userId: "$$userId",
              answerdQuestions: { $size: "$$question" },
              totalQuestions: { $size: "$question" },
              totalQuizzes: { $size: "$quizzes" },
            },
          },
        ],
        as: "quizzes",
      },
    },
    {
      $unwind: "$quizzes",
    },
    {
      $match: {
        $expr: {
          $and: [
            {
              $eq: ["$quizzes.answerdQuestions", "$quizzes.totalQuestions"],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: { skillId: "$quizzes.skillId", userId: "$userId" },
        quizzesAttempted: { $sum: 1 },
        totalQuizzes: { $first: "$quizzes.totalQuizzes" },
      },
    },
    {
      $match: {
        $expr: { $eq: ["$quizzesAttempted", "$totalQuizzes"] },
      },
    },
    {
      $group: {
        _id: "$_id.userId",
        newBadges: {
          $push: { skillId: "$_id.skillId" },
        },
      },
    },
    {
      $lookup: {
        from: "activities",
        localField: "_id",
        foreignField: "userId",
        as: "existingDoc",
      },
    },
    {
      $unwind: {
        path: "$existingDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $set: {
        badges: {
          $setUnion: [
            "$existingDoc.badges",
            {
              $filter: {
                input: "$newBadges",
                as: "badge",
                cond: {
                  $not: {
                    $in: ["$$badge.skillId", "$existingDoc.badges.skillId"],
                  },
                },
              },
            },
          ],
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$existingDoc", { badges: "$badges" }],
        },
      },
    },
    {
      $merge: {
        into: "activities",
        on: "_id",
        whenMatched: "replace",
        whenNotMatched: "insert",
      },
    },
  ]);
  //console.log(data);
};



// const checkSkill = async () => {
//   const data = await Activity.aggregate([
//     {
//       $match: {
//         isDeleted: false,
//       },
//     },
//     {
//       $unwind: "$quizzes",
//     },
//     {
//       $unwind: "$quizzes.question", 
//     },
//     {
//       $lookup: {
//         from: "quizzes",
//         let: {
//           quizId: "$quizzes.quizId",
//           userId: "$userId",
//         },
//         pipeline: [
//           {
//             $match: {
//               $expr: { $eq: ["$_id", "$$quizId"] },
//             },
//           },
//           {
//             $lookup: {
//               from: "quizzes",
//               localField: "skillId",
//               foreignField: "skillId",
//               as: "quizzes",
//             },
//           },
//           {
//             $project: {
//               quizId: "$_id",
//               skillId: 1,
//               userId: "$$userId",
//               totalQuestions: { $size: "$question" },
//               totalQuizzes: { $size: "$quizzes" },
//             },
//           },
//         ],
//         as: "quizzes",
//       },
//     },
//     {
//       $unwind: "$quizzes",
//     },
//     {
//       $group: {
//         _id: {
//           skillId: "$quizzes.skillId",
//           userId: "$userId",
//           quizId: "$quizzes.quizId"
//         },
//         totalQuestions: { $sum: 1 },
//         correctAnswers: {
//           $sum: {
//             $cond: ["$quizzes.question.isCorrect", 1, 0] // Access isCorrect directly from the question
//           }
//         },
//         totalQuizzes: { $first: "$quizzes.totalQuizzes" },
//       },
//     },
//     {
//       $project: {
//         skillId: "$_id.skillId",
//         userId: "$_id.userId",
//         totalQuestions: 1,
//         correctAnswers: 1,
//         allCorrect: { $eq: ["$totalQuestions", "$correctAnswers"] } // Check if all answers are correct
//       }
//     },
//     {
//       $match: {
//         allCorrect: true // Ensure this matches the condition for adding the skill ID
//       }
//     },
//     {
//       $group: {
//         _id: "$userId",
//         newBadges: {
//           $push: { skillId: "$skillId" },
//         },
//       },
//     },
//     {
//       $lookup: {
//         from: "activities",
//         localField: "_id",
//         foreignField: "userId",
//         as: "existingDoc",
//       },
//     },
//     {
//       $unwind: {
//         path: "$existingDoc",
//         preserveNullAndEmptyArrays: true,
//       },
//     },
//     {
//       $set: {
//         badges: {
//           $setUnion: [
//             "$existingDoc.badges",
//             {
//               $filter: {
//                 input: "$newBadges",
//                 as: "badge",
//                 cond: {
//                   $not: {
//                     $in: ["$$badge.skillId", "$existingDoc.badges.skillId"],
//                   },
//                 },
//               },
//             },
//           ],
//         },
//       },
//     },
//     {
//       $replaceRoot: {
//         newRoot: {
//           $mergeObjects: ["$existingDoc", { badges: "$badges" }],
//         },
//       },
//     },
//     {
//       $merge: {
//         into: "activities",
//         on: "_id",
//         whenMatched: "replace",
//         whenNotMatched: "insert",
//       },
//     },
//   ]);

//   console.log(data);
// };




// const checkSkill = async () => {
//   const data = await Activity.aggregate([
//     {
//       $match: {
//         isDeleted: false,
//       },
//     },
//     {
//       $unwind: "$quizzes",
//     },
//     {
//       $unwind: "$quizzes.question", 
//     },
//     {
//       $lookup: {
//         from: "quizzes",
//         let: {
//           quizId: "$quizzes.quizId",
//           userId: "$userId",
//         },
//         pipeline: [
//           {
//             $match: {
//               $expr: { $eq: ["$_id", "$$quizId"] },
//             },
//           },
//           {
//             $lookup: {
//               from: "quizzes",
//               localField: "skillId",
//               foreignField: "skillId",
//               as: "quizzes",
//             },
//           },
//           {
//             $project: {
//               quizId: "$_id",
//               skillId: 1,
//               userId: "$$userId",
//               totalQuestions: { $size: "$question" },
//               totalQuizzes: { $size: "$quizzes" },
//             },
//           },
//         ],
//         as: "quizzes",
//       },
//     },
//     {
//       $unwind: "$quizzes",
//     },
//     {
//       $group: {
//         _id: {
//           skillId: "$quizzes.skillId",
//           userId: "$userId",
//           quizId: "$quizzes.quizId"
//         },
//         totalQuestions: { $sum: 1 },
//         correctAnswers: {
//           $sum: {
//             $cond: ["$quizzes.question.isCorrect", 1, 0] // Access isCorrect directly from the question
//           }
//         },
//         totalQuizzes: { $first: "$quizzes.totalQuizzes" },
//       },
//     },
//     {
//       $match: {
//         $expr: {
//           $eq: ["$totalQuestions", "$correctAnswers"], // Ensure all answers are correct
//         },
//       },
//     },
//     {
//       $group: {
//         _id: "$_id.userId",
//         newBadges: {
//           $push: { skillId: "$_id.skillId" },
//         },
//       },
//     },
//     {
//       $lookup: {
//         from: "activities",
//         localField: "_id",
//         foreignField: "userId",
//         as: "existingDoc",
//       },
//     },
//     {
//       $unwind: {
//         path: "$existingDoc",
//         preserveNullAndEmptyArrays: true,
//       },
//     },
//     {
//       $set: {
//         badges: {
//           $setUnion: [
//             "$existingDoc.badges",
//             {
//               $filter: {
//                 input: "$newBadges",
//                 as: "badge",
//                 cond: {
//                   $not: {
//                     $in: ["$$badge.skillId", "$existingDoc.badges.skillId"],
//                   },
//                 },
//               },
//             },
//           ],
//         },
//       },
//     },
//     {
//       $replaceRoot: {
//         newRoot: {
//           $mergeObjects: ["$existingDoc", { badges: "$badges" }],
//         },
//       },
//     },
//     {
//       $merge: {
//         into: "activities",
//         on: "_id",
//         whenMatched: "replace",
//         whenNotMatched: "insert",
//       },
//     },
//   ]);
//   console.log(data);
// };

// const checkCategoryBadges = async () => {
//   // Step 1: Retrieve all skills grouped by category
//   const categoriesWithSkills = await Skill.aggregate([
//     {
//       $match: {
//         isDeleted: false,
//       },
//     },
//     {
//       $group: {
//         _id: "$categoryId",
//         skills: { $push: "$_id" },
//       },
//     },
//   ]);

//   // Step 2: Check each category for user completions
//   for (const category of categoriesWithSkills) {
//     const { _id: categoryId, skills } = category;

//     // Find users who have completed all skills in the category
//     const completedSkills = await Activity.aggregate([
//       {
//         $match: {
//           isDeleted: false,
//         },
//       },
//       {
//         $unwind: "$badges",
//       },
//       {
//         $match: {
//           "badges.skillId": { $in: skills },
//         },
//       },
//       {
//         $group: {
//           _id: "$userId",
//           completedSkills: { $addToSet: "$badges.skillId" },
//         },
//       },
//       {
//         $match: {
//           $expr: { $setIsSubset: [skills, "$completedSkills"] },
//         },
//       },
//     ]);

//     // Step 3: Update Activity for users who completed all skills
//     for (const user of completedSkills) {
//       const userId = user._id;

//       await Activity.updateOne(
//         { userId, isDeleted: false },
//         {
//           $addToSet: {
//             categoryBadges: { categoryId },
//           },
//         }
//       );
//     }
//   }
// };

const checkCategoryBadges = async () => {
  const categoriesWithSkills = await Skill.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$categoryId",
        skills: { $push: "$_id" },
      },
    },
  ]);

  for (const category of categoriesWithSkills) {
    const { _id: categoryId, skills } = category;

    const completedSkills = await Activity.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $unwind: "$badges",
      },
      {
        $match: {
          "badges.skillId": { $in: skills },
        },
      },
      {
        $group: {
          _id: "$userId",
          completedSkills: { $addToSet: "$badges.skillId" },
        },
      },
      {
        $match: {
          $expr: { $setIsSubset: [skills, "$completedSkills"] },
        },
      },
    ]);

    for (const user of completedSkills) {
      const userId = user._id;

      const userActivity = await Activity.findOne({ userId, isDeleted: false });

      if (userActivity) {
        const exists = userActivity.categoryBadges.some(badge => badge.categoryId.toString() === categoryId.toString());

        if (!exists) {
          await Activity.updateOne(
            { userId, isDeleted: false },
            {
              $addToSet: {
                categoryBadges: { categoryId, _id: new mongoose.Types.ObjectId() }, 
              },
            }
          );
        } else {
          
        }
      }
    }
  }
};



const dailyStreakReminder = async () => {
  const data: any = await User.find({
    role: 3,
    isDeleted: false,
    "notification.pushNotification": true,
  });

  for (let i = 0; i < data.length; i++) {
    const notificationPayload = {
      to: data[i]._id,
      title: constants.templateTitle.streakPending,
      data: {
        name: data[i].name.firstName,
      },
    };

    notificationQueue.add(data[i]._id, notificationPayload, {
      removeOnComplete: true,
      removeOnFail: true,
    });
  }
};

const planExpireCheck = async()=>{
 try {
  const expireplan:any = await Subscription.find({
    isDeleted: false,
    renewalDate: {$lte: new Date(Date.now())}
  })

  for(const plan of expireplan){
    const userId = plan.userId;
    await User.updateMany(
      { _id: userId, isPremium: true, isDeleted:false }, 
      { $set: { isPremium: false } } 
    );
  }
}
catch(err){
  console.log("error in subscription", err)
}
}

const cronjob = async () => {
  // Runs every second
  schedule("* * * * * *", async () => {
    await abortMaintenance();
  });

  // Runs every minute
  
  schedule("* * * * *", async () => {
    await refillLives();
     await checkSkill();
     await planExpireCheck();
     await checkCategoryBadges()
    // await dailyStreakReminder();
  });
};

export default cronjob;
