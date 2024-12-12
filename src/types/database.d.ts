// DB Types
export type ATLAS_URL = string;
export type LOCAL_URL = string;
export type URI = string;
export interface DB_OPTIONS {
  serverSelectionTimeoutMS: number;
}

// REDIS Types
export type REDIS_KEY = string;
export type REDIS_CALLBACK = () => any;
