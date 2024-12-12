// Helper Function Types
export type CREATE_ERROR = (status: number, message: string) => Promise<object>;

export type GET_MESSAGE = (msg: any) => Promise<any>;

export type VALIDATE_REQUEST_DATA = (
  validationRule: object,
  data: object
) => Promise<boolean>;

export type UNIX_TIME = (date: any) => Promise<number>;

export type RANDOM_NUMBER = () => Promise<number>;

export type CREATE_SLUG = (text: string) => Promise<string>;

export type TO_LOWER_CASE = (text: string) => Promise<string>;

export type TO_UPPER_CASE = (text: string) => Promise<string>;

export type EMAIL_VALIDATION = (text: string) => Promise<boolean>;

export type PHONE_VALIDATION = (
  isoCode: string,
  phoneNumber: string
) => Promise<boolean | any>;

export type MINUTES = (time: any) => Promise<number>;

export type GET_USER_NAME = (email: string) => Promise<string>;

export type HASH_PASSWORD = (password: string) => Promise<string>;

export type CHECK_PASSWORD = (
  password: string,
  hash: string
) => Promise<boolean>;

export type RANDOM_KEY_AND_IV = (
  length: number
) => Promise<CryptoJS.lib.WordArray>;

export type RANDOM_STRING = (length: number) => Promise<string>;

export type GET_FILE_NAME = (fileUrl: string) => Promise<string>;

export type PHOTO_URL = (host: string, filename: string) => Promise<string>;

export type LOGO_URL = (host: string, filename: string) => Promise<string>;

export type IMAGE_URL = (host: string, filename: string) => Promise<string>;

export type FILE_URL = (host: string, filename: string) => Promise<string>;

export type REMOVE_PHOTO = (filename: string) => Promise<void>;

export type REMOVE_LOGO = (filename: string) => Promise<void>;

export type REMOVE_IMAGE = (filename: string) => Promise<void>;

export type REMOVE_IMAGES = (files: any) => Promise<void>;

export type REMOVE_FILE = (filename: string) => Promise<void>;

export type CREATE_PASSWORD = (name: string, dob: any) => Promise<string>;

export type GENERATE_ADDRESS_SLUG = (
  name: string,
  addressType: string,
  pincode: number
) => Promise<string>;

export type CREATE_SKU = (
  category: string,
  brand: string,
  body: any
) => Promise<string>;

export type BILL_CALCULATOR = (data: any, quantity: number) => Promise<any>;

export type GENERATE_REF_NUMBER = () => Promise<string>;

export type GENERATE_ORDER_ID = () => Promise<string>;

export type GENERATE_REFERRAL_CODE = () => Promise<string>;

export type ADD_WHITESPACE = (str: string) => Promise<string>;

export type CURRENT_WEEK_DAYS = () => Promise<any>;

export type GET_RENEWAL_DATE = (text: string) => Promise<any>;
