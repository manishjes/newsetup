import { Router } from "express";
const router = Router({ caseSensitive: true, strict: true });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./feedbackValidation";
import controller from "./feedbackController";

router.post(
  `/give-feedback`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.giveFeedback,
  controller.giveFeedback
);

export default router;
