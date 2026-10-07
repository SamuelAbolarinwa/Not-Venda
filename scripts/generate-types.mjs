import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const types = execFileSync(
  "pnpm",
  ["exec", "supabase", "gen", "types", "typescript", "--local"],
  { encoding: "utf8" },
);
writeFileSync("packages/contracts/src/database.ts", types);
