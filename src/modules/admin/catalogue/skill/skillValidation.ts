import { Request, Response, NextFunction } from "express";
import validator from "@/helpers/validator";
import constants from "@/utils/constants";
import { createError, getMessage, validateRequestData } from "@/helpers/helper";

const addSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      category_id: "required|string|size:24",
      skill_name: "required|string|min:3",
      description: "string|min:3",
      is_premium: "required|boolean|in:true,false",
    };
    const msg = {};
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

const skillList = async (req: Request, res: Response, next: NextFunction) => {
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

const skillDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      skill_id: "required|string|size:24",
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

const updateSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      category_id: "string|size:24",
      skill_name: "required|string|min:3",
      description: "string|min:3",
      is_premium: "required|boolean|in:true,false",
    };
    const msg = {};
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

const deleteSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      is_delete: "required|boolean|in:true,false",
      skill_id: "required|array|checkArrayValueID",
    };
    const msg = {
      "array.skill_id": "The skill_id must be an array.",
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
  addSkill,
  skillList,
  skillDetail,
  updateSkill,
  deleteSkill,
};
