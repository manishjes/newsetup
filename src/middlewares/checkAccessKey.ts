import { Request, Response, NextFunction } from "express";
import { createError } from "@/helpers/helper";
import { getOrSetCache } from "@/config/redis";
import constants from "@/utils/constants";
import Setting from "@/models/setting";

const checkAccessKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.header("Access-Key")) {
      return next(
        await createError(
          constants.code.unAuthorized,
          constants.message.reqAccessKey
        )
      );
    } else {
      const accessKey: any = req.header("Access-Key");
      const data = await getOrSetCache(accessKey, async () => {
        const data = await Setting.exists({ accessKey: accessKey });
        return data;
      });

      if (!data) {
        return next(
          await createError(
            constants.code.unAuthorized,
            constants.message.invalidAccesskey
          )
        );
      } else {
        next();
      }
    }
  } catch (err) {
    next(err);
  }
};

export default checkAccessKey;
