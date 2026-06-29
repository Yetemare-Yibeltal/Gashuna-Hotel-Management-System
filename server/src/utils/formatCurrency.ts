// server/src/utils/formatCurrency.ts
// ─────────────────────────────────────────────────────────────
// CURRENCY FORMATTER — Gashuna Hotel Management System
//
// Formats all monetary values as Ethiopian Birr (ETB).
// Used across invoices, booking confirmations, reports,
// payroll, and any other place money is displayed.
//
// Ethiopian VAT rate is 15% as required by ERCA
// (Ethiopian Revenue and Customs Authority)
//
// Usage examples:
//   formatETB(1800)          → 'ETB 1,800.00'
//   formatETB(7500)          → 'ETB 7,500.00'
//   calculateVAT(1800)       → 270  (15% of 1800)
//   addVAT(1800)             → 2070 (1800 + 15%)
//   calculateTotal(1800, 3)  → 5400 (1800 × 3 nights)
// ─────────────────────────────────────────────────────────────

// ── VAT Configuration ─────────────────────────────────────────
// Ethiopian VAT rate — 15% as required by ERCA
// This is read from environment variables so it can be
// changed without modifying the code
export const VAT_RATE = parseFloat(process.env.VAT_RATE || '0.15');

// ── Format Ethiopian Birr ─────────────────────────────────────
// Formats a number as Ethiopian Birr currency string
// Example: 1800 → 'ETB 1,800.00'
export const formatETB = (amount: number): string => {
  // Round to 2 decimal places to avoid floating point issues
  const rounded = Math.round(amount * 100) / 100;

  // Format with thousands separator and 2 decimal places
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `ETB ${formatted}`;
};

// ── Format ETB for Display (short version) ────────────────────
// Used in tables and cards where space is limited
// Example: 1800 → 'ETB 1,800'
export const formatETBShort = (amount: number): string => {
  const rounded = Math.round(amount);

  const formatted = rounded.toLocaleString('en-US');

  return `ETB ${formatted}`;
};

// ── Calculate VAT Amount ──────────────────────────────────────
// Calculates the VAT amount on a given price
// Example: calculateVAT(1800) → 270 (15% of 1800)
export const calculateVAT = (amount: number): number => {
  const vat = amount * VAT_RATE;
  // Round to 2 decimal places
  return Math.round(vat * 100) / 100;
};

// ── Add VAT to Amount ─────────────────────────────────────────
// Returns the total amount including VAT
// Example: addVAT(1800) → 2070 (1800 + 270)
export const addVAT = (amount: number): number => {
  const total = amount + calculateVAT(amount);
  return Math.round(total * 100) / 100;
};

// ── Remove VAT from Amount ────────────────────────────────────
// Extracts the pre-VAT amount from a VAT-inclusive price
// Used when the stored price already includes VAT
// Example: removeVAT(2070) → 1800
export const removeVAT = (amountWithVAT: number): number => {
  const preVAT = amountWithVAT / (1 + VAT_RATE);
  return Math.round(preVAT * 100) / 100;
};

// ── Calculate Booking Total ───────────────────────────────────
// Calculates the total room charge before VAT
// Example: calculateRoomTotal(1800, 3) → 5400 (3 nights)
export const calculateRoomTotal = (
  pricePerNight: number,
  nights: number
): number => {
  return Math.round(pricePerNight * nights * 100) / 100;
};

// ── Build Invoice Summary ─────────────────────────────────────
// Returns a complete price breakdown for an invoice
// Used in invoiceController.ts to build invoice line items
export const buildPriceSummary = (
  subtotal: number
): {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  subtotalFormatted: string;
  vatAmountFormatted: string;
  totalFormatted: string;
} => {
  const vatAmount = calculateVAT(subtotal);
  const total = subtotal + vatAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatRate: VAT_RATE,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    subtotalFormatted: formatETB(subtotal),
    vatAmountFormatted: formatETB(vatAmount),
    totalFormatted: formatETB(total),
  };
};

// ── Round to 2 Decimal Places ─────────────────────────────────
// Utility to safely round money amounts
// Prevents floating point errors like 1800.0000000001
export const roundMoney = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};
