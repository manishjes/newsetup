import { Router } from "express";
const router = Router({ caseSensitive: true, strict: true });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./dashboardValidation";
import controller from "./dashboardController";

router.get(
  `/dashboard-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  controller.detail
);

router.get(
  `/leaderboard-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  controller.leaderboard
);

export default router;
