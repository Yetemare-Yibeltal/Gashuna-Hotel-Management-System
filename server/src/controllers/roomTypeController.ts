// server/src/controllers/roomTypeController.ts
// ─────────────────────────────────────────────────────────────
// ROOM TYPE CONTROLLER — Gashuna Hotel Management System
//
// Handles room type category management:
//   GET    /api/room-types           → get all room types
//   GET    /api/room-types/:slug     → get single room type
//   POST   /api/room-types           → create room type
//   PUT    /api/room-types/:id       → update room type
//   DELETE /api/room-types/:id       → delete room type
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import RoomType from '../models/RoomType';
import Room from '../models/Room';
import { AuthRequest } from '../middleware/authMiddleware';

// ─────────────────────────────────────────────────────────────
// @desc    Get all room types
// @route   GET /api/room-types
// @access  Public
// ─────────────────────────────────────────────────────────────
export const getRoomTypes = asyncHandler(
  async (req: Request, res: Response) => {
    const { isActive } = req.query;

    const filter: Record<string, unknown> = {};

    if (isActive === 'false') {
      filter.isActive = false;
    } else {
      filter.isActive = true;
    }

    const roomTypes = await RoomType.find(filter).sort({
      displayOrder: 1,
    });

    res.status(200).json({
      success: true,
      count: roomTypes.length,
      roomTypes,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get single room type by slug or ID
// @route   GET /api/room-types/:slug
// @access  Public
// ─────────────────────────────────────────────────────────────
export const getRoomType = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;

    // Try finding by slug first, then by ID
    let roomType = await RoomType.findOne({ slug });

    if (!roomType) {
      roomType = await RoomType.findById(slug);
    }

    if (!roomType) {
      return next(
        new AppError(`No room type found with slug: ${slug}`, 404)
      );
    }

    // Get count of actual rooms of this type
    const roomCount = await Room.countDocuments({
      type: roomType.slug,
      isActive: true,
    });

    // Get available rooms count of this type
    const availableCount = await Room.countDocuments({
      type: roomType.slug,
      isActive: true,
      status: 'available',
    });

    res.status(200).json({
      success: true,
      roomType: {
        ...roomType.toObject(),
        roomCount,
        availableCount,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Create a new room type
// @route   POST /api/room-types
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const createRoomType = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      slug,
      name,
      nameAmharic,
      tagline,
      description,
      highlights,
      standardAmenities,
      minPrice,
      maxPrice,
      maxCapacity,
      recommendedFor,
      displayOrder,
    } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (
      !slug ||
      !name ||
      !nameAmharic ||
      !tagline ||
      !description ||
      !minPrice ||
      !maxPrice ||
      !maxCapacity
    ) {
      return next(
        new AppError(
          'Please provide all required fields: slug, name, nameAmharic, tagline, description, minPrice, maxPrice, maxCapacity.',
          400
        )
      );
    }

    // ── Check slug uniqueness ─────────────────────────────────
    const existing = await RoomType.findOne({ slug });
    if (existing) {
      return next(
        new AppError(
          `A room type with slug '${slug}' already exists.`,
          400
        )
      );
    }

    // ── Validate price range ──────────────────────────────────
    if (Number(minPrice) > Number(maxPrice)) {
      return next(
        new AppError(
          'Minimum price cannot be greater than maximum price.',
          400
        )
      );
    }

    const roomType = await RoomType.create({
      slug,
      name,
      nameAmharic,
      tagline,
      description,
      highlights: highlights || [],
      standardAmenities: standardAmenities || [],
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
      maxCapacity: Number(maxCapacity),
      recommendedFor: recommendedFor || [],
      displayOrder: displayOrder || 1,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Room type '${name}' created successfully.`,
      roomType,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update room type
// @route   PUT /api/room-types/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const updateRoomType = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const roomType = await RoomType.findById(req.params.id);

    if (!roomType) {
      return next(
        new AppError(
          `No room type found with ID: ${req.params.id}`,
          404
        )
      );
    }

    // ── Validate price range if both provided ─────────────────
    const newMinPrice = req.body.minPrice
      ? Number(req.body.minPrice)
      : roomType.minPrice;
    const newMaxPrice = req.body.maxPrice
      ? Number(req.body.maxPrice)
      : roomType.maxPrice;

    if (newMinPrice > newMaxPrice) {
      return next(
        new AppError(
          'Minimum price cannot be greater than maximum price.',
          400
        )
      );
    }

    const updatedRoomType = await RoomType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Room type '${roomType.name}' updated successfully.`,
      roomType: updatedRoomType,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Delete room type (soft delete)
// @route   DELETE /api/room-types/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const deleteRoomType = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const roomType = await RoomType.findById(req.params.id);

    if (!roomType) {
      return next(
        new AppError(
          `No room type found with ID: ${req.params.id}`,
          404
        )
      );
    }

    // ── Check if rooms of this type exist ─────────────────────
    const roomCount = await Room.countDocuments({
      type: roomType.slug,
      isActive: true,
    });

    if (roomCount > 0) {
      return next(
        new AppError(
          `Cannot delete room type '${roomType.name}' — there are ${roomCount} active room(s) of this type. Please deactivate all rooms of this type first.`,
          400
        )
      );
    }

    // Soft delete
    roomType.isActive = false;
    await roomType.save();

    res.status(200).json({
      success: true,
      message: `Room type '${roomType.name}' has been deactivated.`,
    });
  }
);
