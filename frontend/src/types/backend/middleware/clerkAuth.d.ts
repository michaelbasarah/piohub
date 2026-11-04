import type { Request } from "express";
import type { Context } from "../trpc";
export declare function getAuthContext(req: Request): Promise<Context>;
