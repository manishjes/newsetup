import { Request, Response, NextFunction } from "express";
import multer, { diskStorage } from "multer";
import constants from ".././utils/constants";
import { createError } from "@/helpers/helper";

// Picture or Photo
const multerStorage = diskStorage({
  destination: (req: Request, file: any, cb: CallableFunction) => {
    cb(null, "public/photos");
  },
  filename: (req: Request, file: any, cb: CallableFunction) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${Date.now()}.${ext}`);
  },
});

const multerFilter = (req: Request, file: any, cb: CallableFunction) => {
  const allowedMimes = [
    // "image/jpeg",
    // "image/jpg",
    // "image/png",
    "image/webp",
    // "image/avif",
    // "image/heif",
    // "image/heic",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    return cb(new Error(constants.message.invalidFileType));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("picture");

export const handlePictureUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return next(
        await createError(constants.code.preconditionFailed, err.message)
      );
    } else if (err) {
      return next(
        await createError(constants.code.preconditionFailed, err.message)
      );
    } else {
      next();
    }
  });
};

// Logo
const multerStorageLogo = diskStorage({
  destination: (req: Request, file: any, cb: CallableFunction) => {
    cb(null, "public/logos");
  },
  filename: (req: Request, file: any, cb: CallableFunction) => {
    const ext = file.mimetype.split("/")[1];
    ext === "svg+xml"
      ? cb(null, `${Date.now()}.svg`)
      : cb(null, `${Date.now()}.${ext}`);
  },
});

const multerFilterLogo = (req: Request, file: any, cb: CallableFunction) => {
  const allowedMimes = ["image/png", "image/svg+xml"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    return cb(new Error(constants.message.invalidFileType));
  }
};

const uploadLogo = multer({
  storage: multerStorageLogo,
  fileFilter: multerFilterLogo,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("logo");

export const handleLogoUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadLogo(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return next(
        await createError(constants.code.preconditionFailed, err.message)
      );
    } else if (err) {
      return next(
        await createError(constants.code.preconditionFailed, err.message)
      );
    } else {
      next();
    }
  });
};

// Single Image
const multerStorageImage = diskStorage({
  destination: (req, file, cb) => {
   
    if (file.fieldname === 'image') {
      cb(null, 'public/images'); 
    } else if (file.fieldname === 'logo') {
      cb(null, 'public/logos'); 
    } 
  },
  filename: (req: Request, file: any, cb: CallableFunction) => {
    const ext = file.mimetype.split("/")[1];
    ext === "svg+xml"
      ? cb(null, `${Date.now()}.svg`)
      : cb(null, `${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`);
  },
});

const multerFilterImage = (req: Request, file: any, cb: CallableFunction) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/heif",
    "image/heic",
    "image/svg+xml",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    return cb(new Error(constants.message.invalidFileType));
  }
};

const uploadImage = multer({
  storage: multerStorageImage,
  fileFilter: multerFilterImage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");

export const handleImageUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadImage(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return next(
        await createError(constants.code.preconditionFailed, err.message)
      );
    } else if (err) {
      return next(
        await createError(constants.code.preconditionFailed, err.message)
      );
    } else {
      next();
    }
  });
};

// Multiple Images
const multerStorageImages = diskStorage({
  destination: (req: Request, file: any, cb: CallableFunction) => {
    cb(null, "public/images");
  },
  filename: (req: Request, file: any, cb: CallableFunction) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${Date.now()}${Math.floor(Math.random() * 10000)}.${ext}`);
  },
});

const multerFilterImages = (req: Request, file: any, cb: CallableFunction) => {
  const allowedMimes = ["image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    return cb(new Error(constants.message.invalidFileType));
  }
};

const uploadImages = multer({
  storage: multerStorageImages,
  fileFilter: multerFilterImages,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("images", 10);

export const handleImagesUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadImages(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return next(
        await createError(constants.code.preconditionFailed, err.message)
      );
    } else if (err) {
      return next(
        await createError(constants.code.preconditionFailed, err.message)
      );
    } else {
      next();
    }
  });
};
const multerStorageFive = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/files");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${Date.now()}.xlsx`);
  },
});

const multerFilterFive:any = (req: any, file: any, cb: any) => {
  let allowedMimes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    return cb(new Error(constants.message.invalidFileType));
  }
};

const uploadFive = multer({
  storage: multerStorageFive,
  fileFilter: multerFilterFive,
  limits: { fileSize: 50 * 1024 * 1024 },
}).single("excelFile");

export const handleExcelUpload = (req: any, res: Response, next: NextFunction) => {
  uploadFive(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(constants.code.preconditionFailed).json({
        status: constants.status.statusFalse,
        userStatus: req.status,
        message: err.message,
      });
    } else if (err) {
      return res.status(constants.code.preconditionFailed).json({
        status: constants.status.statusFalse,
        userStatus: req.status,
        message: err.message,
      });
    }
    next();
  });
};

const uploadLogoImage = multer({
  storage: multerStorageImage,
  fileFilter: multerFilterImage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  {
    name: "image",
    maxCount: 1,
  },
  {
    name: "logo",
    maxCount: 1,
  },
]);


export const handleImageandLogoUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadLogoImage(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return next(
        await createError(constants.code.preconditionFailed, err.message)
      );
    } else if (err) {
      return next(
        await createError(constants.code.preconditionFailed, err.message)
      );
    } else {
      next();
    }
  });
};