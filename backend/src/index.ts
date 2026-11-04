import "./env"; // Load env vars first
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import { getAuthContext } from "./middleware/clerkAuth";
import { appRouter } from "./routers";
import { ENV } from "./env";

const app = express();

// FRONTEND_URL may be a comma-separated list, e.g.
// "https://example.com,https://www.example.com"
app.use(
  cors({
    origin: ENV.frontendUrl.split(",").map((u) => u.trim()),
    credentials: true,
  })
);

app.use(express.json());

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req }) => getAuthContext(req),
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(Number(ENV.port), () => {
  console.log(`pioHub backend running on port ${ENV.port}`);
});
