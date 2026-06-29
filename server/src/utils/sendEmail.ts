// server/src/utils/sendEmail.ts
// ─────────────────────────────────────────────────────────────
// EMAIL SENDER — Gashuna Hotel Management System
//
// Sends transactional emails using Nodemailer.
// All emails sent by the system go through this utility.
//
// Emails sent by this system:
// 1. Booking confirmation — sent to guest after booking
// 2. Invoice email — sent with payment details
// 3. Password reset — sent to staff who forgot password
// 4. Check-in reminder — sent day before arrival
// 5. Check-out reminder — sent on departure day
//
// Email configuration comes from server/.env:
//   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
//
// For development: use Mailtrap (https://mailtrap.io)
//   Free account gives you a test inbox
//   No real emails are sent during development
//
// For production: use a real SMTP service like:
//   - Gmail (with App Password)
//   - SendGrid
//   - Mailgun
//   - AWS SES
// ─────────────────────────────────────────────────────────────

import nodemailer from 'nodemailer';
import { formatETB } from './formatCurrency';

// ── Email Options Interface ───────────────────────────────────
// Defines the shape of the options object passed to sendEmail
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ── Booking Confirmation Email Data ──────────────────────────
interface BookingConfirmationData {
  guestName: string;
  bookingRef: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  paymentMethod: string;
}

// ── Invoice Email Data ────────────────────────────────────────
interface InvoiceEmailData {
  guestName: string;
  invoiceNumber: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentMethod: string;
  paidAt: string;
}

// ── Create Transporter ────────────────────────────────────────
// Creates a Nodemailer transporter using credentials from .env
// The transporter is the connection to the email server
const createTransporter = (): nodemailer.Transporter => {
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    // true for port 465 (SSL), false for other ports
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

// ── Send Email ────────────────────────────────────────────────
// Main function to send any email
// Takes an EmailOptions object and sends the email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      // From address shown to the recipient
      from: `${process.env.EMAIL_FROM_NAME || 'Gashuna Hotel'} <${process.env.EMAIL_FROM || 'noreply@gashunahotel.et'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      // Plain text version for email clients that don't support HTML
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    await transporter.sendMail(mailOptions);

    console.info(`✅ Email sent successfully to: ${options.to}`);
    console.info(`   Subject: ${options.subject}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to send email to ${options.to}:`);
      console.error(`   ${error.message}`);
    }
    // We throw the error so the caller can handle it
    throw error;
  }
};

// ── Send Booking Confirmation Email ──────────────────────────
// Sent to the guest immediately after a successful booking
export const sendBookingConfirmationEmail = async (
  to: string,
  data: BookingConfirmationData
): Promise<void> => {
  const subject = `Booking Confirmed — ${data.bookingRef} | Gashuna Hotel`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #0B1A2E;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          color: #C9972A;
          margin: 0;
          font-size: 28px;
          letter-spacing: 2px;
        }
        .header p {
          color: #ffffff;
          margin: 5px 0 0;
          font-size: 13px;
          opacity: 0.7;
        }
        .body {
          padding: 30px;
        }
        .greeting {
          font-size: 18px;
          color: #333333;
          margin-bottom: 20px;
        }
        .ref-box {
          background-color: #FDF3DC;
          border: 2px solid #C9972A;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .ref-box p {
          margin: 0;
          font-size: 13px;
          color: #666666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .ref-box h2 {
          margin: 8px 0 0;
          font-size: 32px;
          color: #0B1A2E;
          letter-spacing: 4px;
          font-family: monospace;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .details-table tr {
          border-bottom: 1px solid #eeeeee;
        }
        .details-table td {
          padding: 12px 8px;
          font-size: 14px;
        }
        .details-table td:first-child {
          color: #888888;
          width: 40%;
        }
        .details-table td:last-child {
          color: #333333;
          font-weight: bold;
        }
        .total-row td {
          background-color: #f9f9f9;
          font-size: 16px !important;
          color: #0B1A2E !important;
        }
        .footer {
          background-color: #0B1A2E;
          padding: 20px 30px;
          text-align: center;
        }
        .footer p {
          color: #ffffff;
          font-size: 12px;
          margin: 4px 0;
          opacity: 0.7;
        }
        .amharic {
          font-size: 16px;
          color: #C9972A;
          text-align: center;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 GASHUNA HOTEL</h1>
          <p>Dangla, Awi Zone, Amhara Region, Ethiopia</p>
        </div>

        <div class="body">
          <p class="greeting">Dear ${data.guestName},</p>

          <p style="color: #555555; line-height: 1.6;">
            Thank you for choosing Gashuna Hotel. Your reservation has been
            confirmed. Please save your booking reference below — you will
            need it at check-in.
          </p>

          <div class="ref-box">
            <p>Your Booking Reference</p>
            <h2>${data.bookingRef}</h2>
          </div>

          <table class="details-table">
            <tr>
              <td>Room</td>
              <td>${data.roomName}</td>
            </tr>
            <tr>
              <td>Check-In</td>
              <td>${data.checkIn}</td>
            </tr>
            <tr>
              <td>Check-Out</td>
              <td>${data.checkOut}</td>
            </tr>
            <tr>
              <td>Nights</td>
              <td>${data.nights} ${data.nights === 1 ? 'night' : 'nights'}</td>
            </tr>
            <tr>
              <td>Payment Method</td>
              <td>${data.paymentMethod}</td>
            </tr>
            <tr class="total-row">
              <td>Total Amount</td>
              <td>${formatETB(data.totalAmount)} (incl. 15% VAT)</td>
            </tr>
          </table>

          <p class="amharic">እናመስግናለን — ቦታ ተይዟል ✅</p>

          <p style="color: #555555; font-size: 13px; line-height: 1.6;">
            If you have any questions about your reservation, please contact us:
            <br>📞 +251 93 456 7890
            <br>✉️ info@gashunahotel.et
          </p>
        </div>

        <div class="footer">
          <p>🏨 Gashuna Hotel — Dangla, Awi Zone, Amhara Region, Ethiopia</p>
          <p>📞 +251 93 456 7890 | ✉️ info@gashunahotel.et</p>
          <p>This is an automated email. Please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to, subject, html });
};

// ── Send Invoice Email ────────────────────────────────────────
// Sent to the guest when their invoice is generated and paid
export const sendInvoiceEmail = async (
  to: string,
  data: InvoiceEmailData
): Promise<void> => {
  const subject = `Invoice ${data.invoiceNumber} — Gashuna Hotel`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background-color: #0B1A2E; padding: 30px; text-align: center; }
        .header h1 { color: #C9972A; margin: 0; font-size: 28px; letter-spacing: 2px; }
        .header p { color: #ffffff; margin: 5px 0 0; font-size: 13px; opacity: 0.7; }
        .body { padding: 30px; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .invoice-table tr { border-bottom: 1px solid #eeeeee; }
        .invoice-table td { padding: 12px 8px; font-size: 14px; }
        .invoice-table td:first-child { color: #888888; width: 60%; }
        .invoice-table td:last-child { color: #333333; font-weight: bold; text-align: right; }
        .total-row td { background-color: #0B1A2E; color: #C9972A !important; font-size: 16px !important; }
        .paid-badge { background-color: #27ae60; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; display: inline-block; margin: 15px 0; }
        .footer { background-color: #0B1A2E; padding: 20px 30px; text-align: center; }
        .footer p { color: #ffffff; font-size: 12px; margin: 4px 0; opacity: 0.7; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 GASHUNA HOTEL</h1>
          <p>Dangla, Awi Zone, Amhara Region, Ethiopia</p>
        </div>
        <div class="body">
          <p style="font-size: 18px; color: #333333;">Dear ${data.guestName},</p>
          <p style="color: #555555;">Please find your invoice details below.</p>
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Payment Date:</strong> ${data.paidAt}</p>
          <span class="paid-badge">✅ PAID</span>
          <table class="invoice-table">
            <tr>
              <td>Subtotal</td>
              <td>${formatETB(data.subtotal)}</td>
            </tr>
            <tr>
              <td>VAT (15% — ERCA)</td>
              <td>${formatETB(data.vatAmount)}</td>
            </tr>
            <tr class="total-row">
              <td>Total Amount Paid</td>
              <td>${formatETB(data.total)}</td>
            </tr>
          </table>
          <p style="color: #555555; font-size: 13px;">
            Payment Method: ${data.paymentMethod}
            <br><br>
            For any questions: 📞 +251 93 456 7890 | ✉️ info@gashunahotel.et
          </p>
        </div>
        <div class="footer">
          <p>🏨 Gashuna Hotel — Dangla, Awi Zone, Amhara Region, Ethiopia</p>
          <p>VAT Registration: ${process.env.HOTEL_VAT_NUMBER || 'VAT-ET-0001234'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to, subject, html });
};

// ── Send Password Reset Email ─────────────────────────────────
// Sent to staff members who request a password reset
export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetURL = `${process.env.CLIENT_URL}/admin/reset-password/${resetToken}`;

  const subject = 'Password Reset Request — Gashuna Hotel';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background-color: #0B1A2E; padding: 30px; text-align: center; }
        .header h1 { color: #C9972A; margin: 0; font-size: 28px; }
        .body { padding: 30px; }
        .btn { display: inline-block; background-color: #C9972A; color: #ffffff; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0; }
        .warning { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; font-size: 13px; color: #856404; margin-top: 20px; }
        .footer { background-color: #0B1A2E; padding: 20px; text-align: center; }
        .footer p { color: #ffffff; font-size: 12px; opacity: 0.7; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 GASHUNA HOTEL</h1>
        </div>
        <div class="body">
          <p style="font-size: 18px; color: #333333;">Dear ${name},</p>
          <p style="color: #555555; line-height: 1.6;">
            We received a request to reset your password for the Gashuna Hotel
            Management System. Click the button below to reset your password.
          </p>
          <a href="${resetURL}" class="btn">Reset My Password</a>
          <p style="color: #555555; font-size: 13px;">
            Or copy and paste this link into your browser:
            <br>
            <a href="${resetURL}" style="color: #C9972A; word-break: break-all;">${resetURL}</a>
          </p>
          <div class="warning">
            ⚠️ This link expires in <strong>10 minutes</strong>.
            If you did not request a password reset, please ignore this email
            and contact your system administrator immediately.
          </div>
        </div>
        <div class="footer">
          <p>🏨 Gashuna Hotel — Dangla, Awi Zone, Amhara Region, Ethiopia</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to, subject, html });
};
