export type MatchStatus =
  | "ready"
  | "sent"
  | "missing_email"
  | "no_match"
  | "ambiguous_match"
  | "pdf_read_error"
  | "gmail_error"
  | "skipped_by_user";

export interface Contractor {
  name: string;
  email: string;
  rawNip: string;
  normalizedNip: string;
}

export interface InvoiceMetadata {
  filePath: string;
  fileName: string;
  invoiceNumber: string;
  rawBuyerNip: string;
  normalizedBuyerNip: string;
  errorMessage?: string;
}

export interface MatchResult {
  filePath: string;
  fileName: string;
  invoiceNumber: string;
  normalizedNip: string;
  contractorName: string;
  email: string;
  status: MatchStatus;
  errorMessage?: string;
}

export interface RuntimeConfig {
  configPath?: string;
  contractsPath: string;
  invoicesPath: string;
  reportDir: string;
  dryRun: boolean;
  limit?: number;
  overrideEmail?: string;
}

export interface WorkflowResult {
  results: MatchResult[];
  reportPath: string;
}
