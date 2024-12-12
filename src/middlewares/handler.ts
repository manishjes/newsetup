import { Request, Response, NextFunction } from "express";
import constants from "@/utils/constants";

export const errorHandler = async (
  err: any,
  req: any,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || constants.code.internalServerError;
  const message = err.message || constants.message.internalServerError;
  return res.status(status).json({
    status: constants.status.statusFalse,
    userStatus: req.status || constants.status.statusFalse,
    message: message,
    // stack: err.stack,
  });
};

export const responseHandler = async (
  req: any,
  res: Response,
  message: string,
  data?: any
) => {
  return res.status(constants.code.success).json({
    status: constants.status.statusTrue,
    userStatus: req.status || constants.status.statusFalse,
    message: message,
    data: data,
  });
};
