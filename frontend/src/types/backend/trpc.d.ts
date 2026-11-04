import type { User } from "./schema";
export type Context = {
    user: User | null;
};
export declare const router: import("@trpc/server").TRPCRouterBuilder<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}>;
export declare const publicProcedure: import("@trpc/server").TRPCProcedureBuilder<Context, object, object, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
export declare const protectedProcedure: import("@trpc/server").TRPCProcedureBuilder<Context, object, {
    user: {
        role: "user" | "admin";
        id: number;
        clerkId: string;
        name: string | null;
        email: string | null;
        university: string | null;
        skills: string | null;
        portfolioLink: string | null;
        bio: string | null;
        createdAt: Date;
        updatedAt: Date;
        lastSignedIn: Date;
    };
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
export declare const adminProcedure: import("@trpc/server").TRPCProcedureBuilder<Context, object, {
    user: {
        role: "user" | "admin";
        id: number;
        clerkId: string;
        name: string | null;
        email: string | null;
        university: string | null;
        skills: string | null;
        portfolioLink: string | null;
        bio: string | null;
        createdAt: Date;
        updatedAt: Date;
        lastSignedIn: Date;
    };
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
