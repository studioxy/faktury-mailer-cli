import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { MatchResult } from "./types.js";

export async function writeReport(results: MatchResult[], reportDir: string): Promise<string> {
  await mkdir(reportDir, { recursive: true });
  const fileName = `report-${new Date().toISOString().replaceAll(":", "-")}.json`;
  const reportPath = join(reportDir, fileName);

  await writeFile(reportPath, JSON.stringify(results, null, 2), "utf8");

  return reportPath;
}
