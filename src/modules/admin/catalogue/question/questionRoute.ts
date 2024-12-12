import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import {handleExcelUpload } from "@/middlewares/multer";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./questionValidation";
import controller from "./questionController";

router.post(
  `/add-question`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.questionManagement,
    constants.rights.write
  ),
  validation.addQuestion,
  controller.addQuestion
);

router.get(
  `/question-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.questionManagement,
    constants.rights.read
  ),
  validation.questionList,
  controller.questionList
);

router.get(
  `/question-detail/:question_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.questionManagement,
    constants.rights.read
  ),
  validation.questionDetail,
  controller.questionDetail
);

router.put(
  `/update-question/:question_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.questionManagement,
    constants.rights.write
  ),
  validation.updateQuestion,
  controller.updateQuestion
);

router.delete(
  `/delete-question`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.questionManagement,
    constants.rights.delete
  ),
  validation.deleteQuestion,
  controller.deleteQuestion
);

router.post(
  `/question-upload-bulk`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleExcelUpload,
  checkPrivilege(constants.privileges.questionManagement, constants.rights.write),
  controller.questionBulkUpload
);

export default router;
