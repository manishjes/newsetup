import { sign, verify } from "jsonwebtoken";
import CryptoJS from "crypto-js";
import { getOrSetCache, clearKey } from "@/config/redis";
import {
  CREATE_TOKEN,
  CREATE_TOKEN_MOBILE,
  DELETE_ALL_TOKEN,
  DELETE_TOKEN,
} from "@/types/token";
import { randomKeyAndIV, randomString } from "@/helpers/helper";
import Token from "@/models/token";
import User from "@/models/user";

export const createToken: CREATE_TOKEN = async (payload) => {
  const token = sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
    issuer: process.env.JWT_ISSUER,
  });

  const key = await randomKeyAndIV(64);
  const iv = await randomKeyAndIV(32);
  const tokenableId = await randomString(48);

  const encrypted = CryptoJS.AES.encrypt(token, key, { iv: iv }).toString();

  const data: any = await Token.create({
    tokenableType: "jwt",
    tokenableId: tokenableId,
    name: "bearer",
    token: encrypted,
    key: key,
    iv: iv,
  });

  return CryptoJS.AES.encrypt(
    data.tokenableId,
    process.env.JWT_SECRET
  ).toString();
};

export const createTokenMobile: CREATE_TOKEN_MOBILE = async (payload) => {
  const token = sign(payload, process.env.JWT_SECRET, {
    issuer: process.env.JWT_ISSUER,
  });

  const key = await randomKeyAndIV(64);
  const iv = await randomKeyAndIV(32);
  const tokenableId = await randomString(48);

  const encrypted = CryptoJS.AES.encrypt(token, key, { iv: iv }).toString();

  const data: any = await Token.create({
    tokenableType: "jwt",
    tokenableId: tokenableId,
    name: "bearer",
    token: encrypted,
    key: key,
    iv: iv,
  });

  return CryptoJS.AES.encrypt(
    data.tokenableId,
    process.env.JWT_SECRET
  ).toString();
};

export const deleteToken: DELETE_TOKEN = async (token) => {
  const data = await Token.deleteMany({ tokenableId: token });
  if (data) {
    await clearKey(token);
    return true;
  }
};

export const deleteAllToken: DELETE_ALL_TOKEN = async (token) => {
  const data = await getOrSetCache(token, async () => {
    const data = await Token.findOne({
      tokenableId: token,
    });
    return data;
  });

  const jwtToken = CryptoJS.AES.decrypt(
    data.token,
    CryptoJS.enc.Hex.parse(data.key),
    {
      iv: CryptoJS.enc.Hex.parse(data.iv),
    }
  ).toString(CryptoJS.enc.Utf8);

  verify(
    jwtToken,
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
          const tokens: any = await Token.find();

          if (tokens.length > 0) {
            for (let i = 0; i < tokens.length; i++) {
              const jwtToken = CryptoJS.AES.decrypt(
                tokens[i].token,
                CryptoJS.enc.Hex.parse(tokens[i].key),
                {
                  iv: CryptoJS.enc.Hex.parse(tokens[i].iv),
                }
              ).toString(CryptoJS.enc.Utf8);

              verify(
                jwtToken,
                process.env.JWT_SECRET,
                {
                  issuer: process.env.JWT_ISSUER,
                },
                async (err, jwtPayload: any) => {
                  if (jwtPayload.id === user.id) {
                    await Token.deleteMany({
                      tokenableId: tokens[i].tokenableId,
                    });
                  }
                }
              );
            }
          }
        }
      }
    }
  );
  await clearKey(token);
  return true;
};
