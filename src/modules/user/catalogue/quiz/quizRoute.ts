import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./quizValidation";
import controller from "./quizController";

router.get(
  `/quiz-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.quizList,
  controller.quizList
);

router.get(
  `/quiz-detail/:quiz_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.quizDetail,
  controller.quizDetail
);

export default router;
