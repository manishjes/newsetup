// Constant Messages Types
export interface MESSAGE {
  dbConnect: string;
  clConnect: string;
  retry: string;
  success: string;
  failed: string;
  dataNotFound: string;
  internalServerError: string;
  badRequest: string;
  notAllowed: string;
  unwantedData: string;
  reqAccessKey: string;
  invalidAccesskey: string;
  reqAccessToken: string;
  invalidAccessToken: string;
  invalidEmail: string;
  invalidPhone: string;
  invalidUsername: string;
  invalidValue: string;
  invalidISOstring: string;
  notOldEnough: string;
  emailTaken: string;
  emailAvailable: string;
  phoneTaken: string;
  phoneAvailable: string;
  usernameTaken: string;
  usernameAvailable: string;
  otpLength: string;
  otpSent: string;
  otpMessageSent: string;
  otpMailSent: string;
  invalidOTP: string;
  otpExpire: string;
  otpSuccess: string;
  invalidPassword: string;
  userInactive: string;
  userDeleted: string;
  invalidUser: string;
  userLogin: string;
  userDetail: string;
  userUpdate: string;
  userDisable: string;
  userRemove: string;
  reqPicture: string;
  reqImage: string;
  logout: string;
  logoutAll: string;
  invalidFileType: string;
  pictureSuccess: string;
  emailNotRegistered: string;
  phoneNotRegistered: string;
  emailAlreadyVerified: string;
  phoneAlreadyVerified: string;
  emailVerified: string;
  phoneVerified: string;
  emailUpdated: string;
  phoneUpdated: string;
  passwordNotMatched: string;
  differentPassword: string;
  invalidOldPassword: string;
  passwordChange: string;
  twoFactoreOn: string;
  twoFactorOff: string;
  pushNotificationOn: string;
  pushNotificationOff: string;
  emailNotificationOn: string;
  emailNotificationOff: string;
  messageNotificationOn: string;
  messageNotificationOff: string;
  invalidType: string;
  resetPasswordEmail: string;
  invalidVerificationToken: string;
  tokenExpire: string;
  reqPrivilege: string;
  reqRight: string;
  timeIsGreater: string;
  notOldEnoughFourteen: string;
  reqVerification: string;
  invalidReferralCode: string;
  unwantedColumns:string;
  columnMissing:string;
  columnNameMisMatching:string
}

// Response Status Types
export interface STATUS {
  statusTrue: boolean;
  statusFalse: boolean;
}

// Response Code Types
export interface CODE {
  success: number;
  FRBDN: number;
  dataNotFound: number;
  badRequest: number;
  reqTimeOut: number;
  unAuthorized: number;
  paymentRequired: number;
  badMethod: number;
  notAcceptable: number;
  preconditionFailed: number;
  unprocessableEntity: number;
  tooManyRequests: number;
  internalServerError: number;
  badGateway: number;
  serviceUnavailable: number;
  gatewayTimeOut: number;
  expectationFailed: number;
}

// Registration Type Types
export interface REGISTRATION_TYPE {
  normal: string;
  google: string;
  facebook: string;
}

// Time Format
export interface TIME_FORMAT {
  twelveHour: string;
  twentyFourHour: string;
}

// Date Format
export interface DATE_FORMAT {
  dayMonthYear: string;
  monthDayYear: string;
  yearMonthDay: string;
}

// Week Day
export interface WEEK_DAY {
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
}

// Template Types
export interface TEMPLATE_TYPES {
  email: string;
  message: string;
  notification: string;
}

// Template Titles
export interface TEMPLATE_TITLES {
  otp: string;
  resetPassword: string;
  credential: string;
  orderConfirmation: string;
  orderShipped: string;
  orderDelivered: string;
  orderCancelled: string;
  streakPending: string;
  lifeRefill:string
}

// Gender
export interface GENDER {
  male: string;
  female: string;
  other: string;
}

// Account Level
export interface ACCOUNT_LEVEL {
  superAdmin: number;
  admin: number;
  user: number;
}

// Rights
export interface RIGHTS {
  read: string;
  write: string;
  delete: string;
}

// Rights
export interface PRIVILEGES {
  settingManagement: string;
  userManagement: string;
  templateManagement: string;
  pageManagement: string;
  addressManagement: string;
  feedbackManagement: string;
  catalogueManagement: string;
  brandManagement: string;
  glossaryManagement: string;
  categoryManagement: string;
  skillManagement: string;
  questionManagement: string;
  quizManagement: string;
  productManagement: string;
  orderManagement: string;
  shipmentManagement: string;
  reviewManagement: string;
  faqManagement: string;
  planManagement: string;
  subscriptionManagement: string;
}

// Device Types
export interface DEVICE_TYPES {
  android: string;
  iOS: string;
  web: string;
}

// Constraints
export interface CONSTRAINT {
  primary: string;
  secondary: string;
}

// Address Types
export interface ADDRESS_TYPES {
  home: string;
  work: string;
  other: string;
  warehouse: string;
}

// Feedback Types
export interface FEEDBACK_TYPES {
  account: string;
  application: string;
  quiz: string;
}

// Catalouge Types
export interface CATALOUGE_TYPES {
  product: string;
  skill: string;
  faq: string;
}

// Mass Units
export interface MASS_UNIT {
  mg: string;
  g: string;
  kg: string;
}

// Measurement units
export interface MEASURE_UNIT {
  mm: string;
  cm: string;
  m: string;
}

// Taxes types
export interface TAX_TYPES {
  GST: string;
  VAT: string;
}

// Price types
export interface PRICE_TYPES {
  inclusive: string;
  exclusive: string;
}

// Question types
export interface QUESTION_TYPES {
  shortAnswer: string;
  multipleChoice: string;
  checkBox: string;
  dropdown: string;
}

// Levels
export interface LEVELS {
  easy: string;
  medium: string;
  hard: string;
  expert: string;
  master: string;
  extreme: string;
}

// Quiz types
export interface QUIZ_TYPES {
  skill: string;
  survey: string;
}

// Cart Status
export interface CART_STATUS {
  open: number;
  inReview: number;
  fulfilled: number;
}

// Transaction Types
export interface TRANSACTION_TYPES {
  debit: string;
  credit: string;
}

// Points Types
export interface POINT_TYPES {
  learning: string;
  referrel: string;
  streakBonus: string;
  learningPathBonus: string;
  badges: string;
  survey: string;
  coupanPurchase: string;
  lifeRefill: string;
}

// Payment Modes
export interface PAYMENT_MODE {
  prepaid: number;
  postpaid: number;
}

// Payment Status
export interface PAYMENT_STATUS {
  pending: number;
  paid: number;
  failed: number;
}

// Order Types
export interface ORDER_TYPES {
  self: number;
  online: number;
}

// Order Status
export interface ORDER_STATUS {
  open: number;
  pending: number;
  onHold: number;
  awaitingFulfillment: number;
  awaitingShipment: number;
  shipped: number;
  partiallyShipped: number;
  inTransit: number;
  outForDelivery: number;
  completed: number;
  partiallyCompleted: number;
  cancelled: number;
  returned: number;
  refund: number;
}

// Shipment Status
export interface SHIPMENT_STATUS {
  open: number;
  awaitingPickup: number;
  dispatched: number;
  delivered: number;
  declined: number;
  cancelled: number;
}

// Subscription Plan Types
export interface PLAN_TYPES {
  trial: string;
  basic: string;
  standard: string;
}

// Subscription Plan Duration
export interface PLAN_DURATION {
  day: string;
  week: string;
  month: string;
  year: string;
}

// Subscription Recurring Cycle
export interface RECURRING_CYCLE {
  daily: string;
  biweekly: string;
  weekly: string;
  monthly: string;
  quarterly: string;
  annually: string;
}

// Shipping Modes
export interface SHIPPING_MODES {
  surface: string;
  air: string;
}
