import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./brandValidation";
import controller from "./brandController";

router.get(
  `/brand-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.brandList,
  controller.brandList
);

export default router;
