import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./planValidation";
import controller from "./planController";

router.get(
  `/plan-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.plansList,
  controller.plansList
);

router.get(
  `/plan-detail/:plan_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.detail,
  controller.detail
);

export default router;
