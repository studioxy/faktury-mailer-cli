import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

import yauzl from "yauzl";

function toPath(path: string | URL): string {
  return path instanceof URL ? fileURLToPath(path) : path;
}

const tempDirs = new Set<string>();

async function extractZip(zipPath: string): Promise<string[]> {
  const outputDir = await mkdtemp(join(tmpdir(), "faktury-invoices-"));
  tempDirs.add(outputDir);
  await mkdir(outputDir, { recursive: true });

  return await new Promise<string[]>((resolve, reject) => {
    const extractedFiles: string[] = [];

    yauzl.open(zipPath, { lazyEntries: true }, (openError, zipFile) => {
      if (openError || !zipFile) {
        reject(openError ?? new Error("Could not open zip archive."));
        return;
      }

      zipFile.readEntry();

      zipFile.on("entry", (entry) => {
        if (/\/$/.test(entry.fileName)) {
          zipFile.readEntry();
          return;
        }

        if (extname(entry.fileName).toLowerCase() !== ".pdf") {
          zipFile.readEntry();
          return;
        }

        zipFile.openReadStream(entry, async (streamError, readStream) => {
          if (streamError || !readStream) {
            reject(streamError ?? new Error("Could not open zip entry stream."));
            return;
          }

          try {
            const outputPath = join(outputDir, basename(entry.fileName));
            await pipeline(readStream, createWriteStream(outputPath));
            extractedFiles.push(outputPath);
            zipFile.readEntry();
          } catch (error) {
            reject(error);
          }
        });
      });

      zipFile.once("end", () => resolve(extractedFiles.sort()));
      zipFile.once("error", reject);
    });
  });
}

export async function resolveInvoicePaths(path: string | URL): Promise<string[]> {
  const resolvedPath = toPath(path);

  if (extname(resolvedPath).toLowerCase() === ".zip") {
    return extractZip(resolvedPath);
  }

  const entries = await readdir(resolvedPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".pdf")
    .map((entry) => join(resolvedPath, entry.name))
    .sort();
}

export async function cleanupTempDirs(): Promise<void> {
  const dirs = [...tempDirs];
  tempDirs.clear();

  for (const dir of dirs) {
    await rm(dir, { recursive: true, force: true });
  }
}
