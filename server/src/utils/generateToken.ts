// server/src/utils/generateToken.ts
// ─────────────────────────────────────────────────────────────
// JWT TOKEN GENERATOR — Gashuna Hotel Management System
//
// Creates a JWT token for an authenticated user and stores
// it in a secure httpOnly cookie on the response object.
//
// Called after successful login in authController.ts:
//   generateToken(res, user._id, user.role);
//
// The token contains:
//   - user id  (to identify who is making the request)
//   - role     (to check permissions on protected routes)
//
// The cookie is:
//   - httpOnly: cannot be read by JavaScript (XSS safe)
//   - secure: only sent over HTTPS in production
//   - sameSite: prevents CSRF attacks
//   - expires: after 7 days by default
// ─────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import { Response } from 'express';

// ── Token Payload Interface ───────────────────────────────────
// Defines what data is stored inside the JWT token
interface TokenPayload {
  id: string;
  role: string;
}

// ── Generate Token and Set Cookie ────────────────────────────
// Creates a JWT token and attaches it to the response as
// a secure httpOnly cookie
const generateToken = (
  res: Response,
  userId: string,
  role: string
): string => {
  // Get JWT secret from environment variables
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // Get expiry from environment or default to 7 days
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  // ── Create the JWT Token ────────────────────────────────────
  // The token payload contains the user id and role
  // The secret is used to sign the token so it cannot be tampered with
  const payload: TokenPayload = { id: userId, role };

  const token = jwt.sign(payload, jwtSecret, {
    expiresIn,
  } as jwt.SignOptions);

  // ── Calculate Cookie Expiry ────────────────────────────────
  // Convert days to milliseconds for the cookie maxAge
  const cookieExpiresInDays = parseInt(
    process.env.JWT_COOKIE_EXPIRES_IN || '7',
    10
  );
  const cookieMaxAge = cookieExpiresInDays * 24 * 60 * 60 * 1000;

  // ── Set the Cookie on the Response ────────────────────────
  res.cookie('gashuna_token', token, {
    // httpOnly prevents JavaScript from reading the cookie
    // This protects against XSS attacks
    httpOnly: true,

    // secure means the cookie is only sent over HTTPS
    // In development we use HTTP so we disable this
    secure: process.env.NODE_ENV === 'production',

    // sameSite prevents the cookie from being sent
    // with cross-site requests (CSRF protection)
    sameSite: 'strict',

    // Cookie expires after the configured number of days
    maxAge: cookieMaxAge,
  });

  // Return the token so it can also be sent in the response body
  // This is useful for API clients that prefer token in headers
  return token;
};

// ── Clear Token Cookie ────────────────────────────────────────
// Called during logout to remove the JWT cookie
export const clearToken = (res: Response): void => {
  res.cookie('gashuna_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    // Set expiry to the past to immediately delete the cookie
    expires: new Date(0),
  });
};

export default generateToken;
