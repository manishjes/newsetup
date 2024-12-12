import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./faqValidation";
import controller from "./faqController";

router.get(
  `/faq-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.faqList,
  controller.faqList
);

router.get(
  `/faq-detail/:faq_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.detail,
  controller.detail
);

export default router;
