import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import { handleImageUpload, handleExcelUpload } from "@/middlewares/multer";
import validation from "./skillValidation";
import controller from "./skillController";

router.post(
  `/add-skill`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleImageUpload,
  checkPrivilege(constants.privileges.skillManagement, constants.rights.write),
  validation.addSkill,
  controller.addSkill
);

router.get(
  `/skill-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.skillManagement, constants.rights.read),
  validation.skillList,
  controller.skillList
);

router.get(
  `/skill-detail/:skill_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.skillManagement, constants.rights.read),
  validation.skillDetail,
  controller.skillDetail
);

router.put(
  `/update-skill/:skill_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleImageUpload,
  checkPrivilege(constants.privileges.skillManagement, constants.rights.write),
  validation.updateSkill,
  controller.updateSkill
);

router.delete(
  `/delete-skill`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.skillManagement, constants.rights.delete),
  validation.deleteSkill,
  controller.deleteSkill
);


router.post(
  `/skill-upload-bulk`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleExcelUpload,
  checkPrivilege(constants.privileges.skillManagement, constants.rights.write),
  controller.addSkillBulk
);


export default router;
