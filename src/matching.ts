import type { Contractor, InvoiceMetadata, MatchResult } from "./types.js";

export function matchInvoicesToContractors(
  invoices: InvoiceMetadata[],
  contractors: Contractor[],
): MatchResult[] {
  const contractorsByNip = new Map<string, Contractor[]>();

  for (const contractor of contractors) {
    const group = contractorsByNip.get(contractor.normalizedNip) ?? [];
    group.push(contractor);
    contractorsByNip.set(contractor.normalizedNip, group);
  }

  return invoices.map((invoice) => {
    const matches = contractorsByNip.get(invoice.normalizedBuyerNip) ?? [];

    if (matches.length === 0) {
      return {
        filePath: invoice.filePath,
        fileName: invoice.fileName,
        invoiceNumber: invoice.invoiceNumber,
        normalizedNip: invoice.normalizedBuyerNip,
        contractorName: "",
        email: "",
        status: "no_match",
      } satisfies MatchResult;
    }

    if (matches.length > 1) {
      return {
        filePath: invoice.filePath,
        fileName: invoice.fileName,
        invoiceNumber: invoice.invoiceNumber,
        normalizedNip: invoice.normalizedBuyerNip,
        contractorName: "",
        email: "",
        status: "ambiguous_match",
      } satisfies MatchResult;
    }

    const contractor = matches[0]!;

    return {
      filePath: invoice.filePath,
      fileName: invoice.fileName,
      invoiceNumber: invoice.invoiceNumber,
      normalizedNip: invoice.normalizedBuyerNip,
      contractorName: contractor.name,
      email: contractor.email,
      status: contractor.email ? "ready" : "missing_email",
    } satisfies MatchResult;
  });
}
