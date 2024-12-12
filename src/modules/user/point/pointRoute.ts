import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./pointValidation";
import controller from "./pointController";

router.get(
  `/point-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.pointsList,
  controller.pointsList
);

export default router;
