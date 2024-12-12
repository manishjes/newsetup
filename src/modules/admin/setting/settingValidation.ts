import { Request, Response, NextFunction } from "express";
import validator from "@/helpers/validator";
import constants from "@/utils/constants";
import { createError, getMessage, validateRequestData } from "@/helpers/helper";

const changeLogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {};
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
        } else if (!req.file) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              constants.message.reqImage
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

const updateDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      application_name: "string|min:3|checkStringFour",
      organization: {
        name: "string|min:3|checkStringFour",
        cin: "string|min:3|checkStringFour",
        gst: "string|min:3|checkStringFour",
        address: {
          line_one: "string|min:3|max:50",
          line_two: "string|min:3|max:50",
          city: "string|min:3|max:30|checkStringTwo",
          state: "string|min:3|max:30|checkStringTwo",
          country: "string|min:3|checkStringTwo",
          pincode: "string|min:5|checkStringThree",
        },
      },
      country: {
        name: "string|checkStringTwo",
        code: "string|checkString",
      },
      timezone: {
        name: "string",
        format: "string",
      },
      language: {
        name: "string|checkStringTwo",
        code: "string",
      },
      currency: {
        code: "string|checkString",
        symbol: "string",
      },
      date_format: `string|in:${constants.dateFormat.dayMonthYear},${constants.dateFormat.monthDayYear},${constants.dateFormat.yearMonthDay}`,
      time_format: `string|in:${constants.timeFormat.twelveHour},${constants.timeFormat.twentyFourHour}`,
      week_start_on: `string|in:${constants.weekDay.monday},${constants.weekDay.tuesday},${constants.weekDay.wednesday},${constants.weekDay.thursday},${constants.weekDay.friday},${constants.weekDay.saturday},${constants.weekDay.sunday}`,
      social_link: {
        twitter: "string",
        facebook: "string",
        instagram: "string",
        youtube: "string",
        linkedin: "string",
        github: "string",
        pinterest: "string",
      },
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

const manageMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      time: "string|checkISODateString|checkCurrentDateTime",
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

export default {
  changeLogo,
  updateDetail,
  manageMaintenance,
};
