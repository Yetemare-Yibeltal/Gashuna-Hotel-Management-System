// server/src/utils/generateBookingRef.ts
// ─────────────────────────────────────────────────────────────
// BOOKING REFERENCE GENERATOR — Gashuna Hotel Management System
//
// Generates a unique booking reference number for every
// new reservation made at Gashuna Hotel.
//
// Format: GSH-XXXXXX
// Example: GSH-7K3F9A, GSH-2MN8PQ, GSH-9JK5RT
//
// GSH = Gashuna Hotel prefix
// XXXXXX = 6 random uppercase alphanumeric characters
//
// The generator:
// 1. Creates a random 6-character string
// 2. Checks the database to ensure it is unique
// 3. If it already exists, generates a new one and tries again
// 4. Returns the unique reference
//
// Used in bookingController.ts when creating a new booking:
//   const bookingRef = await generateBookingRef();
// ─────────────────────────────────────────────────────────────

// ── Character Set ─────────────────────────────────────────────
// Only uppercase letters and numbers
// Removed similar looking characters: 0, O, I, 1, L
// to avoid confusion when reading the reference aloud
const CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// ── Prefix ────────────────────────────────────────────────────
// GSH = Gashuna Hotel
const PREFIX = 'GSH';

// ── Reference Length ─────────────────────────────────────────
// 6 characters after the prefix gives 32^6 = 1,073,741,824
// possible combinations — more than enough for any hotel
const REF_LENGTH = 6;

// ── Generate Random String ────────────────────────────────────
// Creates a random string of the specified length
// using only characters from the CHARACTERS set
const generateRandomString = (length: number): string => {
  let result = '';

  for (let i = 0; i < length; i++) {
    // Pick a random character from the character set
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    result += CHARACTERS[randomIndex];
  }

  return result;
};

// ── Generate Booking Reference ────────────────────────────────
// Generates a unique booking reference and checks the database
// to make sure it does not already exist
// Returns a promise so it can be awaited in controllers
const generateBookingRef = async (): Promise<string> => {
  // Import Booking model here to avoid circular imports
  // We import inside the function because the model
  // is not available when this utility file first loads
  const { default: Booking } = await import('../models/Booking');

  let isUnique = false;
  let bookingRef = '';

  // Keep generating until we find a unique reference
  // In practice this loop almost never runs more than once
  while (!isUnique) {
    // Generate a new reference
    const randomPart = generateRandomString(REF_LENGTH);
    bookingRef = `${PREFIX}-${randomPart}`;

    // Check if this reference already exists in the database
    const existingBooking = await Booking.findOne({ bookingRef });

    // If no booking found with this reference, it is unique
    if (!existingBooking) {
      isUnique = true;
    }
    // If it already exists, the loop continues and generates a new one
  }

  return bookingRef;
};

// ── Generate Simple Reference (synchronous version) ──────────
// Used when we need a reference quickly without checking DB
// Less safe — only use for testing or non-critical purposes
export const generateSimpleBookingRef = (): string => {
  const randomPart = generateRandomString(REF_LENGTH);
  return `${PREFIX}-${randomPart}`;
};

export default generateBookingRef;
