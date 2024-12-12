import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import { handleImageandLogoUpload, handleExcelUpload } from "@/middlewares/multer";
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./glossaryValidation";
import controller from "./glossaryController";

router.post(
  `/add-glossary`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleImageandLogoUpload,
  checkPrivilege(
    constants.privileges.glossaryManagement,
    constants.rights.write
  ),
  validation.addGlossary,
  controller.addGlossary
);

router.get(
  `/glossary-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.glossaryManagement,
    constants.rights.read
  ),
  validation.glossaryList,
  controller.glossaryList
);

router.get(
  `/glossary-detail/:glossary_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.glossaryManagement,
    constants.rights.read
  ),
  validation.glossaryDetail,
  controller.glossaryDetail
);

router.put(
  `/update-glossary/:glossary_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleImageandLogoUpload,
  checkPrivilege(
    constants.privileges.glossaryManagement,
    constants.rights.write
  ),
  validation.updateGlossary,
  controller.updateGlossary
);

router.delete(
  `/delete-glossary`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.glossaryManagement,
    constants.rights.delete
  ),
  validation.deleteGlossary,
  controller.deleteGlossary
);


router.post(
  `/glossaries-upload-bulk`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handleExcelUpload,
  checkPrivilege(constants.privileges.glossaryManagement, constants.rights.write),
  controller.bulkGlossaryUpload
);

export default router;
