import {
  MESSAGE,
  STATUS,
  CODE,
  REGISTRATION_TYPE,
  TIME_FORMAT,
  DATE_FORMAT,
  WEEK_DAY,
  TEMPLATE_TYPES,
  TEMPLATE_TITLES,
  GENDER,
  ACCOUNT_LEVEL,
  RIGHTS,
  PRIVILEGES,
  DEVICE_TYPES,
  CONSTRAINT,
  ADDRESS_TYPES,
  FEEDBACK_TYPES,
  CATALOUGE_TYPES,
  MASS_UNIT,
  MEASURE_UNIT,
  TAX_TYPES,
  PRICE_TYPES,
  QUESTION_TYPES,
  LEVELS,
  QUIZ_TYPES,
  CART_STATUS,
  TRANSACTION_TYPES,
  POINT_TYPES,
  PAYMENT_MODE,
  PAYMENT_STATUS,
  ORDER_STATUS,
  ORDER_TYPES,
  PLAN_TYPES,
  PLAN_DURATION,
  RECURRING_CYCLE,
  SHIPPING_MODES,
  SHIPMENT_STATUS,
} from "@/types/constants";

// Messages
const message: MESSAGE = {
  dbConnect: "MONGODB::Connected to database.",
  clConnect: "MONGODB::Connected to cluster.",
  retry: "Kindly Re-try After 10 Seconds.",
  success: "Success",
  failed: "Failed",
  dataNotFound: "Data not found.",
  internalServerError: "Internal server error. Please try after some time.",
  badRequest: "Couldn't parse the specified URI.",
  notAllowed: "Not allowed by CORS.",
  unwantedData: "Unwanted data found.",
  reqAccessKey: "Access key is required.",
  invalidAccesskey: "Invalid access key.",
  reqAccessToken: "Access token is required.",
  invalidAccessToken: "Invalid access token.",
  invalidEmail: "Invalid email address.",
  invalidPhone: "Invalid phone number.",
  invalidUsername: "Invalid username.",
  invalidValue: "Invalid value.",
  invalidISOstring: "Invalid ISO date string.",
  notOldEnough: "You must be of age 18 years or above.",
  emailTaken: "This email address already taken.",
  emailAvailable: "This email address is available.",
  phoneTaken: "This phone number already taken.",
  phoneAvailable: "This phone number is available.",
  usernameTaken: "This username already taken.",
  usernameAvailable: "This username is available.",
  otpLength: "OTP length should be 6 digits.",
  otpSent:
    "A mail/message with 6 digit verification code is sent successfully.",
  otpMessageSent:
    "A message with 6 digit verification code is sent successfully.",
  otpMailSent: "A mail with 6 digit verification code is sent successfully.",
  invalidOTP: "Invalid OTP.",
  otpExpire:
    "The code has expired. Please re-send the verification code to try again.",
  otpSuccess: "Code verified successfully.",
  invalidPassword: "Invalid password.",
  userInactive: "Your account is disabled.",
  userDeleted: "Your account is suspended.",
  invalidUser: "You are not a valid user.",
  userLogin: "User logged in successfully.",
  userDetail: "User details get successfully.",
  userUpdate: "User details updated successfully.",
  userDisable: "Your Account deactivated successfully.",
  userRemove: "Your Account deleted successfully.",
  reqPicture: "Picture is required.",
  reqImage: "Image is required.",
  logout: "Logout successfully.",
  logoutAll: "Logout from all devices successfully.",
  invalidFileType: "Invalid file type.",
  pictureSuccess: "Picture updated successfully.",
  emailNotRegistered: "This email is not registered.",
  phoneNotRegistered: "This phone number is not registered.",
  emailAlreadyVerified: "This email address already verified.",
  phoneAlreadyVerified: "Thie phone number already verified.",
  emailVerified: "Email verified successfully.",
  phoneVerified: "Phone verified successfully.",
  emailUpdated: "Email address changed successfully.",
  phoneUpdated: "Phone number changed successfully.",
  passwordNotMatched: "The password confirmation does not match.",
  differentPassword: "New password should be different from old password.",
  invalidOldPassword: "Invalid old password.",
  passwordChange: "Password changed successfully.",
  twoFactoreOn: "Two-factor authentication turned on successfully.",
  twoFactorOff: "Two-factor authentication turned off successfully.",
  pushNotificationOn: "Push notification turned on successfully.",
  pushNotificationOff: "Push notification turned off successfully.",
  emailNotificationOn: "Email notification turned on successfully.",
  emailNotificationOff: "Email notification turned off successfully.",
  messageNotificationOn: "Message notification turned on successfully.",
  messageNotificationOff: "Message notification turned off successfully.",
  invalidType: "The selected type is invalid.",
  resetPasswordEmail: "A mail with reset password link sent successfully.",
  invalidVerificationToken: "Invalid verification token.",
  tokenExpire:
    "The token has expired. Please re-send the verification token to try again.",
  reqPrivilege: "You do not have permission to access this route.",
  reqRight: "You do not have necessary rights to access this route.",
  timeIsGreater: "Time should be greater than current time.",
  notOldEnoughFourteen: "You must be of age 14 years or above.",
  reqVerification: "Kindly, verify your details and try again.",
  invalidReferralCode: "Invalid referral code.",
  unwantedColumns: "Unwanted columns found.",
  columnMissing: "Some of columns are missing.",
  columnNameMisMatching: `column name mismatching`,
};

// Response Status
const status: STATUS = {
  statusTrue: true,
  statusFalse: false,
};

// Response Code
const code: CODE = {
  success: 200,
  FRBDN: 403,
  dataNotFound: 404,
  badRequest: 400,
  reqTimeOut: 408,
  unAuthorized: 401,
  paymentRequired: 402,
  badMethod: 405,
  notAcceptable: 406,
  preconditionFailed: 412,
  unprocessableEntity: 422,
  tooManyRequests: 429,
  internalServerError: 500,
  badGateway: 502,
  serviceUnavailable: 503,
  gatewayTimeOut: 504,
  expectationFailed: 417,
};

// Registration Type
const registrationType: REGISTRATION_TYPE = {
  normal: "normal",
  google: "google",
  facebook: "facebook",
};

//Time Format
const timeFormat: TIME_FORMAT = {
  twelveHour: "12hour",
  twentyFourHour: "24hour",
};

//Date Format
const dateFormat: DATE_FORMAT = {
  dayMonthYear: "31/12/2024",
  monthDayYear: "12/31/2024",
  yearMonthDay: "2024-12-31",
};

//Week Day
const weekDay: WEEK_DAY = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

// Template Types
const templateType: TEMPLATE_TYPES = {
  email: "email",
  message: "message",
  notification: "notification",
};

// Template Titles
const templateTitle: TEMPLATE_TITLES = {
  otp: "Send OTP",
  resetPassword: "Reset Password",
  credential: "Credential",
  orderConfirmation: "Order Confirmation",
  orderShipped: "Order Shipped",
  orderDelivered: "Order Delivered",
  orderCancelled: "Order Cancelled",
  streakPending: "Complete Today's Streak",
  lifeRefill: "Life refill successfully"
};

// Gender
const gender: GENDER = {
  male: "male",
  female: "female",
  other: "other",
};

// Account Level
const accountLevel: ACCOUNT_LEVEL = {
  superAdmin: 1,
  admin: 2,
  user: 3,
};

// Rights
const rights: RIGHTS = {
  read: "read",
  write: "write",
  delete: "delete",
};

// Privileges
const privileges: PRIVILEGES = {
  settingManagement: "settingManagement",
  userManagement: "userManagement",
  templateManagement: "templateManagement",
  pageManagement: "pageManagement",
  addressManagement: "addressManagement",
  feedbackManagement: "feedbackManagement",
  catalogueManagement: "catalogueManagement",
  brandManagement: "brandManagement",
  glossaryManagement: "glossaryManagement",
  categoryManagement: "categoryManagement",
  skillManagement: "skillManagement",
  questionManagement: "questionManagement",
  quizManagement: "quizManagement",
  productManagement: "productManagement",
  orderManagement: "orderManagement",
  shipmentManagement: "shipmentManagement",
  reviewManagement: "reviewManagement",
  faqManagement: "faqManagement",
  planManagement: "planManagement",
  subscriptionManagement: "subscriptionManagement",
};

// Device Types
const deviceTypes: DEVICE_TYPES = {
  android: "android",
  iOS: "iOS",
  web: "web",
};

// Constraints
const constraint: CONSTRAINT = {
  primary: "primary",
  secondary: "secondary",
};

// Address Types
const addressTypes: ADDRESS_TYPES = {
  home: "home",
  work: "work",
  other: "other",
  warehouse: "warehouse",
};

// Feedback Types
const feedbackTypes: FEEDBACK_TYPES = {
  account: "account",
  application: "application",
  quiz: "quiz",
};

// Catalouge Types
const catalougeTypes: CATALOUGE_TYPES = {
  product: "product",
  skill: "skill",
  faq: "faq",
};

// Mass Units
const massUnit: MASS_UNIT = {
  mg: "mg",
  g: "g",
  kg: "kg",
};

// Measurement units
const measureUnit: MEASURE_UNIT = {
  mm: "mm",
  cm: "cm",
  m: "m",
};

// Taxes types
const taxTypes: TAX_TYPES = {
  GST: "GST",
  VAT: "VAT",
};

// Price types
const priceTypes: PRICE_TYPES = {
  inclusive: "inclusive",
  exclusive: "exclusive",
};

// Question types
const questionTypes: QUESTION_TYPES = {
  shortAnswer: "shortAnswer",
  multipleChoice: "multipleChoice",
  checkBox: "checkbox",
  dropdown: "dropdown",
};

// Levels
const levels: LEVELS = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
  expert: "expert",
  master: "master",
  extreme: "extreme",
};

// Quiz types
const quizTypes: QUIZ_TYPES = {
  skill: "skill",
  survey: "survey",
};

// Cart Status
const cartStatus: CART_STATUS = {
  open: 1,
  inReview: 2,
  fulfilled: 3,
};

// Transaction Types
const transactionTypes: TRANSACTION_TYPES = {
  debit: "debit",
  credit: "credit",
};

// Points Types
const pointTypes: POINT_TYPES = {
  learning: "learning",
  referrel: "referrel",
  streakBonus: "streakBonus",
  learningPathBonus: "learningPathBonus",
  badges: "badges",
  survey: "survey",
  coupanPurchase: "coupanPurchase",
  lifeRefill: "lifeRefill",
};

// Payment Modes
const paymentMode: PAYMENT_MODE = {
  prepaid: 0,
  postpaid: 1,
};

// Payment Status
const paymentStatus: PAYMENT_STATUS = {
  pending: 0,
  paid: 1,
  failed: 2,
};

// Order Types
const orderType: ORDER_TYPES = {
  self: 0,
  online: 1,
};

// Order Status
const orderStatus: ORDER_STATUS = {
  open: 0,
  pending: 1,
  onHold: 2,
  awaitingFulfillment: 3,
  awaitingShipment: 4,
  shipped: 5,
  partiallyShipped: 6,
  inTransit: 7,
  outForDelivery: 8,
  completed: 9,
  partiallyCompleted: 10,
  cancelled: 11,
  returned: 12,
  refund: 13,
};

// Shipment Status
const shipmentStatus: SHIPMENT_STATUS = {
  open: 0,
  awaitingPickup: 1,
  dispatched: 2,
  delivered: 3,
  declined: 4,
  cancelled: 5,
};

// Subscription Plan Types
const planType: PLAN_TYPES = {
  trial: "trial",
  basic: "basic",
  standard: "standard",
};

// Subscription Plan Duration
const planDuration: PLAN_DURATION = {
  day: "day",
  week: "week",
  month: "month",
  year: "year",
};

// Subscription Recurring Cycle
const recurringCycle: RECURRING_CYCLE = {
  daily: "daily",
  biweekly: "biweekly",
  weekly: "weekly",
  monthly: "monthly",
  quarterly: "quarterly",
  annually: "annually",
};

// Shipping Modes
const shippingMode: SHIPPING_MODES = {
  surface: "surface",
  air: "air",
};

const pageSlug = {
  termscondition: "terms-condition",
  privacypolicy: "privacy-policy"
}

export default {
  message,
  status,
  code,
  registrationType,
  timeFormat,
  dateFormat,
  weekDay,
  templateType,
  templateTitle,
  gender,
  accountLevel,
  rights,
  privileges,
  deviceTypes,
  constraint,
  addressTypes,
  feedbackTypes,
  catalougeTypes,
  massUnit,
  measureUnit,
  taxTypes,
  priceTypes,
  questionTypes,
  levels,
  quizTypes,
  cartStatus,
  transactionTypes,
  pointTypes,
  paymentMode,
  paymentStatus,
  orderType,
  orderStatus,
  shipmentStatus,
  planType,
  planDuration,
  recurringCycle,
  shippingMode,
  pageSlug
};
