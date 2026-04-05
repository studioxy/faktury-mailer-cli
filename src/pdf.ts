import { basename } from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import pdfParse from "pdf-parse";

import { normalizeNip } from "./nip.js";
import type { InvoiceMetadata } from "./types.js";

function toPath(path: string | URL): string {
  return path instanceof URL ? fileURLToPath(path) : path;
}

export async function extractInvoiceMetadata(path: string | URL): Promise<InvoiceMetadata> {
  const filePath = toPath(path);
  const buffer = await readFile(filePath);
  const parsed = await pdfParse(buffer);
  const text = parsed.text;

  const invoiceNumberMatch = text.match(/FA\/\d+\/\d{4}/);
  const buyerSection = text.split("Nabywca:")[1] ?? text;
  const nipMatch = buyerSection.match(/NIP:\s*([A-Z]{0,2}\s*[\d\s-]+)/i);
  const rawBuyerNip = nipMatch?.[1]?.trim() ?? "";

  return {
    filePath,
    fileName: basename(filePath),
    invoiceNumber: invoiceNumberMatch?.[0] ?? "",
    rawBuyerNip,
    normalizedBuyerNip: normalizeNip(rawBuyerNip),
  };
}
