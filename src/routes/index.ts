import constants from "@/utils/constants";
import publicRoute from "@/modules/public/publicRoute";
import adminRoute from "@/modules/admin/adminRoute";
import adminDashboardRoute from "@/modules/admin/dashboard/dashboardRoute";
import adminSettingRoute from "@/modules/admin/setting/settingRoute";
import adminUserRoute from "@/modules/admin/user/userRoute";
import adminUserReferralRoute from "@/modules/admin/user/referral/referralRoute";
import adminUserPointRoute from "@/modules/admin/user/point/pointRoute";
import adminTemplateRoute from "@/modules/admin/template/templateRoute";
import adminPageRoute from "@/modules/admin/page/pageRoute";
import adminAddressRoute from "@/modules/admin/address/addressRoute";
import adminCatalogueRoute from "@/modules/admin/catalogue/catalogueRoute";
import adminCatalogueBrandRoute from "@/modules/admin/catalogue/brand/brandRoute";
import adminCatalogueCategoryRoute from "@/modules/admin/catalogue/category/categoryRoute";
import adminCatalogueSkillRoute from "@/modules/admin/catalogue/skill/skillRoute";
import adminCatalogueQuestionRoute from "@/modules/admin/catalogue/question/questionRoute";
import adminCatalogueQuizRoute from "@/modules/admin/catalogue/quiz/quizRoute";
import adminCatalogueGlossaryRoute from "@/modules/admin/catalogue/glossary/glossaryRoute";
import adminCatalogueFaqRoute from "@/modules/admin/catalogue/faq/faqRoute";
import adminFeedbackRoute from "@/modules/admin/feedback/feedbackRoute";
import adminProductRoute from "@/modules/admin/product/productRoute";
import adminOrderRoute from "@/modules/admin/order/orderRoute";
import adminShipmentRoute from "@/modules/admin/shipment/shipmentRoute";
import adminReviewRoute from "@/modules/admin/review/reviewRoute";
import adminSubscriptionRoute from "@/modules/admin/subscription/subscriptionRoute";
import adminSubscriptionPlanRoute from "@/modules/admin/subscription/plan/planRoute";
import userRoute from "@/modules/user/userRoute";
import userAddressRoute from "@/modules/user/address/addressRoute";
import userCatalogueRoute from "@/modules/user/catalogue/catalogueRoute";
import userCatalogueBrandRoute from "@/modules/user/catalogue/brand/brandRoute";
import userCatalogueCategoryRoute from "@/modules/user/catalogue/category/categoryRoute";
import userCatalogueSkillRoute from "@/modules/user/catalogue/skill/skillRoute";
import userCatalogueQuizRoute from "@/modules/user/catalogue/quiz/quizRoute";
import userCatalogueGlossaryRoute from "@/modules/user/catalogue/glossary/glossaryRoute";
import userCatalogueFaqRoute from "@/modules/user/catalogue/faq/faqRoute";
import userFeedbackRoute from "@/modules/user/feedback/feedbackRoute";
import userBookmarkRoute from "@/modules/user/bookmark/bookmarkRoute";
import userProductRoute from "@/modules/user/product/productRoute";
import userWishlistRoute from "@/modules/user/wishlist/wishlistRoute";
import userCartRoute from "@/modules/user/cart/cartRoute";
import userOrderRoute from "@/modules/user/order/orderRoute";
import userActivityRoute from "@/modules/user/activity/activityRoute";
import userPointRoute from "@/modules/user/point/pointRoute";
import userSubscriptionRoute from "@/modules/user/subscription/subscriptionRoute";
import userSubscriptionPlanRoute from "@/modules/user/subscription/plan/planRoute";
import userNotificationRoute from "@/modules/user/notification/notificationRoute";

export default (app: any) => {
  // Public
  app.use(`/api/public`, publicRoute);

  // Admin
  app.use(`/api/admin`, adminRoute);
  app.use(`/api/admin/dashboard`, adminDashboardRoute);
  app.use(`/api/admin/setting`, adminSettingRoute);
  app.use(`/api/admin/user`, adminUserRoute);
  app.use(`/api/admin/user/referral`, adminUserReferralRoute);
  app.use(`/api/admin/user/point`, adminUserPointRoute);
  app.use(`/api/admin/template`, adminTemplateRoute);
  app.use(`/api/admin/page`, adminPageRoute);
  app.use(`/api/admin/address`, adminAddressRoute);
  app.use(`/api/admin/catalogue`, adminCatalogueRoute);
  app.use(`/api/admin/catalogue/brand`, adminCatalogueBrandRoute);
  app.use(`/api/admin/catalogue/category`, adminCatalogueCategoryRoute);
  app.use(`/api/admin/catalogue/skill`, adminCatalogueSkillRoute);
  app.use(`/api/admin/catalogue/question`, adminCatalogueQuestionRoute);
  app.use(`/api/admin/catalogue/quiz`, adminCatalogueQuizRoute);
  app.use(`/api/admin/catalogue/glossary`, adminCatalogueGlossaryRoute);
  app.use(`/api/admin/catalogue/faq`, adminCatalogueFaqRoute);
  app.use(`/api/admin/feedback`, adminFeedbackRoute);
  app.use(`/api/admin/product`, adminProductRoute);
  app.use(`/api/admin/order`, adminOrderRoute);
  app.use(`/api/admin/shipment`, adminShipmentRoute);
  app.use(`/api/admin/review`, adminReviewRoute);
  app.use(`/api/admin/subscription`, adminSubscriptionRoute);
  app.use(`/api/admin/subscription/plan`, adminSubscriptionPlanRoute);

  // User
  app.use(`/api/user`, userRoute);
  app.use(`/api/user/address`, userAddressRoute);
  app.use(`/api/user/catalogue`, userCatalogueRoute);
  app.use(`/api/user/catalogue/brand`, userCatalogueBrandRoute);
  app.use(`/api/user/catalogue/category`, userCatalogueCategoryRoute);
  app.use(`/api/user/catalogue/skill`, userCatalogueSkillRoute);
  app.use(`/api/user/catalogue/quiz`, userCatalogueQuizRoute);
  app.use(`/api/user/catalogue/glossary`, userCatalogueGlossaryRoute);
  app.use(`/api/user/catalogue/faq`, userCatalogueFaqRoute);
  app.use(`/api/user/feedback`, userFeedbackRoute);
  app.use(`/api/user/bookmark`, userBookmarkRoute);
  app.use(`/api/user/product`, userProductRoute);
  app.use(`/api/user/wishlist`, userWishlistRoute);
  app.use(`/api/user/cart`, userCartRoute);
  app.use(`/api/user/order`, userOrderRoute);
  app.use(`/api/user/activity`, userActivityRoute);
  app.use(`/api/user/point`, userPointRoute);
  app.use(`/api/user/subscription`, userSubscriptionRoute);
  app.use(`/api/user/subscription/plan`, userSubscriptionPlanRoute);
  app.use(`/api/user/notification`, userNotificationRoute);

  app.use(`*`, (req: any, res: any) => {
    res.status(constants.code.badRequest).json({
      status: constants.status.statusFalse,
      userStatus: constants.status.statusFalse,
      message: constants.message.badRequest,
    });
  });
};
