import { Redis } from "ioredis";
import { REDIS_KEY, REDIS_CALLBACK } from "@/types/database";

const redisClient = new Redis();

export const getOrSetCache = async (key: REDIS_KEY, cb: REDIS_CALLBACK) => {
  const data = await redisClient.get(key);

  if (data) {
    return JSON.parse(data);
  } else {
    const newData = await cb();

    redisClient.set(
      key,
      JSON.stringify(newData),
      "EX",
      process.env.REDIS_EXPIRATION_TIME
    );

    return newData;
  }
};

export const clearKey = async (key: REDIS_KEY) => {
  await redisClient.del(key);
};

export const clearCache = async () => {
  await redisClient.flushall();
};
