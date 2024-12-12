import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./userValidation";
import controller from "./userController";
import { handlePictureUpload } from "@/middlewares/multer";

router.post(
  `/add-user`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.userManagement, constants.rights.write),
  validation.create,
  controller.create
);

router.get(
  `/user-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.userManagement, constants.rights.read),
  validation.usersList,
  controller.usersList
);

router.get(
  `/user-detail/:user_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.userManagement, constants.rights.read),
  validation.detail,
  controller.detail
);

router.put(
  `/change-picture/:user_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handlePictureUpload,
  checkPrivilege(constants.privileges.userManagement, constants.rights.write),
  validation.changePicture,
  controller.changePicture
);

router.put(
  `/update-detail/:user_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.userManagement, constants.rights.write),
  validation.update,
  controller.update
);

router.put(
  `/reset-password/:user_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.userManagement, constants.rights.write),
  validation.resetPassword,
  controller.resetPassword
);

router.put(
  `/manage-account/:user_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.userManagement, constants.rights.write),
  validation.manageAccount,
  controller.manageAccount
);

router.delete(
  `/delete-account`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.userManagement, constants.rights.delete),
  validation.deleteAccount,
  controller.deleteAccount
);

export default router;
