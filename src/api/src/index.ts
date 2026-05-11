import { serve } from "@hono/node-server";
import { buildApp } from "./app";

serve(
  {
    fetch: buildApp().fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
