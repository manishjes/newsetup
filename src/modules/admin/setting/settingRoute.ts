import { Router } from "express";
const router = Router({ caseSensitive: true, strict: true });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./settingValidation";
import controller from "./settingController";
import { handleLogoUpload } from "@/middlewares/multer";

router.get(
  `/get-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.settingManagement, constants.rights.read),
  controller.getDetail
);

router.put(
  `/change-logo`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleLogoUpload,
  checkPrivilege(
    constants.privileges.settingManagement,
    constants.rights.write
  ),
  validation.changeLogo,
  controller.changeLogo
);

router.put(
  `/update-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.settingManagement,
    constants.rights.write
  ),
  validation.updateDetail,
  controller.updateDetail
);

router.put(
  `/manage-maintenance`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.settingManagement,
    constants.rights.write
  ),
  validation.manageMaintenance,
  controller.manageMaintenance
);

export default router;
