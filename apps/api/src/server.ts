import { z } from "zod";
import { buildApp } from "./app.js";
const env = z
  .object({
    SUPABASE_URL: z.url(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    PORT: z.coerce.number().int().default(3001),
  })
  .parse(process.env);
const app = buildApp({
  supabaseUrl: env.SUPABASE_URL,
  supabaseKey: env.SUPABASE_PUBLISHABLE_KEY,
  logger: true,
});
await app.listen({ port: env.PORT, host: "127.0.0.1" });
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => void app.close());
