import { config } from "dotenv";
import { join } from "path";

config({ path: join(__dirname, "../../.env") });

export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  port: process.env.PORT ?? "3000",
  isProduction: process.env.NODE_ENV === "production",
};
