// server/src/controllers/menuController.ts
// ─────────────────────────────────────────────────────────────
// MENU CONTROLLER — Gashuna Hotel Management System
//
// Handles all restaurant menu operations:
//   GET    /api/menu                  → all menu items with filters
//   GET    /api/menu/stats            → menu statistics
//   GET    /api/menu/:id              → single menu item
//   POST   /api/menu                  → create new menu item
//   PUT    /api/menu/:id              → update menu item
//   PATCH  /api/menu/:id/availability → toggle availability
//   PATCH  /api/menu/:id/popular      → toggle popular flag
//   DELETE /api/menu/:id              → delete menu item
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import MenuItem from '../models/MenuItem';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

// ─────────────────────────────────────────────────────────────
// @desc    Get all menu items with optional filters
// @route   GET /api/menu
// @access  Public
// ─────────────────────────────────────────────────────────────
export const getMenuItems = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      category,
      available,
      isVeg,
      isSpicy,
      popular,
      search,
      sortBy,
      order,
    } = req.query;

    // ── Build filter ──────────────────────────────────────────
    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;

    // Default: only show available items to public
    if (available === 'false') {
      filter.available = false;
    } else if (available === 'all') {
      // Admin can pass 'all' to see all items
    } else {
      filter.available = true;
    }

    if (isVeg === 'true') filter.isVeg = true;
    if (isSpicy === 'true') filter.isSpicy = true;
    if (popular === 'true') filter.popular = true;

    // Search by name or Amharic name
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameAmharic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // ── Sort ──────────────────────────────────────────────────
    const sortField = (sortBy as string) || 'popular';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: Record<string, number> = {
      [sortField]: sortOrder,
      name: 1,
    };

    const menuItems = await MenuItem.find(filter).sort(sortObj);

    // ── Group by category for better frontend display ─────────
    const categories = [
      'breakfast',
      'mains',
      'drinks',
      'appetizers',
      'desserts',
    ];

    const groupedByCategory: Record<string, typeof menuItems> = {};

    categories.forEach((cat) => {
      groupedByCategory[cat] = menuItems.filter(
        (item) => item.category === cat
      );
    });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems,
      groupedByCategory,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get menu statistics for admin dashboard
// @route   GET /api/menu/stats
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getMenuStats = asyncHandler(
  async (req: Request, res: Response) => {
    const [
      totalItems,
      availableItems,
      unavailableItems,
      popularItems,
      vegItems,
    ] = await Promise.all([
      MenuItem.countDocuments(),
      MenuItem.countDocuments({ available: true }),
      MenuItem.countDocuments({ available: false }),
      MenuItem.countDocuments({ popular: true }),
      MenuItem.countDocuments({ isVeg: true }),
    ]);

    // Items by category
    const categoryStats = await MenuItem.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          availableCount: {
            $sum: { $cond: ['$available', 1, 0] },
          },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Most expensive items
    const topPricedItems = await MenuItem.find({ available: true })
      .sort({ price: -1 })
      .limit(5)
      .select('name nameAmharic category price');

    res.status(200).json({
      success: true,
      stats: {
        totalItems,
        availableItems,
        unavailableItems,
        popularItems,
        vegItems,
        categoryBreakdown: categoryStats,
        topPricedItems,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get single menu item by ID
// @route   GET /api/menu/:id
// @access  Public
// ─────────────────────────────────────────────────────────────
export const getMenuItemById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return next(
        new AppError(
          `No menu item found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      menuItem,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Create a new menu item
// @route   POST /api/menu
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const createMenuItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      name,
      nameAmharic,
      category,
      description,
      price,
      isVeg,
      isSpicy,
      popular,
      preparationTime,
    } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!name || !category || !description || !price) {
      return next(
        new AppError(
          'Please provide name, category, description, and price.',
          400
        )
      );
    }

    // ── Validate category ─────────────────────────────────────
    const validCategories = [
      'breakfast',
      'mains',
      'drinks',
      'appetizers',
      'desserts',
    ];

    if (!validCategories.includes(category)) {
      return next(
        new AppError(
          `Invalid category. Valid values: ${validCategories.join(', ')}.`,
          400
        )
      );
    }

    // ── Validate price ────────────────────────────────────────
    if (Number(price) < 0) {
      return next(
        new AppError('Price cannot be negative.', 400)
      );
    }

    // ── Create menu item ──────────────────────────────────────
    const menuItem = await MenuItem.create({
      name: name.trim(),
      nameAmharic: nameAmharic?.trim() || '',
      category,
      description: description.trim(),
      price: Number(price),
      isVeg: isVeg || false,
      isSpicy: isSpicy || false,
      popular: popular || false,
      available: true,
      preparationTime: preparationTime || 20,
    });

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'Inventory',
        resourceId: menuItem._id.toString(),
        description: `${req.user.name} added new menu item: ${name} (${category}) — ${formatETB(Number(price))}`,
        newData: menuItem.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `Menu item "${name}" created successfully. Price: ${formatETB(Number(price))}`,
      menuItem,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update a menu item
// @route   PUT /api/menu/:id
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const updateMenuItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return next(
        new AppError(
          `No menu item found with ID: ${req.params.id}`,
          404
        )
      );
    }

    const previousData = menuItem.toObject();

    // ── Validate price if provided ────────────────────────────
    if (req.body.price !== undefined && Number(req.body.price) < 0) {
      return next(
        new AppError('Price cannot be negative.', 400)
      );
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // ── Audit log ─────────────────────────────────────────────
    if (req.user && updatedMenuItem) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Inventory',
        resourceId: menuItem._id.toString(),
        description: `${req.user.name} updated menu item: ${menuItem.name}`,
        previousData,
        newData: updatedMenuItem.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Menu item "${menuItem.name}" updated successfully.`,
      menuItem: updatedMenuItem,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Toggle menu item availability
// @route   PATCH /api/menu/:id/availability
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const toggleAvailability = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return next(
        new AppError(
          `No menu item found with ID: ${req.params.id}`,
          404
        )
      );
    }

    const previousAvailability = menuItem.available;
    menuItem.available = !menuItem.available;
    await menuItem.save();

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Inventory',
        resourceId: menuItem._id.toString(),
        description: `${req.user.name} ${menuItem.available ? 'enabled' : 'disabled'} menu item: ${menuItem.name}`,
        previousData: { available: previousAvailability },
        newData: { available: menuItem.available },
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `"${menuItem.name}" is now ${menuItem.available ? 'available' : 'unavailable'} on the menu.`,
      menuItem,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Toggle popular flag on a menu item
// @route   PATCH /api/menu/:id/popular
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const togglePopular = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return next(
        new AppError(
          `No menu item found with ID: ${req.params.id}`,
          404
        )
      );
    }

    menuItem.popular = !menuItem.popular;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: `"${menuItem.name}" has been ${menuItem.popular ? 'marked as popular ⭐' : 'removed from popular'}.`,
      menuItem,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const deleteMenuItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return next(
        new AppError(
          `No menu item found with ID: ${req.params.id}`,
          404
        )
      );
    }

    // ── Audit log before deletion ─────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'DELETE',
        resource: 'Inventory',
        resourceId: menuItem._id.toString(),
        description: `${req.user.name} deleted menu item: ${menuItem.name} (${menuItem.category}) — ${formatETB(menuItem.price)}`,
        previousData: menuItem.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    await menuItem.deleteOne();

    res.status(200).json({
      success: true,
      message: `Menu item "${menuItem.name}" deleted successfully.`,
    });
  }
);
