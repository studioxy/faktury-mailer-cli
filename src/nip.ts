export function normalizeNip(value: string | null | undefined): string {
  return (value ?? "").replace(/\D+/g, "");
}
