import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";

export function buildApp() {
  const app = new Hono();

  app.use(
    "/api/auth/*",
    cors({
      origin: "http://localhost:5173",
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
  app.get("/", (c) => c.text("Hello Hono!"));

  return app;
}
