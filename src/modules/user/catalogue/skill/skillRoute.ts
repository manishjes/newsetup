import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./skillValidation";
import controller from "./skillController";

router.get(
  `/skill-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.skillList,
  controller.skillList
);

router.post(
  `/skill-learninglist`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.skillLearningList
);

router.post(
  `/skill-quizcompleted`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.skillCompletedQuiz
);


router.post(
  `/skill-active`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.ActiveSkill
);

router.get(
  `/skill-listwithoutPremium`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.skillListwithoutPremium
);


export default router;
