import { Request, Response, NextFunction } from "express";
import validator from "@/helpers/validator";
import constants from "@/utils/constants";
import { createError, getMessage, validateRequestData } from "@/helpers/helper";

const addQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      question_title: "required|string|min:3",
      description: "string|min:3",
      question_type: `required|string|in:${constants.questionTypes.shortAnswer},${constants.questionTypes.checkBox},${constants.questionTypes.dropdown},${constants.questionTypes.multipleChoice}`,
      question_level: `required|string|in:${constants.levels.easy},${constants.levels.medium},${constants.levels.hard},${constants.levels.expert},${constants.levels.master},${constants.levels.extreme}`,
      option_is_shuffle: "boolean|in:true,false",
      options: "array",
      answer: "array",
      answer_description: "string|min:3",
      hint: "string|min:3",
      points: "required|numeric",
      duration: "required|numeric",
      is_survey: "required|boolean|in:true,false",
    };
    const msg = {
      "array.options": "The options must be an array.",
      "array.answer": "The answer must be an array.",
    };
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const questionList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      page: "required|numeric",
      limit: "required|numeric",
      sort: "required|string|in:asc,desc",
      search: "string",
      filter: "object",
    };
    const msg = {};
    await validator(
      req.query,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.query))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const questionDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      question_id: "required|string|size:24",
    };
    const msg = {};
    await validator(
      req.params,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.params))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const updateQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      question_title: "required|string|min:3",
      description: "string|min:3",
      question_type: `required|string|in:${constants.questionTypes.shortAnswer},${constants.questionTypes.checkBox},${constants.questionTypes.dropdown},${constants.questionTypes.multipleChoice}`,
      question_level: `required|string|in:${constants.levels.easy},${constants.levels.medium},${constants.levels.hard},${constants.levels.expert},${constants.levels.master},${constants.levels.extreme}`,
      option_is_shuffle: "boolean|in:true,false",
      options: "array",
      answer: "array",
      answer_description: "string|min:3",
      hint: "string|min:3",
      points: "required|numeric",
      duration: "required|numeric",
      is_survey: "required|boolean|in:true,false",
    };
    const msg = {
      "array.options": "The options must be an array.",
      "array.answer": "The answer must be an array.",
    };
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const deleteQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      is_delete: "required|boolean|in:true,false",
      question_id: "required|array|checkArrayValueID",
    };
    const msg = {
      "array.question_id": "The question_id must be an array.",
    };
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

export default {
  addQuestion,
  questionList,
  questionDetail,
  updateQuestion,
  deleteQuestion,
};
