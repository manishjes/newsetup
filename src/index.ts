import "module-alias/register";
import express, { Express } from "express";
import http from "http";
import https from "https";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import cronjob from "@/helpers/cronjob";
import { morganMiddleware } from "@/helpers/logger";
import { errorHandler } from "@/middlewares/handler";
import { readFileSync } from "fs";
import path from "path";
import databaseConnection from "@/config/db";
import router from "@/routes";
import constants from "@/utils/constants";
import queues from "@/helpers/queue";

//Configuration
dotenv.config({ path: "./.env.development.local" });

const app: Express = express();

const whitelist = [process.env.ADMIN_ADDRESS];

const corsOptionsDelegate = (req: any, callback: any) => {
  let corsOptions;
  if (whitelist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true, methods: ["GET", "POST", "PUT", "DELETE"] };
    if (req.path.endsWith(".*")) {
      corsOptions = { origin: true, methods: ["GET"] };
    }
  } else {
    corsOptions = { origin: false };
    console.log(constants.message.notAllowed);
  }
  callback(null, corsOptions);
};

app.use(
  helmet(),
  cors(),
  express.json({ limit: "5mb" }),
  express.static("public"),
  morganMiddleware
);
router(app);
databaseConnection(process.env.ATLAS_URL, process.env.LOCAL_URL);
app.use(errorHandler);
cronjob();
queues();

const privateKeyFile = readFileSync(
  path.join(__dirname, "./config/ssl/development/privkey.pem"),
  "utf8"
);

const fullChainFile = readFileSync(
  path.join(__dirname, "./config/ssl/development/fullchain.pem"),
  "utf8"
);

const httpServer = http.createServer(app);

const httpsServer = https.createServer(
  {
    key: privateKeyFile,
    cert: fullChainFile,
  },
  app
);

if (process.env.NODE_ENV === "dev") {
  httpServer.listen(process.env.PORT, () => {
    console.log(`HTTP Server is running on port ${process.env.PORT}`);
  });
} else {
  httpsServer.listen(process.env.PORT, () => {
    console.log(`HTTPS Server is running on port ${process.env.PORT}`);
  });
}
