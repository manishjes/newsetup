import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import { handleImageUpload } from "@/middlewares/multer";
import validation from "./quizValidation";
import controller from "./quizController";

router.post(
  `/add-quiz`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleImageUpload,
  checkPrivilege(constants.privileges.quizManagement, constants.rights.write),
  validation.addQuiz,
  controller.addQuiz
);

router.get(
  `/quiz-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.quizManagement, constants.rights.read),
  validation.quizList,
  controller.quizList
);

router.get(
  `/quiz-detail/:quiz_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.quizManagement, constants.rights.read),
  validation.quizDetail,
  controller.quizDetail
);

router.put(
  `/update-quiz/:quiz_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleImageUpload,
  checkPrivilege(constants.privileges.quizManagement, constants.rights.write),
  validation.updateQuiz,
  controller.updateQuiz
);

router.delete(
  `/delete-quiz`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.quizManagement, constants.rights.delete),
  validation.deleteQuiz,
  controller.deleteQuiz
);

export default router;
