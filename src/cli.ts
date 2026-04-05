import { basename } from "node:path";
import { pathToFileURL } from "node:url";

import { parseCliArgs } from "./config.js";
import { promptForSendConfirmation } from "./confirm.js";
import { loadEnvironment } from "./env.js";
import { cleanupTempDirs, resolveInvoicePaths } from "./inputs.js";
import { matchInvoicesToContractors } from "./matching.js";
import { extractInvoiceMetadata } from "./pdf.js";
import { printPreview } from "./preview.js";
import { writeReport } from "./reporting.js";
import { loadContractors } from "./spreadsheet.js";
import { createConsoleUi } from "./ui.js";
import type { InvoiceMetadata, MatchResult, RuntimeConfig, WorkflowResult } from "./types.js";

function buildPdfReadError(filePath: string, error: unknown): MatchResult {
  return {
    filePath,
    fileName: basename(filePath),
    invoiceNumber: "",
    normalizedNip: "",
    contractorName: "",
    email: "",
    status: "pdf_read_error",
    errorMessage: error instanceof Error ? error.message : String(error),
  };
}

export async function runWorkflow(config: RuntimeConfig): Promise<WorkflowResult> {
  const ui = createConsoleUi();
  ui.printHeader("Faktury Mailer", [
    `${config.dryRun ? "DRY RUN" : "SEND MODE"}  •  invoices: ${config.invoicesPath}`,
    `contracts: ${config.contractsPath}`,
    `report dir: ${config.reportDir}`,
  ]);

  const scanStep = ui.createStep("Scanning invoices");
  const invoicePaths = await resolveInvoicePaths(config.invoicesPath);
  const limitedInvoicePaths =
    typeof config.limit === "number" ? invoicePaths.slice(0, config.limit) : invoicePaths;
  scanStep.succeed(
    typeof config.limit === "number"
      ? `${limitedInvoicePaths.length} invoice files selected from ${invoicePaths.length}`
      : `${limitedInvoicePaths.length} invoice files found`,
  );

  const contractorStep = ui.createStep("Loading contractors");
  const contractors = await loadContractors(config.contractsPath);
  contractorStep.succeed(`${contractors.length} contractors loaded`);

  const invoiceMetadata: InvoiceMetadata[] = [];
  const parseErrors: MatchResult[] = [];

  try {
    const extractStep = ui.createStep("Extracting PDF data");
    for (const invoicePath of limitedInvoicePaths) {
      extractStep.update(`${invoiceMetadata.length + parseErrors.length + 1}/${limitedInvoicePaths.length} ${basename(invoicePath)}`);
      try {
        invoiceMetadata.push(await extractInvoiceMetadata(invoicePath));
      } catch (error) {
        parseErrors.push(buildPdfReadError(invoicePath, error));
      }
    }
    if (parseErrors.length > 0) {
      extractStep.warn(
        `${invoiceMetadata.length} parsed, ${parseErrors.length} failed to parse`,
      );
    } else {
      extractStep.succeed(`${invoiceMetadata.length} invoices parsed`);
    }

    const matchingStep = ui.createStep("Matching by NIP");
    let results = [
      ...matchInvoicesToContractors(invoiceMetadata, contractors),
      ...parseErrors,
    ].sort((left, right) => left.fileName.localeCompare(right.fileName));
    const readyCount = results.filter((result) => result.status === "ready").length;
    const issueCount = results.length - readyCount;
    matchingStep.succeed(`${readyCount} ready, ${issueCount} requiring attention`);

    if (!config.dryRun) {
      ui.info(
        `Preflight: ${readyCount} ready to send, ${issueCount} require attention${
          config.overrideEmail ? `, override email: ${config.overrideEmail}` : ""
        }`,
      );

      if (readyCount === 0) {
        ui.warn("No ready invoices to send.");
      } else {
        const confirmed = await promptForSendConfirmation(readyCount);

        if (!confirmed) {
          results = results.map((result) =>
            result.status === "ready" ? { ...result, status: "skipped_by_user" } : result,
          );
          ui.warn("Send cancelled by user. Ready entries were marked as skipped.");
        } else {
          const sendingStep = ui.createStep("Sending emails");
          const { sendReadyInvoices } = await import("./gmail.js");
          results = await sendReadyInvoices(results, config.overrideEmail);
          const sentCount = results.filter((result) => result.status === "sent").length;
          const gmailErrors = results.filter((result) => result.status === "gmail_error").length;
          if (gmailErrors > 0) {
            sendingStep.warn(`${sentCount} sent, ${gmailErrors} Gmail errors`);
          } else {
            sendingStep.succeed(`${sentCount} emails sent`);
          }
        }
      }
    } else {
      ui.warn("Dry run active. No emails were sent.");
    }

    printPreview(results, ui.colorEnabled);
    const reportStep = ui.createStep("Writing report");
    const reportPath = await writeReport(results, config.reportDir);
    reportStep.succeed(reportPath);

    return { results, reportPath };
  } finally {
    await cleanupTempDirs();
  }
}

async function main(): Promise<void> {
  loadEnvironment();
  const config = await parseCliArgs(process.argv);
  const result = await runWorkflow(config);
  console.log(`\nReport written to: ${result.reportPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
