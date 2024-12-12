import { Request, Response, NextFunction } from "express";
import validator from "@/helpers/validator";
import constants from "@/utils/constants";
import { createError, getMessage, validateRequestData } from "@/helpers/helper";

const faqList = async (req: Request, res: Response, next: NextFunction) => {
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

const detail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      faq_id: "required|string|size:24",
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

export default {
  faqList,
  detail,
};
