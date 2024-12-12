import { Request, Response, NextFunction } from "express";
import { createError } from "@/helpers/helper";
import constants from "@/utils/constants";

const checkPrivilege =
  (privilage: string, right: string) =>
  async (req: any, res: Response, next: NextFunction) => {
    try {
      if (!Object.prototype.hasOwnProperty.call(req.privileges, privilage)) {
        return next(
          await createError(
            constants.code.unAuthorized,
            constants.message.reqPrivilege
          )
        );
      } else if (
        !Object.getOwnPropertyDescriptor(
          req.privileges,
          privilage
        )?.value.includes(right)
      ) {
        return next(
          await createError(
            constants.code.unAuthorized,
            constants.message.reqRight
          )
        );
      } else {
        switch (right) {
          case constants.rights.read:
            return next();
          case constants.rights.write:
            if (
              !Object.getOwnPropertyDescriptor(
                req.privileges,
                privilage
              )?.value.includes(constants.rights.read)
            ) {
              return next(
                await createError(
                  constants.code.unAuthorized,
                  constants.message.reqRight
                )
              );
            } else {
              return next();
            }
          case constants.rights.delete:
            if (
              !Object.getOwnPropertyDescriptor(
                req.privileges,
                privilage
              )?.value.includes(constants.rights.read)
            ) {
              return next(
                await createError(
                  constants.code.unAuthorized,
                  constants.message.reqRight
                )
              );
            } else {
              return next();
            }
        }
      }
    } catch (err) {
      next(err);
    }
  };

export default checkPrivilege;
