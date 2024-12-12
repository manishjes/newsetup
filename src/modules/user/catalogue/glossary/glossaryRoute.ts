import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./glossaryValidation";
import controller from "./glossaryController";

router.get(
  `/glossary-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.glossaryList,
  controller.glossaryList
);

router.get(
  `/glossary-detail/:glossary_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.glossaryDetail,
  controller.glossaryDetail
);

export default router;
