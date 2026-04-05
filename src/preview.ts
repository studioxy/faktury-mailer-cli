import type { MatchResult, MatchStatus } from "./types.js";
import { badge, paint, strong } from "./ui.js";

const ATTENTION_STATUSES: MatchStatus[] = [
  "missing_email",
  "no_match",
  "ambiguous_match",
  "pdf_read_error",
  "gmail_error",
];

function summarizeResults(results: MatchResult[]) {
  const counts = {
    total: results.length,
    ready: 0,
    sent: 0,
    skipped: 0,
    missingEmail: 0,
    noMatch: 0,
    ambiguous: 0,
    errors: 0,
  };

  for (const result of results) {
    switch (result.status) {
      case "ready":
        counts.ready += 1;
        break;
      case "sent":
        counts.sent += 1;
        break;
      case "skipped_by_user":
        counts.skipped += 1;
        break;
      case "missing_email":
        counts.missingEmail += 1;
        break;
      case "no_match":
        counts.noMatch += 1;
        break;
      case "ambiguous_match":
        counts.ambiguous += 1;
        break;
      case "pdf_read_error":
      case "gmail_error":
        counts.errors += 1;
        break;
      default:
        break;
    }
  }

  return counts;
}

function statusTone(status: MatchStatus): "blue" | "orange" | "green" | "red" | "gray" {
  switch (status) {
    case "ready":
    case "sent":
      return "green";
    case "missing_email":
    case "ambiguous_match":
      return "orange";
    case "no_match":
    case "pdf_read_error":
    case "gmail_error":
      return "red";
    default:
      return "gray";
  }
}

function statusLabel(status: MatchStatus): string {
  switch (status) {
    case "missing_email":
      return "MISSING";
    case "no_match":
      return "NO MATCH";
    case "ambiguous_match":
      return "AMBIG";
    case "pdf_read_error":
      return "PDF ERR";
    case "gmail_error":
      return "GMAIL";
    case "skipped_by_user":
      return "SKIPPED";
    default:
      return status.toUpperCase();
  }
}

function truncate(value: string, width: number): string {
  if (!value) {
    return "-".padEnd(width, " ");
  }

  if (value.length <= width) {
    return value.padEnd(width, " ");
  }

  if (width <= 3) {
    return value.slice(0, width);
  }

  return `${value.slice(0, width - 3)}...`;
}

function box(title: string, lines: string[], colorEnabled: boolean): string[] {
  const width = Math.max(title.length + 4, ...lines.map((line) => line.length), 48);
  const horizontal = `+${"-".repeat(width + 2)}+`;
  const titleLine = `| ${strong(colorEnabled, title.padEnd(width, " "))} |`;
  const body = lines.map((line) => `| ${line.padEnd(width, " ")} |`);

  return [
    paint(colorEnabled, "blue", horizontal),
    titleLine,
    paint(colorEnabled, "blue", horizontal),
    ...body,
    paint(colorEnabled, "blue", horizontal),
  ];
}

function renderStatusBadge(status: MatchStatus, colorEnabled: boolean): string {
  return badge(colorEnabled, statusTone(status), statusLabel(status));
}

function renderSummaryLine(summary: ReturnType<typeof summarizeResults>, colorEnabled: boolean): string {
  return [
    `${badge(colorEnabled, "blue", "TOTAL")} ${summary.total}`,
    `${badge(colorEnabled, "green", "READY")} ${summary.ready}`,
    `${badge(colorEnabled, "green", "SENT")} ${summary.sent}`,
    `${badge(colorEnabled, "orange", "SKIP")} ${summary.skipped}`,
    `${badge(colorEnabled, "orange", "MAIL")} ${summary.missingEmail}`,
    `${badge(colorEnabled, "red", "MATCH")} ${summary.noMatch}`,
    `${badge(colorEnabled, "orange", "AMB")} ${summary.ambiguous}`,
    `${badge(colorEnabled, "red", "ERR")} ${summary.errors}`,
  ].join("  ");
}

function tableHeader(colorEnabled: boolean): string {
  return [
    paint(colorEnabled, "blue", truncate("FILE", 28)),
    paint(colorEnabled, "blue", truncate("INVOICE", 14)),
    paint(colorEnabled, "blue", truncate("NIP", 12)),
    paint(colorEnabled, "blue", truncate("CONTRACTOR", 24)),
    paint(colorEnabled, "blue", truncate("EMAIL", 28)),
    paint(colorEnabled, "blue", "STATUS"),
  ].join(" | ");
}

function compactRow(result: MatchResult, colorEnabled: boolean): string {
  return [
    strong(colorEnabled, truncate(result.fileName, 28)),
    truncate(result.invoiceNumber || "-", 14),
    truncate(result.normalizedNip || "-", 12),
    truncate(result.contractorName || "-", 24),
    truncate(result.email || "-", 28),
    renderStatusBadge(result.status, colorEnabled),
  ].join(" | ");
}

export function formatPreview(results: MatchResult[], colorEnabled = false): string {
  const summary = summarizeResults(results);
  const readyOrSent = results.filter(
    (result) =>
      result.status === "ready" ||
      result.status === "sent" ||
      result.status === "skipped_by_user",
  );
  const attention = results.filter((result) => ATTENTION_STATUSES.includes(result.status));
  const lines: string[] = [""];

  lines.push(
    ...box("Run Summary", [renderSummaryLine(summary, colorEnabled)], colorEnabled),
  );

  if (attention.length > 0) {
    const attentionLines = [tableHeader(colorEnabled)];
    for (const result of attention) {
      attentionLines.push(compactRow(result, colorEnabled));
      if (result.errorMessage) {
        attentionLines.push(
          `  ${paint(colorEnabled, "gray", truncate(result.errorMessage, 110))}`,
        );
      }
    }
    lines.push("", ...box("Requires Attention", attentionLines, colorEnabled));
  }

  if (readyOrSent.length > 0) {
    const readyLines = [tableHeader(colorEnabled)];
    for (const result of readyOrSent.slice(0, 12)) {
      readyLines.push(compactRow(result, colorEnabled));
    }
    if (readyOrSent.length > 12) {
      readyLines.push(
        paint(
          colorEnabled,
          "gray",
          `... and ${readyOrSent.length - 12} more entries hidden in preview`,
        ),
      );
    }
    lines.push("", ...box("Ready To Send", readyLines, colorEnabled));
  }

  return lines.join("\n");
}

export function printPreview(results: MatchResult[], colorEnabled = false): void {
  console.log(formatPreview(results, colorEnabled));
}
