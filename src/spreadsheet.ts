import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import xlsx from "xlsx";

import { normalizeNip } from "./nip.js";
import type { Contractor } from "./types.js";

export async function loadContractors(path: string | URL): Promise<Contractor[]> {
  const buffer = await readFile(path instanceof URL ? fileURLToPath(path) : path);
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets["Lista kontrahentów"] ?? workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    return [];
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return rows
    .map((row) => {
      const rawNip = String(row["NIP"] ?? "").trim();
      const normalizedNip = normalizeNip(rawNip);

      return {
        name: String(row["Nazwa"] ?? "").trim(),
        email: String(row["E-mail"] ?? "").trim(),
        rawNip,
        normalizedNip,
      } satisfies Contractor;
    })
    .filter((contractor) => contractor.normalizedNip.length > 0);
}
