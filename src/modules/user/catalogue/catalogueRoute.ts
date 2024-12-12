import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./catalogueValidation";
import controller from "./catalogueController";


router.get(
    `/page-list`,
    accessRateLimiter,
    checkAccessKey,
    controller.listpages
  );

  router.get(
    `/categoryinterst-list`,
    accessRateLimiter,
    checkAccessKey,
    checkAuth.User,
    controller.categoryInterstList
  );


router.get(
  `/category-list/:category_id`,
  accessRateLimiter,
  checkAccessKey,
  controller.categoryList
);

router.get(
  `/skill-list`,
  accessRateLimiter,
  checkAccessKey,
  controller.skillList
);

router.get(
  `/skill-details`,
  accessRateLimiter,
  checkAccessKey,
  controller.skillDetails
);


export default router;
