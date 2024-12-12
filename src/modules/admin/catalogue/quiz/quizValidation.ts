import { Request, Response, NextFunction } from "express";
import validator from "@/helpers/validator";
import constants from "@/utils/constants";
import { createError, getMessage, validateRequestData } from "@/helpers/helper";

const addQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      quiz_type: `required|string|in:${constants.quizTypes.skill},${constants.quizTypes.survey}`,
      skill_id: `required_if:quiz_type,${constants.quizTypes.skill}|string|size:24|checkSkillID`,
      quiz_name: "required|string|min:3",
      description: "required|array",
      quiz_level: `required|string|in:${constants.levels.easy},${constants.levels.medium},${constants.levels.hard},${constants.levels.expert},${constants.levels.master},${constants.levels.extreme}`,
      question_id: "required|array|checkArrayValueID",
    };
    const msg = {
      "array.description": "The description must be an array.",
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

const quizList = async (req: Request, res: Response, next: NextFunction) => {
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

const quizDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      quiz_id: "required|string|size:24",
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

const updateQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      quiz_type: `required|string|in:${constants.quizTypes.skill},${constants.quizTypes.survey}`,
      skill_id: `required_if:quiz_type,${constants.quizTypes.skill}|string|size:24|checkSkillID`,
      quiz_name: "required|string|min:3",
      description: "required|array",
      quiz_level: `required|string|in:${constants.levels.easy},${constants.levels.medium},${constants.levels.hard},${constants.levels.expert},${constants.levels.master},${constants.levels.extreme}`,
      question_id: "required|array|checkArrayValueID",
    };
    const msg = {
      "array.description": "The description must be an array.",
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

const deleteQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      is_delete: "required|boolean|in:true,false",
      quiz_id: "required|array|checkArrayValueID",
    };
    const msg = {
      "array.quiz_id": "The quiz_id must be an array.",
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
  addQuiz,
  quizList,
  quizDetail,
  updateQuiz,
  deleteQuiz,
};
