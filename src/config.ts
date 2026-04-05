import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";

import { Command } from "commander";

import type { RuntimeConfig } from "./types.js";

interface FileConfig {
  workspaceDir?: string;
  contractsFile?: string;
  invoicesPath?: string;
  reportDir?: string;
}

function resolveMaybeRelative(baseDir: string, target?: string): string | undefined {
  if (!target) {
    return undefined;
  }

  return isAbsolute(target) ? target : resolve(baseDir, target);
}

export async function parseCliArgs(argv: string[]): Promise<RuntimeConfig> {
  const program = new Command();

  program
    .allowUnknownOption(false)
    .option("--config <path>")
    .option("--contracts <path>")
    .option("--invoices <path>")
    .option("--report-dir <path>")
    .option("--dry-run")
    .option("--limit <number>", "limit invoices processed", (value: string) =>
      Number.parseInt(value, 10),
    )
    .option("--override-email <email>");

  program.parse(argv);
  const options = program.opts<{
    config?: string;
    contracts?: string;
    invoices?: string;
    reportDir?: string;
    dryRun?: boolean;
    limit?: number;
    overrideEmail?: string;
  }>();

  const configPath = options.config ? resolve(options.config) : undefined;
  const configDir = configPath ? dirname(configPath) : process.cwd();
  const fileConfig: FileConfig = configPath
    ? JSON.parse(await readFile(configPath, "utf8"))
    : {};
  const workspaceDir = resolveMaybeRelative(configDir, fileConfig.workspaceDir) ?? process.cwd();

  const contractsPath =
    resolveMaybeRelative(process.cwd(), options.contracts) ??
    resolveMaybeRelative(workspaceDir, fileConfig.contractsFile);
  const invoicesPath =
    resolveMaybeRelative(process.cwd(), options.invoices) ??
    resolveMaybeRelative(workspaceDir, fileConfig.invoicesPath);
  const reportDir =
    resolveMaybeRelative(process.cwd(), options.reportDir) ??
    resolveMaybeRelative(workspaceDir, fileConfig.reportDir) ??
    resolve(process.cwd(), "reports");

  if (!contractsPath || !invoicesPath) {
    throw new Error("Missing required invoice or contractor paths.");
  }

  return {
    configPath,
    contractsPath,
    invoicesPath,
    reportDir,
    dryRun: Boolean(options.dryRun),
    limit: options.limit,
    overrideEmail: options.overrideEmail,
  };
}
