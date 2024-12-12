import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./categoryValidation";
import controller from "./categoryController";

router.get(
  `/category-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.categoryList,
  controller.categoryList
);

export default router;
