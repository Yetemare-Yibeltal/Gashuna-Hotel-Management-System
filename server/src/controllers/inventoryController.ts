// server/src/controllers/inventoryController.ts
// ─────────────────────────────────────────────────────────────
// INVENTORY CONTROLLER — Gashuna Hotel Management System
//
// Handles all stock and inventory management:
//   GET    /api/inventory                  → all items with filters
//   GET    /api/inventory/low-stock        → low stock alerts
//   GET    /api/inventory/stats            → inventory statistics
//   GET    /api/inventory/:id              → single item detail
//   POST   /api/inventory                  → create new item
//   PUT    /api/inventory/:id              → update item details
//   PATCH  /api/inventory/:id/stock        → update stock quantity
//   DELETE /api/inventory/:id              → delete item
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import InventoryItem from '../models/InventoryItem';
import InventoryTransaction from '../models/InventoryTransaction';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

// ─────────────────────────────────────────────────────────────
// @desc    Get all inventory items with filters
// @route   GET /api/inventory
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getInventoryItems = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      category,
      lowStock,
      search,
      sortBy,
      order,
      page,
      limit,
    } = req.query;

    // ── Build filter ──────────────────────────────────────────
    const filter: Record<string, unknown> = {
      isActive: true,
    };

    if (category) filter.category = category;

    // Search by name or supplier
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
      ];
    }

    // ── Pagination ────────────────────────────────────────────
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // ── Sort ──────────────────────────────────────────────────
    const sortField = (sortBy as string) || 'name';
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: Record<string, number> = {
      [sortField]: sortOrder,
    };

    let items = await InventoryItem.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // ── Filter low stock items ────────────────────────────────
    if (lowStock === 'true') {
      items = items.filter(
        (item) => item.quantity <= item.reorderLevel
      );
    }

    const total = await InventoryItem.countDocuments(filter);

    // ── Calculate total inventory value ───────────────────────
    const valueAggregation = await InventoryItem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: { $multiply: ['$quantity', '$unitCost'] },
          },
        },
      },
    ]);

    const totalInventoryValue =
      valueAggregation[0]?.totalValue || 0;

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      totalInventoryValue,
      formattedTotalInventoryValue: formatETB(totalInventoryValue),
      items,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get low stock alerts
// @route   GET /api/inventory/low-stock
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getLowStockAlerts = asyncHandler(
  async (req: Request, res: Response) => {
    // Find all active items where quantity <= reorderLevel
    const allItems = await InventoryItem.find({
      isActive: true,
    }).sort({ category: 1, name: 1 });

    const lowStockItems = allItems.filter(
      (item) => item.quantity <= item.reorderLevel
    );

    // ── Group by category ─────────────────────────────────────
    const groupedAlerts: Record<string, typeof lowStockItems> = {};

    lowStockItems.forEach((item) => {
      if (!groupedAlerts[item.category]) {
        groupedAlerts[item.category] = [];
      }
      groupedAlerts[item.category].push(item);
    });

    // ── Count critical items (quantity is 0) ──────────────────
    const outOfStockItems = lowStockItems.filter(
      (item) => item.quantity === 0
    );

    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems,
      groupedByCategory: groupedAlerts,
      outOfStockItems,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getInventoryStats = asyncHandler(
  async (req: Request, res: Response) => {
    // ── Overall counts ────────────────────────────────────────
    const totalItems = await InventoryItem.countDocuments({
      isActive: true,
    });

    const allItems = await InventoryItem.find({ isActive: true });
    const lowStockCount = allItems.filter(
      (item) => item.quantity <= item.reorderLevel
    ).length;
    const outOfStockCount = allItems.filter(
      (item) => item.quantity === 0
    ).length;

    // ── Category breakdown ────────────────────────────────────
    const categoryStats = await InventoryItem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: {
            $sum: { $multiply: ['$quantity', '$unitCost'] },
          },
          avgUnitCost: { $avg: '$unitCost' },
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    // ── Total inventory value ─────────────────────────────────
    const totalValueAgg = await InventoryItem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: { $multiply: ['$quantity', '$unitCost'] },
          },
        },
      },
    ]);

    const totalInventoryValue = totalValueAgg[0]?.totalValue || 0;

    // ── Recent transactions ───────────────────────────────────
    const recentTransactions = await InventoryTransaction.find()
      .populate('inventoryItem', 'name category unit')
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalItems,
        lowStockCount,
        outOfStockCount,
        totalInventoryValue,
        formattedTotalInventoryValue: formatETB(
          totalInventoryValue
        ),
        categoryBreakdown: categoryStats,
        recentTransactions,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get single inventory item by ID
// @route   GET /api/inventory/:id
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getInventoryItemById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return next(
        new AppError(
          `No inventory item found with ID: ${req.params.id}`,
          404
        )
      );
    }

    // ── Get transaction history for this item ─────────────────
    const transactions = await InventoryTransaction.find({
      inventoryItem: req.params.id,
    })
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      item,
      transactions,
      totalValue: item.quantity * item.unitCost,
      formattedTotalValue: formatETB(item.quantity * item.unitCost),
      isLowStock: item.quantity <= item.reorderLevel,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Create a new inventory item
// @route   POST /api/inventory
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const createInventoryItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      name,
      category,
      unit,
      quantity,
      reorderLevel,
      unitCost,
      supplier,
      supplierPhone,
      location,
    } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (
      !name ||
      !category ||
      !unit ||
      quantity === undefined ||
      !unitCost
    ) {
      return next(
        new AppError(
          'Please provide name, category, unit, quantity, and unit cost.',
          400
        )
      );
    }

    // ── Validate category ─────────────────────────────────────
    const validCategories = [
      'kitchen',
      'housekeeping',
      'bar',
      'maintenance',
      'office',
      'amenities',
    ];

    if (!validCategories.includes(category)) {
      return next(
        new AppError(
          `Invalid category. Valid values: ${validCategories.join(', ')}.`,
          400
        )
      );
    }

    // ── Create item ───────────────────────────────────────────
    const item = await InventoryItem.create({
      name: name.trim(),
      category,
      unit: unit.trim(),
      quantity: Number(quantity),
      reorderLevel: reorderLevel || 5,
      unitCost: Number(unitCost),
      supplier: supplier?.trim(),
      supplierPhone: supplierPhone?.trim(),
      location: location?.trim(),
      lastRestocked: Number(quantity) > 0 ? new Date() : undefined,
      isActive: true,
    });

    // ── Create initial stock transaction if quantity > 0 ──────
    if (Number(quantity) > 0 && req.user) {
      await InventoryTransaction.create({
        inventoryItem: item._id,
        transactionType: 'stock_in',
        quantity: Number(quantity),
        quantityBefore: 0,
        quantityAfter: Number(quantity),
        unitCost: Number(unitCost),
        totalCost: Number(quantity) * Number(unitCost),
        supplier: supplier?.trim(),
        reason: 'Initial stock entry',
        performedBy: req.user._id,
      });
    }

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'Inventory',
        resourceId: item._id.toString(),
        description: `${req.user.name} added new inventory item: ${name} (${category}). Quantity: ${quantity} ${unit}. Unit cost: ${formatETB(Number(unitCost))}`,
        newData: item.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `Inventory item "${name}" created successfully. Stock: ${quantity} ${unit}.`,
      item,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update inventory item details
// @route   PUT /api/inventory/:id
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const updateInventoryItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return next(
        new AppError(
          `No inventory item found with ID: ${req.params.id}`,
          404
        )
      );
    }

    const previousData = item.toObject();

    const updatedItem = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // ── Audit log ─────────────────────────────────────────────
    if (req.user && updatedItem) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Inventory',
        resourceId: item._id.toString(),
        description: `${req.user.name} updated inventory item: ${item.name}`,
        previousData,
        newData: updatedItem.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Inventory item "${item.name}" updated successfully.`,
      item: updatedItem,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update stock quantity (stock in or stock out)
// @route   PATCH /api/inventory/:id/stock
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const updateStock = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      transactionType,
      quantity,
      reason,
      supplier,
      invoiceRef,
      department,
      unitCost,
    } = req.body;

    const validTypes = [
      'stock_in',
      'stock_out',
      'adjustment',
      'waste',
      'transfer',
    ];

    if (!transactionType || !validTypes.includes(transactionType)) {
      return next(
        new AppError(
          `Invalid transaction type. Valid values: ${validTypes.join(', ')}.`,
          400
        )
      );
    }

    if (!quantity || Number(quantity) <= 0) {
      return next(
        new AppError('Quantity must be greater than 0.', 400)
      );
    }

    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return next(
        new AppError(
          `No inventory item found with ID: ${req.params.id}`,
          404
        )
      );
    }

    const quantityBefore = item.quantity;
    let quantityAfter = quantityBefore;

    // ── Calculate new quantity based on transaction type ──────
    if (
      transactionType === 'stock_in' ||
      (transactionType === 'adjustment' &&
        Number(quantity) > quantityBefore)
    ) {
      quantityAfter = quantityBefore + Number(quantity);
      item.lastRestocked = new Date();
    } else if (
      transactionType === 'stock_out' ||
      transactionType === 'waste' ||
      transactionType === 'transfer'
    ) {
      if (Number(quantity) > quantityBefore) {
        return next(
          new AppError(
            `Cannot remove ${quantity} ${item.unit} — only ${quantityBefore} ${item.unit} available in stock.`,
            400
          )
        );
      }
      quantityAfter = quantityBefore - Number(quantity);
    } else if (transactionType === 'adjustment') {
      quantityAfter = Number(quantity);
    }

    // ── Update item quantity ──────────────────────────────────
    item.quantity = quantityAfter;
    await item.save();

    // ── Create transaction record ─────────────────────────────
    const costPerUnit = unitCost || item.unitCost;
    const totalCost = Number(quantity) * costPerUnit;

    await InventoryTransaction.create({
      inventoryItem: item._id,
      transactionType,
      quantity: Number(quantity),
      quantityBefore,
      quantityAfter,
      unitCost: costPerUnit,
      totalCost,
      department: department?.trim(),
      reason: reason?.trim(),
      supplier: supplier?.trim(),
      invoiceRef: invoiceRef?.trim(),
      performedBy: req.user?._id,
    });

    // ── Check for low stock and send alert ────────────────────
    if (
      quantityAfter <= item.reorderLevel &&
      quantityBefore > item.reorderLevel
    ) {
      // Stock just dropped below reorder level — send alert
      const { default: User } = await import('../models/User');
      const adminUser = await User.findOne({
        role: { $in: ['admin', 'manager'] },
      });

      if (adminUser) {
        await Notification.createNotification({
          recipient: adminUser._id,
          type: 'warning',
          event: 'LOW_STOCK',
          title: `Low Stock Alert — ${item.name}`,
          message: `${item.name} (${item.category}) is running low. Current stock: ${quantityAfter} ${item.unit}. Reorder level: ${item.reorderLevel} ${item.unit}. Please reorder from ${item.supplier || 'your supplier'}.`,
          link: `/admin/inventory`,
        });
      }
    }

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Inventory',
        resourceId: item._id.toString(),
        description: `${req.user.name} recorded ${transactionType} for ${item.name}: ${quantityBefore} → ${quantityAfter} ${item.unit}. Reason: ${reason || 'Not specified'}`,
        previousData: { quantity: quantityBefore },
        newData: { quantity: quantityAfter },
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Stock updated for "${item.name}". ${quantityBefore} → ${quantityAfter} ${item.unit}.${quantityAfter <= item.reorderLevel ? ' ⚠️ LOW STOCK ALERT sent.' : ''}`,
      item,
      transaction: {
        type: transactionType,
        quantity: Number(quantity),
        quantityBefore,
        quantityAfter,
        totalCost: formatETB(totalCost),
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Delete (deactivate) an inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const deleteInventoryItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return next(
        new AppError(
          `No inventory item found with ID: ${req.params.id}`,
          404
        )
      );
    }

    // Soft delete — mark as inactive
    item.isActive = false;
    await item.save();

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'DELETE',
        resource: 'Inventory',
        resourceId: item._id.toString(),
        description: `${req.user.name} deactivated inventory item: ${item.name} (${item.category})`,
        previousData: item.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Inventory item "${item.name}" deactivated successfully.`,
    });
  }
);
