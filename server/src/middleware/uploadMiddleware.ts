// server/src/middleware/uploadMiddleware.ts
// ─────────────────────────────────────────────────────────────
// FILE UPLOAD MIDDLEWARE — Gashuna Hotel Management System
//
// Handles image uploads using Multer.
// Used for uploading:
//   - Room photos
//   - Staff profile photos
//   - Menu item photos
//   - Hotel logo and gallery images
//
// Files are saved to: server/src/uploads/<category>/
// Example: server/src/uploads/rooms/room-1719234567-abc123.jpg
//
// Validation rules:
//   - Only image files allowed: jpg, jpeg, png, webp
//   - Maximum file size: 5MB (configurable in .env)
//   - Filename is randomized to prevent conflicts and overwrites
//
// Usage in route files:
//   import { uploadRoomImage } from '../middleware/uploadMiddleware';
//
//   router.post(
//     '/rooms/:id/photo',
//     protect,
//     authorize('admin', 'manager'),
//     uploadRoomImage.single('photo'),
//     uploadRoomPhoto
//   );
// ─────────────────────────────────────────────────────────────

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import AppError from '../utils/AppError';

// ── Allowed File Types ────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// ── Maximum File Size ─────────────────────────────────────────
// Read from .env or default to 5MB
const MAX_FILE_SIZE = parseInt(
  process.env.MAX_FILE_SIZE || '5242880', // 5MB in bytes
  10
);

// ── Ensure Upload Directory Exists ────────────────────────────
// Creates the upload folder if it does not already exist
// Prevents errors when trying to save the first uploaded file
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// ── Generate Unique Filename ──────────────────────────────────
// Creates a unique filename to prevent overwriting existing files
// Format: <prefix>-<timestamp>-<random>.ext
// Example: room-1719234567890-x7k2m9.jpg
const generateUniqueFilename = (
  originalname: string,
  prefix: string
): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalname).toLowerCase();

  return `${prefix}-${timestamp}-${randomString}${extension}`;
};

// ── Create Storage Engine ─────────────────────────────────────
// Builds a Multer disk storage configuration for a specific
// upload category (rooms, staff, menu, gallery)
const createStorage = (
  category: string,
  filePrefix: string
): multer.StorageEngine => {
  const uploadPath = process.env.UPLOAD_PATH || 'src/uploads';
  const destinationPath = path.join(
    process.cwd(),
    uploadPath,
    category
  );

  return multer.diskStorage({
    destination: (
      req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, destination: string) => void
    ) => {
      ensureDirectoryExists(destinationPath);
      callback(null, destinationPath);
    },
    filename: (
      req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void
    ) => {
      const uniqueFilename = generateUniqueFilename(
        file.originalname,
        filePrefix
      );
      callback(null, uniqueFilename);
    },
  });
};

// ── File Filter ────────────────────────────────────────────────
// Validates the file type before accepting the upload
// Rejects any file that is not an allowed image type
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new AppError(
        `Invalid file type: ${file.mimetype}. Only JPG, PNG, and WEBP images are allowed.`,
        400
      ) as unknown as Error
    );
  }
};

// ── Room Image Upload ─────────────────────────────────────────
// Used when uploading photos of hotel rooms
// Saves to: src/uploads/rooms/
export const uploadRoomImage = multer({
  storage: createStorage('rooms', 'room'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── Staff Photo Upload ────────────────────────────────────────
// Used when uploading staff profile photos
// Saves to: src/uploads/staff/
export const uploadStaffPhoto = multer({
  storage: createStorage('staff', 'staff'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── Menu Item Photo Upload ────────────────────────────────────
// Used when uploading photos of restaurant menu items
// Saves to: src/uploads/menu/
export const uploadMenuPhoto = multer({
  storage: createStorage('menu', 'menu'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── Gallery Photo Upload ──────────────────────────────────────
// Used when uploading hotel gallery photos
// Saves to: src/uploads/gallery/
export const uploadGalleryPhoto = multer({
  storage: createStorage('gallery', 'gallery'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── Multiple Room Images Upload ───────────────────────────────
// Used when uploading multiple photos for one room at once
// Allows up to 10 images in a single request
export const uploadMultipleRoomImages = multer({
  storage: createStorage('rooms', 'room'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
});

// ── Delete Uploaded File ──────────────────────────────────────
// Removes a file from the uploads folder
// Used when replacing an old photo or deleting a room/staff record
export const deleteUploadedFile = (filePath: string): void => {
  const fullPath = path.join(process.cwd(), filePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.info(`🗑️  Deleted file: ${filePath}`);
  }
};
