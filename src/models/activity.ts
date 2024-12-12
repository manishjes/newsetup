import { Schema, model } from "mongoose";
import constants from "@/utils/constants";

const question = new Schema({
  questionId: { type: Schema.Types.ObjectId, required: true, ref: "Question" },
  answer: [
    {
      value: {
        type: String,
        trim: true,
        set: (value: string) =>
          value && value.charAt(0).toUpperCase() + value.slice(1),
      },
    },
  ],
  isCorrect: { type: Boolean, required: true },
  duration: {
    type: Number,
    required: true,
  },
});

const quiz = new Schema({
  quizId: { type: Schema.Types.ObjectId, required: true, ref: "Quiz" },
  question: [question],
  updatedOn: { type: Date, required: true, default: Date.now },
});

const activitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    interests: [
      {
        categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
      },
    ],
    quizzes: [quiz],
    walnut: {
      total: { type: Number, required: true, default: 0 },
      remaining: { type: Number, required: true, default: 0 },
      transaction: [
        {
          title: {
            type: String,
            required: true,
            set: (value: string) =>
              value && value.charAt(0).toUpperCase() + value.slice(1),
          },
          type: {
            type: String,
            required: true,
            enum: [
              constants.pointTypes.learning,
              constants.pointTypes.badges,
              constants.pointTypes.learningPathBonus,
              constants.pointTypes.referrel,
              constants.pointTypes.streakBonus,
              constants.pointTypes.survey,
              constants.pointTypes.coupanPurchase,
              constants.pointTypes.lifeRefill,
            ],
          },
          transactionType: {
            type: String,
            required: true,
            enum: [
              constants.transactionTypes.credit,
              constants.transactionTypes.debit,
            ],
          },
          value: {
            type: Number,
            required: true,
          },
          createdOn: { type: Date, required: true, default: Date.now },
        },
      ],
    },
    xp: {
      total: { type: Number, required: true, default: 0 },
      remaining: { type: Number, required: true, default: 0 },
      transaction: [
        {
          title: {
            type: String,
            required: true,
            set: (value: string) =>
              value && value.charAt(0).toUpperCase() + value.slice(1),
          },
          type: {
            type: String,
            required: true,
            enum: [
              constants.pointTypes.learning,
              constants.pointTypes.badges,
              constants.pointTypes.learningPathBonus,
              constants.pointTypes.referrel,
              constants.pointTypes.streakBonus,
              constants.pointTypes.survey,
              constants.pointTypes.coupanPurchase,
              constants.pointTypes.lifeRefill,
            ],
          },
          transactionType: {
            type: String,
            required: true,
            enum: [
              constants.transactionTypes.credit,
              constants.transactionTypes.debit,
            ],
          },
          value: {
            type: Number,
            required: true,
          },
          createdOn: { type: Date, required: true, default: Date.now },
        },
      ],
    },
    lives: {
      value: { type: Number, required: true, default: 3 },
      updatedOn: { type: Date, required: true, default: Date.now },
    },
    badges: [
      {
        skillId: { type: Schema.Types.ObjectId, ref: "Skill" },
      },
      
    ],
    categoryBadges: [
      {
        categoryId: {type: Schema.Types.ObjectId, ref: "Category" }
      }
    ],
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret, options) => {
        ret.id = ret._id;
        ret.createdAt = ret.createdAt && new Date(ret.createdAt).getTime();
        ret.updatedAt = ret.updatedAt && new Date(ret.updatedAt).getTime();
        delete ret._id;
        delete ret.__v;
        delete ret.createdBy;
        delete ret.updatedBy;
        delete ret.deletedBy;
      },
    },
  }
);

const Activity = model("Activity", activitySchema);

export default Activity;
