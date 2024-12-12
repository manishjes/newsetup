import { Request, Response, NextFunction } from "express";
import validator from "@/helpers/validator";
import constants from "@/utils/constants";
import { createError, getMessage, validateRequestData } from "@/helpers/helper";

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      name: "required|string|min:3",
      description: "string|min:3",
      type: `required|string|in:${constants.planType.trial},${constants.planType.basic},${constants.planType.standard}`,
      price: "required|numeric",
      currency_code: "required|string|checkString",
      currency_symbol: "required|string",
      recurring_cycle: `required|string|in:${constants.recurringCycle.daily},${constants.recurringCycle.biweekly},${constants.recurringCycle.weekly},${constants.recurringCycle.monthly},${constants.recurringCycle.quarterly},${constants.recurringCycle.annually}`,
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

const plansList = async (req: Request, res: Response, next: NextFunction) => {
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
      plan_id: "required|string|size:24",
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

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      name: "required|string|min:3",
      description: "string|min:3",
      type: `required|string|in:${constants.planType.trial},${constants.planType.basic},${constants.planType.standard}`,
      price: "required|numeric",
      currency_code: "required|string|checkString",
      currency_symbol: "required|string",
      recurring_cycle: `required|string|in:${constants.recurringCycle.daily},${constants.recurringCycle.biweekly},${constants.recurringCycle.weekly},${constants.recurringCycle.monthly},${constants.recurringCycle.quarterly},${constants.recurringCycle.annually}`,
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

const managePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      status: "required|boolean|in:true,false",
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

const deletePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      is_delete: "required|boolean|in:true,false",
      plan_id: "required|array|checkArrayValueID",
    };
    const msg = { "array.plan_id": "The plan_id must be an array." };
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
  create,
  plansList,
  detail,
  update,
  managePlan,
  deletePlan,
};
