// server/src/controllers/roomController.ts
// ─────────────────────────────────────────────────────────────
// ROOM CONTROLLER — Gashuna Hotel Management System
//
// Handles all room management operations:
//   GET    /api/rooms              → get all rooms with filters
//   GET    /api/rooms/:id          → get single room by ID
//   POST   /api/rooms              → create new room
//   PUT    /api/rooms/:id          → update room details
//   DELETE /api/rooms/:id          → delete room
//   PATCH  /api/rooms/:id/status   → update room status only
//   GET    /api/rooms/available    → get available rooms for dates
//   GET    /api/rooms/stats        → get room statistics
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Room from '../models/Room';
import Booking from '../models/Booking';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';

// ─────────────────────────────────────────────────────────────
// @desc    Get all rooms with optional filters
// @route   GET /api/rooms
// @access  Public
// ─────────────────────────────────────────────────────────────
export const getRooms = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      type,
      status,
      minPrice,
      maxPrice,
      capacity,
      floor,
      isActive,
      sortBy,
      order,
    } = req.query;

    // ── Build filter object ───────────────────────────────────
    const filter: Record<string, unknown> = {};

    // Only show active rooms to public
    // Admin can pass isActive=false to see inactive rooms
    if (isActive === 'false') {
      filter.isActive = false;
    } else {
      filter.isActive = true;
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (floor) filter.floor = Number(floor);

    // Capacity filter — find rooms that can hold at least
    // the specified number of guests
    if (capacity) {
      filter.capacity = { $gte: Number(capacity) };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      filter.price = priceFilter;
    }

    // ── Build sort object ─────────────────────────────────────
    const sortField = (sortBy as string) || 'price';
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: Record<string, number> = { [sortField]: sortOrder };

    const rooms = await Room.find(filter).sort(sortObj);

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get available rooms for specific dates
// @route   GET /api/rooms/available?checkIn=&checkOut=&capacity=
// @access  Public
// ─────────────────────────────────────────────────────────────
export const getAvailableRooms = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { checkIn, checkOut, capacity, type } = req.query;

    if (!checkIn || !checkOut) {
      return next(
        new AppError(
          'Please provide check-in and check-out dates.',
          400
        )
      );
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    // Validate dates
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return next(new AppError('Invalid date format provided.', 400));
    }

    if (checkOutDate <= checkInDate) {
      return next(
        new AppError('Check-out date must be after check-in date.', 400)
      );
    }

    if (checkInDate < new Date()) {
      return next(
        new AppError('Check-in date cannot be in the past.', 400)
      );
    }

    // ── Find rooms with overlapping bookings ──────────────────
    // A booking overlaps if:
    // existing checkIn < new checkOut AND existing checkOut > new checkIn
    const bookedRoomIds = await Booking.distinct('room', {
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    // ── Build filter for available rooms ──────────────────────
    const filter: Record<string, unknown> = {
      isActive: true,
      status: { $nin: ['maintenance'] },
      _id: { $nin: bookedRoomIds },
    };

    if (capacity) {
      filter.capacity = { $gte: Number(capacity) };
    }

    if (type) {
      filter.type = type;
    }

    const availableRooms = await Room.find(filter).sort({ price: 1 });

    // Calculate number of nights
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    res.status(200).json({
      success: true,
      count: availableRooms.length,
      nights,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      rooms: availableRooms,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Public
// ─────────────────────────────────────────────────────────────
export const getRoomById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return next(
        new AppError(`No room found with ID: ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      room,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get room statistics for admin dashboard
// @route   GET /api/rooms/stats
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getRoomStats = asyncHandler(
  async (req: Request, res: Response) => {
    // Aggregate room counts by status
    const statusStats = await Room.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregate room counts by type
    const typeStats = await Room.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ]);

    const totalRooms = await Room.countDocuments({ isActive: true });
    const availableRooms = await Room.countDocuments({
      isActive: true,
      status: 'available',
    });
    const occupiedRooms = await Room.countDocuments({
      isActive: true,
      status: 'occupied',
    });

    const occupancyRate =
      totalRooms > 0
        ? Math.round((occupiedRooms / totalRooms) * 100 * 10) / 10
        : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalRooms,
        availableRooms,
        occupiedRooms,
        occupancyRate,
        statusBreakdown: statusStats,
        typeBreakdown: typeStats,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const createRoom = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      roomNumber,
      type,
      name,
      nameAmharic,
      floor,
      view,
      size,
      price,
      capacity,
      beds,
      amenities,
      description,
    } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (
      !roomNumber ||
      !type ||
      !name ||
      !floor ||
      !view ||
      !size ||
      !price ||
      !capacity ||
      !beds ||
      !description
    ) {
      return next(
        new AppError(
          'Please provide all required room details: room number, type, name, floor, view, size, price, capacity, beds, and description.',
          400
        )
      );
    }

    // ── Check room number is unique ───────────────────────────
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return next(
        new AppError(
          `Room number ${roomNumber} already exists. Please use a different room number.`,
          400
        )
      );
    }

    // ── Create room ───────────────────────────────────────────
    const room = await Room.create({
      roomNumber,
      type,
      name,
      nameAmharic,
      floor: Number(floor),
      view,
      size: Number(size),
      price: Number(price),
      capacity: Number(capacity),
      beds,
      amenities: amenities || [],
      description,
      status: 'available',
      isActive: true,
    });

    // ── Log the action ────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'Room',
        resourceId: room._id.toString(),
        description: `${req.user.name} created new room: ${room.name} (Room ${room.roomNumber})`,
        newData: room.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `Room ${roomNumber} — ${name} created successfully.`,
      room,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update room details
// @route   PUT /api/rooms/:id
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const updateRoom = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return next(
        new AppError(`No room found with ID: ${req.params.id}`, 404)
      );
    }

    // Store previous data for audit log
    const previousData = room.toObject();

    // ── Prevent updating room number to an existing one ───────
    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({
        roomNumber: req.body.roomNumber,
        _id: { $ne: req.params.id },
      });

      if (existingRoom) {
        return next(
          new AppError(
            `Room number ${req.body.roomNumber} is already in use.`,
            400
          )
        );
      }
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // ── Log the update ────────────────────────────────────────
    if (req.user && updatedRoom) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Room',
        resourceId: room._id.toString(),
        description: `${req.user.name} updated room: ${room.name} (Room ${room.roomNumber})`,
        previousData,
        newData: updatedRoom.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Room ${room.roomNumber} updated successfully.`,
      room: updatedRoom,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update room status only
// @route   PATCH /api/rooms/:id/status
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const updateRoomStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status } = req.body;

    const validStatuses = [
      'available',
      'occupied',
      'cleaning',
      'maintenance',
      'reserved',
    ];

    if (!status || !validStatuses.includes(status)) {
      return next(
        new AppError(
          `Invalid status. Valid values are: ${validStatuses.join(', ')}`,
          400
        )
      );
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return next(
        new AppError(`No room found with ID: ${req.params.id}`, 404)
      );
    }

    const previousStatus = room.status;
    room.status = status;
    await room.save();

    // ── Log the status change ─────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Room',
        resourceId: room._id.toString(),
        description: `${req.user.name} changed Room ${room.roomNumber} status from '${previousStatus}' to '${status}'`,
        previousData: { status: previousStatus },
        newData: { status },
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Room ${room.roomNumber} status updated to '${status}'.`,
      room,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Delete a room (soft delete — sets isActive to false)
// @route   DELETE /api/rooms/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const deleteRoom = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return next(
        new AppError(`No room found with ID: ${req.params.id}`, 404)
      );
    }

    // ── Check for active bookings before deleting ─────────────
    const activeBookings = await Booking.countDocuments({
      room: req.params.id,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
    });

    if (activeBookings > 0) {
      return next(
        new AppError(
          `Cannot delete Room ${room.roomNumber} — it has ${activeBookings} active booking(s). Please resolve all bookings first.`,
          400
        )
      );
    }

    // ── Soft delete — mark as inactive ───────────────────────
    // We never hard-delete rooms to preserve booking history
    room.isActive = false;
    room.status = 'maintenance';
    await room.save();

    // ── Log the deletion ──────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'DELETE',
        resource: 'Room',
        resourceId: room._id.toString(),
        description: `${req.user.name} deactivated Room ${room.roomNumber} — ${room.name}`,
        previousData: room.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Room ${room.roomNumber} has been deactivated successfully.`,
    });
  }
);
