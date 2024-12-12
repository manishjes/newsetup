import { Request, Response, NextFunction } from "express";
import validator from "@/helpers/validator";
import constants from "@/utils/constants";
import { createError, getMessage, validateRequestData } from "@/helpers/helper";

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      name: "required|string|min:3|max:50|checkStringTwo",
      iso_code: "required|string",
      phone: `required|string|verifyPhone:${req.body.iso_code}`,
      alternate_phone: `string|verifyPhone:${req.body.iso_code}`,
      address_type: `required|string|in:${constants.addressTypes.home},${constants.addressTypes.work},${constants.addressTypes.other}`,
      address_line_one: "required|string|min:3|max:50",
      address_line_two: "string|min:3|max:50",
      city: "required|string|min:3|max:30|checkStringTwo",
      state: "required|string|min:3|max:30|checkStringTwo",
      country: "required|string|min:3|checkStringTwo",
      pincode: "required|string|min:5|checkStringThree",
      landmark: "string|min:3|max:30|checkStringFour",
      latitude: "numeric",
      longitude: "numeric",
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

const detail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      address_id: "required|string|size:24",
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
      name: "required|string|min:3|max:50|checkStringTwo",
      iso_code: "required|string",
      phone: `required|string|verifyPhone:${req.body.iso_code}`,
      alternate_phone: `string|verifyPhone:${req.body.iso_code}`,
      address_type: `required|string|in:${constants.addressTypes.home},${constants.addressTypes.work},${constants.addressTypes.other}`,
      address_line_one: "required|string|min:3|max:50",
      address_line_two: "string|min:3|max:50",
      city: "required|string|min:3|max:30|checkStringTwo",
      state: "required|string|min:3|max:30|checkStringTwo",
      country: "required|string|min:3|checkStringTwo",
      pincode: "required|string|min:5|checkStringThree",
      landmark: "string|min:3|max:30|checkStringFour",
      latitude: "numeric",
      longitude: "numeric",
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

const deleteAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      is_delete: "required|boolean|in:true,false",
      address_id: "required|array|checkArrayValueID",
    };
    const msg = { "array.address_id": "The address_id must be an array." };
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
  detail,
  update,
  deleteAddress,
};
