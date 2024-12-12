import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import { handleImageUpload } from "@/middlewares/multer";
import validation from "./brandValidation";
import controller from "./brandController";

router.post(
  `/add-brand`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleImageUpload,
  checkPrivilege(constants.privileges.brandManagement, constants.rights.write),
  validation.addBrand,
  controller.addBrand
);

router.get(
  `/brand-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.brandManagement, constants.rights.read),
  validation.brandList,
  controller.brandList
);

router.get(
  `/brand-detail/:brand_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.brandManagement, constants.rights.read),
  validation.brandDetail,
  controller.brandDetail
);

router.put(
  `/update-brand/:brand_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleImageUpload,
  checkPrivilege(constants.privileges.brandManagement, constants.rights.write),
  validation.updateBrand,
  controller.updateBrand
);

router.delete(
  `/delete-brand`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.brandManagement, constants.rights.delete),
  validation.deleteBrand,
  controller.deleteBrand
);

export default router;
