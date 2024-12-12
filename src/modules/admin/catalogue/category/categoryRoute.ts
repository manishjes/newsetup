import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import { handleImageUpload } from "@/middlewares/multer";
import validation from "./categoryValidation";
import controller from "./categoryController";

router.post(
  `/add-category`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleImageUpload,
  checkPrivilege(
    constants.privileges.categoryManagement,
    constants.rights.write
  ),
  validation.addCategory,
  controller.addCategory
);

router.get(
  `/category-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.categoryManagement,
    constants.rights.read
  ),
  validation.categoryList,
  controller.categoryList
);

router.get(
  `/category-detail/:category_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.categoryManagement,
    constants.rights.read
  ),
  validation.categoryDetail,
  controller.categoryDetail
);

router.put(
  `/update-category/:category_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleImageUpload,
  checkPrivilege(
    constants.privileges.categoryManagement,
    constants.rights.write
  ),
  validation.updateCategory,
  controller.updateCategory
);

router.delete(
  `/delete-category`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.categoryManagement,
    constants.rights.delete
  ),
  validation.deleteCategory,
  controller.deleteCategory
);

export default router;
