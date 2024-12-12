import mongoose from "mongoose";
import constants from "@/utils/constants";
import { logger } from "@/helpers/logger";
import { ATLAS_URL, LOCAL_URL, URI, DB_OPTIONS } from "@/types/database";

const databaseConnection = async (
  ATLAS_URL: ATLAS_URL,
  LOCAL_URL: LOCAL_URL
) => {
  const DB_OPTIONS: DB_OPTIONS = {
    serverSelectionTimeoutMS: 5000,
  };
  const URI: URI = ATLAS_URL ? ATLAS_URL : LOCAL_URL;
  await mongoose
    .connect(URI, DB_OPTIONS)
    .then(() => {
      logger.info(
        ATLAS_URL ? constants.message.clConnect : constants.message.dbConnect
      );
    })
    .catch((err: any) => {
      logger.error(new Error(err.message));
    });
};

export default databaseConnection;
