import { Hono } from "hono";

const profile = new Hono();
profile.get("/", async (c) => {
  return c.json({ message: "Hello World" });
});

export default profile;
