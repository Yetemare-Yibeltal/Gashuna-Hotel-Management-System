import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import path from 'path';
import fs from 'fs';
import Room from '../models/Room';
import Staff from '../models/Staff';
import MenuItem from '../models/MenuItem';
import { AuthRequest } from '../middleware/authMiddleware';

const getFileUrl = (filePath: string): string => {
  const normalized = filePath.replace(/\\/g, '/');
  const relative = normalized.split('src/uploads/')[1];
  return `/uploads/${relative}`;
};

export const uploadRoomImages = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return next(new AppError('Please upload at least one image.', 400));
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return next(
        new AppError(`No room found with ID: ${req.params.id}`, 404)
      );
    }

    const files = req.files as Express.Multer.File[];
    const imageUrls = files.map((file) => getFileUrl(file.path));

    room.images = [...room.images, ...imageUrls];
    await room.save();

    res.status(200).json({
      success: true,
      message: `${files.length} image(s) uploaded for Room ${room.roomNumber}.`,
      images: imageUrls,
      room,
    });
  }
);

export const uploadRoomSingleImage = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError('Please upload an image.', 400));
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return next(
        new AppError(`No room found with ID: ${req.params.id}`, 404)
      );
    }

    const imageUrl = getFileUrl(req.file.path);
    room.images = [...room.images, imageUrl];
    await room.save();

    res.status(200).json({
      success: true,
      message: `Image uploaded for Room ${room.roomNumber}.`,
      imageUrl,
      room,
    });
  }
);

export const deleteRoomImage = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return next(new AppError('Please provide the image URL to delete.', 400));
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return next(
        new AppError(`No room found with ID: ${req.params.id}`, 404)
      );
    }

    if (!room.images.includes(imageUrl)) {
      return next(
        new AppError('Image not found in this room.', 404)
      );
    }

    const filePath = path.join(
      process.cwd(),
      'src/uploads',
      imageUrl.replace('/uploads/', '')
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    room.images = room.images.filter((img) => img !== imageUrl);
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room image deleted successfully.',
      room,
    });
  }
);

export const uploadStaffPhoto = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError('Please upload a photo.', 400));
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return next(
        new AppError(`No staff member found with ID: ${req.params.id}`, 404)
      );
    }

    if (staff.photo) {
      const oldFilePath = path.join(
        process.cwd(),
        'src/uploads',
        staff.photo.replace('/uploads/', '')
      );
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const photoUrl = getFileUrl(req.file.path);
    staff.photo = photoUrl;
    await staff.save();

    res.status(200).json({
      success: true,
      message: `Photo uploaded for ${staff.fullName}.`,
      photoUrl,
      staff,
    });
  }
);

export const uploadMenuItemPhoto = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError('Please upload a photo.', 400));
    }

    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return next(
        new AppError(`No menu item found with ID: ${req.params.id}`, 404)
      );
    }

    if (menuItem.image) {
      const oldFilePath = path.join(
        process.cwd(),
        'src/uploads',
        menuItem.image.replace('/uploads/', '')
      );
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const imageUrl = getFileUrl(req.file.path);
    menuItem.image = imageUrl;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: `Photo uploaded for "${menuItem.name}".`,
      imageUrl,
      menuItem,
    });
  }
);

export const uploadGalleryImage = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError('Please upload an image.', 400));
    }

    const imageUrl = getFileUrl(req.file.path);

    res.status(200).json({
      success: true,
      message: 'Gallery image uploaded successfully.',
      imageUrl,
    });
  }
);

export const getUploadedFiles = asyncHandler(
  async (req: Request, res: Response) => {
    const { category } = req.query;

    const validCategories = [
      'rooms',
      'staff',
      'menu',
      'gallery',
      'documents',
    ];

    const uploadPath = path.join(process.cwd(), 'src/uploads');
    const result: Record<string, string[]> = {};

    if (category && validCategories.includes(category as string)) {
      const categoryPath = path.join(uploadPath, category as string);
      if (fs.existsSync(categoryPath)) {
        result[category as string] = fs
          .readdirSync(categoryPath)
          .map((file) => `/uploads/${category}/${file}`);
      }
    } else {
      for (const cat of validCategories) {
        const categoryPath = path.join(uploadPath, cat);
        if (fs.existsSync(categoryPath)) {
          result[cat] = fs
            .readdirSync(categoryPath)
            .map((file) => `/uploads/${cat}/${file}`);
        }
      }
    }

    res.status(200).json({
      success: true,
      files: result,
    });
  }
);

export const deleteUploadedFile = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return next(new AppError('Please provide the file URL to delete.', 400));
    }

    const filePath = path.join(
      process.cwd(),
      'src/uploads',
      fileUrl.replace('/uploads/', '')
    );

    if (!fs.existsSync(filePath)) {
      return next(new AppError('File not found.', 404));
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully.',
    });
  }
);
