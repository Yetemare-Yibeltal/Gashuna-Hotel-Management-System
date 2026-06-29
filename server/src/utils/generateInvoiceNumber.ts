// server/src/utils/generateInvoiceNumber.ts
// ─────────────────────────────────────────────────────────────
// INVOICE NUMBER GENERATOR — Gashuna Hotel Management System
//
// Generates a unique sequential invoice number for every
// new invoice created at Gashuna Hotel.
//
// Format: INV-YYYY-NNNNN
// Example: INV-2025-00001, INV-2025-00002, INV-2025-00099
//
// INV  = Invoice prefix
// YYYY = Current year (resets every year)
// NNNNN = 5-digit sequential number padded with zeros
//
// The generator:
// 1. Gets the current year
// 2. Finds the last invoice created this year
// 3. Increments its number by 1
// 4. Pads the number with leading zeros to 5 digits
// 5. Returns the new invoice number
//
// This ensures invoice numbers are:
// - Sequential and easy to track
// - Reset at the start of every new year
// - Compliant with ERCA Ethiopian tax regulations
//
// Used in invoiceController.ts when creating a new invoice:
//   const invoiceNumber = await generateInvoiceNumber();
// ─────────────────────────────────────────────────────────────

// ── Prefix ────────────────────────────────────────────────────
const PREFIX = 'INV';

// ── Padding Length ────────────────────────────────────────────
// Invoice numbers are padded to 5 digits
// 00001, 00002, ... 00099, 00100, ... 09999, 10000
const PAD_LENGTH = 5;

// ── Generate Invoice Number ───────────────────────────────────
// Finds the last invoice number for the current year
// and returns the next sequential number
const generateInvoiceNumber = async (): Promise<string> => {
  // Import Invoice model here to avoid circular imports
  const { default: Invoice } = await import('../models/Invoice');

  // Get the current year
  const currentYear = new Date().getFullYear();

  // ── Find the Last Invoice This Year ──────────────────────────
  // Search for invoices that start with INV-YYYY
  // Sort by invoiceNumber descending to get the latest one first
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: new RegExp(`^${PREFIX}-${currentYear}-`),
  }).sort({ invoiceNumber: -1 });

  let nextNumber = 1;

  if (lastInvoice && lastInvoice.invoiceNumber) {
    // Extract the sequential number from the last invoice
    // INV-2025-00042 → split by '-' → ['INV', '2025', '00042']
    const parts = lastInvoice.invoiceNumber.split('-');

    if (parts.length === 3) {
      // Parse the last part as an integer
      // '00042' → 42
      const lastNumber = parseInt(parts[2], 10);

      // Increment by 1
      nextNumber = lastNumber + 1;
    }
  }

  // ── Format the Invoice Number ─────────────────────────────────
  // Pad the number with leading zeros to PAD_LENGTH digits
  // 1 → '00001', 42 → '00042', 1000 → '01000'
  const paddedNumber = String(nextNumber).padStart(PAD_LENGTH, '0');

  // Combine all parts into the final invoice number
  // INV-2025-00001
  const invoiceNumber = `${PREFIX}-${currentYear}-${paddedNumber}`;

  return invoiceNumber;
};

// ── Generate Invoice Number with Custom Prefix ────────────────
// Used for receipt numbers or other document types
// Example: RCP-2025-00001 for receipts
export const generateDocumentNumber = async (
  prefix: string
): Promise<string> => {
  const { default: Invoice } = await import('../models/Invoice');

  const currentYear = new Date().getFullYear();

  const lastDoc = await Invoice.findOne({
    invoiceNumber: new RegExp(`^${prefix}-${currentYear}-`),
  }).sort({ invoiceNumber: -1 });

  let nextNumber = 1;

  if (lastDoc && lastDoc.invoiceNumber) {
    const parts = lastDoc.invoiceNumber.split('-');
    if (parts.length === 3) {
      nextNumber = parseInt(parts[2], 10) + 1;
    }
  }

  const paddedNumber = String(nextNumber).padStart(PAD_LENGTH, '0');
  return `${prefix}-${currentYear}-${paddedNumber}`;
};

export default generateInvoiceNumber;
