import { Schema, model } from "mongoose";
import constants from "@/utils/constants";

const descriptionSchema = new Schema(
  {
    title: {
      required: true,
      type: String,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
    description: {
      required: true,
      type: String,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
  },
  {
    toJSON: {
      transform: (doc, ret, options) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

const questionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
  },
  {
    toJSON: {
      transform: (doc, ret, options) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

const quizSchema = new Schema(
  {
    image: {
      localUrl: {
        type: String,
        trim: true,
      },
      bucketUrl: {
        type: String,
        trim: true,
      },
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: "Skill",
    },
    name: {
      required: true,
      type: String,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) => value && value.toLowerCase(),
    },
    description: [descriptionSchema],
    type: {
      type: String,
      trim: true,
      required: true,
      enum: [constants.quizTypes.skill, constants.quizTypes.survey],
      default: constants.quizTypes.skill,
    },
    level: {
      type: String,
      trim: true,
      required: true,
      enum: [
        constants.levels.easy,
        constants.levels.medium,
        constants.levels.hard,
        constants.levels.expert,
        constants.levels.master,
        constants.levels.extreme,
      ],
    },
    question: [questionSchema],
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

const Quiz = model("Quiz", quizSchema);

export default Quiz;
