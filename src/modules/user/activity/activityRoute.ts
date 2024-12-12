import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./activityValidation";
import controller from "./activityController";

router.get(
  `/streak-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.streakList
);

router.post(
  `/give-answer`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.giveAnswer,
  controller.giveAnswer
);

router.post(
  `/refill-lives`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.refillLives
);

router.get(
  `/leaderboard`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.leaderboard
);

export default router;
