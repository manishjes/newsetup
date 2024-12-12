import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./bookmarkValidation";
import controller from "./bookmarkController";

router.post(
  `/save-bookmark`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.saveBookmark,
  controller.saveBookmark
);

router.get(
  `/bookmark-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.bookmarkList,
  controller.bookmarkList
);

router.delete(
  `/delete-bookmark/:glossary_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.deleteBookmark,
  controller.deleteBookmark
);

export default router;
