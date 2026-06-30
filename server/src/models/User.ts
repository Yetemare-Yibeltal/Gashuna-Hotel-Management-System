// server/src/models/User.ts
// ─────────────────────────────────────────────────────────────
// USER MODEL — Gashuna Hotel Management System
//
// Represents staff accounts that can log into the admin
// dashboard. There are 3 roles:
//
//   admin        — full access to everything in the system
//   manager      — access to most modules except system settings
//   receptionist — access to bookings, check-in/out, guests only
//
// Passwords are NEVER stored in plain text.
// They are hashed using bcrypt before saving to the database.
//
// This model includes:
//   - Pre-save hook that automatically hashes the password
//   - matchPassword method to verify login attempts
//   - createPasswordResetToken method for forgot password flow
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ── Role Type ──────────────────────────────────────────────────
export type UserRole = 'admin' | 'manager' | 'receptionist';

// ── User Document Interface ───────────────────────────────────
// Defines the shape of a User document and its instance methods
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  matchPassword(enteredPassword: string): Promise<boolean>;
  createPasswordResetToken(): string;
}

// ── User Schema ────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      // select: false means password is NEVER returned in queries
      // by default — must explicitly call .select('+password')
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'receptionist'],
        message: '{VALUE} is not a valid role',
      },
      default: 'receptionist',
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    // ── Password Reset Fields ────────────────────────────────
    // Used in the forgot password flow
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    passwordChangedAt: {
      type: Date,
      select: false,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ── Index ──────────────────────────────────────────────────────
// Speeds up queries that search by email (used on every login)
userSchema.index({ email: 1 });

// ── Pre-Save Hook: Hash Password ──────────────────────────────
// Runs automatically before every save() call
// Only hashes the password if it was changed
userSchema.pre('save', async function (next) {
  // Skip hashing if password was not modified
  // (e.g. when updating just the name or email)
  if (!this.isModified('password')) {
    return next();
  }

  // Hash the password with a salt round of 12
  // Higher salt rounds = more secure but slower
  // 12 is the recommended balance for production
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // Track when the password was changed
  // Used to invalidate old JWT tokens if password changes
  this.passwordChangedAt = new Date(Date.now() - 1000);

  next();
});

// ── Instance Method: Match Password ───────────────────────────
// Compares the plain text password entered at login
// with the hashed password stored in the database
// Returns true if they match, false otherwise
userSchema.methods.matchPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Instance Method: Create Password Reset Token ─────────────
// Generates a random token for the forgot password flow
// The token is hashed before storing in the database
// (the unhashed version is sent to the user's email)
userSchema.methods.createPasswordResetToken = function (): string {
  // Generate a random 32-byte token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token before storing it in the database
  // This way even if the database is compromised,
  // the actual reset token cannot be used
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires in 10 minutes
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  // Return the UNHASHED token — this is what gets emailed to the user
  return resetToken;
};

// ── Create and Export Model ───────────────────────────────────
const User: Model<IUser> = model<IUser>('User', userSchema);

export default User;
