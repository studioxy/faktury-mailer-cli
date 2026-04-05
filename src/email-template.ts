export function buildEmail(invoiceNumber: string): { subject: string; body: string } {
  return {
    subject: `Faktura ${invoiceNumber}`,
    body: "Dzień dobry,\n\nw załączeniu przesyłam fakturę.\n",
  };
}
