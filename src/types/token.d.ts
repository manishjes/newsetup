export type CREATE_TOKEN = (payload: object) => Promise<string>;

export type CREATE_TOKEN_MOBILE = (payload: object) => Promise<string>;

export type DELETE_TOKEN = (token: string) => Promise<boolean | undefined>;

export type DELETE_ALL_TOKEN = (token: string) => Promise<boolean | undefined>;
