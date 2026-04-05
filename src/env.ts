import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse as parseDotEnv } from "dotenv";

export function loadEnvironment(baseDir: string = process.cwd()): void {
  const envPaths = [join(baseDir, ".env"), join(baseDir, ".env.local")];

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const parsed = parseDotEnv(readFileSync(envPath));
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof process.env[key] === "undefined") {
          process.env[key] = value;
        }
      }
    }
  }
}
