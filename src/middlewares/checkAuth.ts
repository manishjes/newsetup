import { Request, Response, NextFunction } from "express";
import CryptoJS from "crypto-js";
import { verify } from "jsonwebtoken";
import { createError } from "@/helpers/helper";
import constants from "@/utils/constants";
import { getOrSetCache } from "@/config/redis";
import Token from "@/models/token";
import User from "@/models/user";

const checkAuth = {
  Public: async (req: any, res: Response, next: NextFunction) => {
    try {
      if (req.headers.authorization) {
        const bearer = req.headers.authorization.split(" ");
        const bearerToken = bearer[1];

        const tokenableId = CryptoJS.AES.decrypt(
          bearerToken,
          process.env.JWT_SECRET
        ).toString(CryptoJS.enc.Utf8);

        const data = await getOrSetCache(tokenableId, async () => {
          const data = await Token.findOne({
            tokenableId,
          });
          return data;
        });

        if (data) {
          const token = CryptoJS.AES.decrypt(
            data.token,
            CryptoJS.enc.Hex.parse(data.key),
            {
              iv: CryptoJS.enc.Hex.parse(data.iv),
            }
          ).toString(CryptoJS.enc.Utf8);

          verify(
            token,
            process.env.JWT_SECRET,
            {
              issuer: process.env.JWT_ISSUER,
            },
            async (err, jwtPayload: any) => {
              if (jwtPayload) {
                const user = await getOrSetCache(jwtPayload.id, async () => {
                  const user = await User.findOne({
                    _id: jwtPayload.id,
                  });
                  return user;
                });

                if (user) {
                  req.token = data.tokenableId;
                  req.id = user.id;
                  req.role = user.role;
                  req.privileges = user.privileges;
                  req.status = user.status;
                  next();
                }
              }
            }
          );
        }
      } else {
        next();
      }
    } catch (err) {
      next(err);
    }
  },

  Admin: async (req: any, res: Response, next: NextFunction) => {
    try {
      if (!req.headers.authorization) {
        return next(
          await createError(
            constants.code.unAuthorized,
            constants.message.reqAccessToken
          )
        );
      } else {
        const bearer = req.headers.authorization.split(" ");
        const bearerToken = bearer[1];

        const tokenableId = CryptoJS.AES.decrypt(
          bearerToken,
          process.env.JWT_SECRET
        ).toString(CryptoJS.enc.Utf8);

        const data = await getOrSetCache(tokenableId, async () => {
          const data = await Token.findOne({
            tokenableId,
          });
          return data;
        });

        if (!data) {
          return next(
            await createError(
              constants.code.unAuthorized,
              constants.message.invalidAccessToken
            )
          );
        } else {
          const token = CryptoJS.AES.decrypt(
            data.token,
            CryptoJS.enc.Hex.parse(data.key),
            {
              iv: CryptoJS.enc.Hex.parse(data.iv),
            }
          ).toString(CryptoJS.enc.Utf8);

          verify(
            token,
            process.env.JWT_SECRET,
            {
              issuer: process.env.JWT_ISSUER,
            },
            async (err, jwtPayload: any) => {
              if (err) {
                return next(
                  await createError(constants.code.unAuthorized, err.message)
                );
              } else {
                const user = await getOrSetCache(jwtPayload.id, async () => {
                  const user = await User.findOne({
                    _id: jwtPayload.id,
                    $or: [
                      { role: constants.accountLevel.superAdmin },
                      { role: constants.accountLevel.admin },
                    ],
                  });
                  return user;
                });

                if (!user) {
                  return next(
                    await createError(
                      constants.code.unAuthorized,
                      constants.message.invalidUser
                    )
                  );
                } else if (!user.status) {
                  return next(
                    await createError(
                      constants.code.unAuthorized,
                      constants.message.userInactive
                    )
                  );
                } else if (user.isDeleted) {
                  return next(
                    await createError(
                      constants.code.unAuthorized,
                      constants.message.userDeleted
                    )
                  );
                } else {
                  req.token = data.tokenableId;
                  req.id = user.id;
                  req.role = user.role;
                  req.privileges = user.privileges;
                  req.status = user.status;
                  next();
                }
              }
            }
          );
        }
      }
    } catch (err) {
      next(err);
    }
  },

  User: async (req: any, res: Response, next: NextFunction) => {
    try {
      if (!req.headers.authorization) {
        return next(
          await createError(
            constants.code.unAuthorized,
            constants.message.reqAccessToken
          )
        );
      } else {
        const bearer = req.headers.authorization.split(" ");
        const bearerToken = bearer[1];

        const tokenableId = CryptoJS.AES.decrypt(
          bearerToken,
          process.env.JWT_SECRET
        ).toString(CryptoJS.enc.Utf8);

        const data = await getOrSetCache(tokenableId, async () => {
          const data = await Token.findOne({
            tokenableId,
          });
          return data;
        });

        if (!data) {
          return next(
            await createError(
              constants.code.unAuthorized,
              constants.message.invalidAccessToken
            )
          );
        } else {
          const token = CryptoJS.AES.decrypt(
            data.token,
            CryptoJS.enc.Hex.parse(data.key),
            {
              iv: CryptoJS.enc.Hex.parse(data.iv),
            }
          ).toString(CryptoJS.enc.Utf8);

          verify(
            token,
            process.env.JWT_SECRET,
            {
              issuer: process.env.JWT_ISSUER,
            },
            async (err, jwtPayload: any) => {
              if (err) {
                return next(
                  await createError(constants.code.unAuthorized, err.message)
                );
              } else {
                const user = await getOrSetCache(jwtPayload.id, async () => {
                  const user = await User.findOne({
                    _id: jwtPayload.id,
                    role: constants.accountLevel.user,
                  });
                  return user;
                });

                if (!user) {
                  return next(
                    await createError(
                      constants.code.unAuthorized,
                      constants.message.invalidUser
                    )
                  );
                } else if (!user.status) {
                  return next(
                    await createError(
                      constants.code.unAuthorized,
                      constants.message.userInactive
                    )
                  );
                } else if (user.isDeleted) {
                  return next(
                    await createError(
                      constants.code.unAuthorized,
                      constants.message.userDeleted
                    )
                  );
                } else {
                  req.token = data.tokenableId;
                  req.id = user.id;
                  req.email = user.email.value;
                  req.phone = user.phone.value;
                  req.role = user.role;
                  req.privileges = user.privileges;
                  req.premium = user.isPremium;
                  req.status = user.status;
                  next();
                }
              }
            }
          );
        }
      }
    } catch (err) {
      next(err);
    }
  },
};

export default checkAuth;
