import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import InventoryTransaction from '../models/InventoryTransaction';
import InventoryItem from '../models/InventoryItem';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

export const getInventoryTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      itemId,
      transactionType,
      department,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (itemId) filter.inventoryItem = itemId;
    if (transactionType) filter.transactionType = transactionType;
    if (department) filter.department = department;

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      filter.createdAt = dateFilter;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      InventoryTransaction.find(filter)
        .populate('inventoryItem', 'name category unit unitCost')
        .populate('performedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      InventoryTransaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      transactions,
    });
  }
);

export const getTransactionStats = asyncHandler(
  async (req: Request, res: Response) => {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const typeStats = await InventoryTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: '$transactionType',
          count: { $sum: 1 },
          totalCost: { $sum: '$totalCost' },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const departmentUsage = await InventoryTransaction.aggregate([
      {
        $match: {
          transactionType: 'stock_out',
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          totalCost: { $sum: '$totalCost' },
        },
      },
      { $sort: { totalCost: -1 } },
    ]);

    const totalSpentThisMonth = await InventoryTransaction.aggregate([
      {
        $match: {
          transactionType: 'stock_in',
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalCost' },
        },
      },
    ]);

    const totalSpent = totalSpentThisMonth[0]?.total || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalSpentThisMonth: totalSpent,
        formattedTotalSpent: formatETB(totalSpent),
        typeBreakdown: typeStats,
        departmentUsage,
      },
    });
  }
);

export const getTransactionById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const transaction = await InventoryTransaction.findById(
      req.params.id
    )
      .populate('inventoryItem', 'name category unit unitCost')
      .populate('performedBy', 'name role email');

    if (!transaction) {
      return next(
        new AppError(
          `No transaction found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  }
);

export const getItemTransactionHistory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const item = await InventoryItem.findById(req.params.itemId);

    if (!item) {
      return next(
        new AppError(
          `No inventory item found with ID: ${req.params.itemId}`,
          404
        )
      );
    }

    const transactions = await InventoryTransaction.find({
      inventoryItem: req.params.itemId,
    })
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 });

    const summary = {
      totalStockIn: transactions
        .filter((t) => t.transactionType === 'stock_in')
        .reduce((sum, t) => sum + t.quantity, 0),
      totalStockOut: transactions
        .filter((t) => t.transactionType === 'stock_out')
        .reduce((sum, t) => sum + t.quantity, 0),
      totalWaste: transactions
        .filter((t) => t.transactionType === 'waste')
        .reduce((sum, t) => sum + t.quantity, 0),
      totalSpent: transactions
        .filter((t) => t.transactionType === 'stock_in')
        .reduce((sum, t) => sum + (t.totalCost || 0), 0),
    };

    res.status(200).json({
      success: true,
      item: {
        _id: item._id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentQuantity: item.quantity,
        reorderLevel: item.reorderLevel,
      },
      summary: {
        ...summary,
        formattedTotalSpent: formatETB(summary.totalSpent),
      },
      count: transactions.length,
      transactions,
    });
  }
);

export const createTransaction = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      inventoryItemId,
      transactionType,
      quantity,
      reason,
      supplier,
      invoiceRef,
      department,
      unitCost,
    } = req.body;

    if (!inventoryItemId || !transactionType || !quantity) {
      return next(
        new AppError(
          'Please provide inventory item ID, transaction type, and quantity.',
          400
        )
      );
    }

    const item = await InventoryItem.findById(inventoryItemId);
    if (!item) {
      return next(new AppError('Inventory item not found.', 404));
    }

    const validTypes = [
      'stock_in',
      'stock_out',
      'adjustment',
      'waste',
      'transfer',
    ];

    if (!validTypes.includes(transactionType)) {
      return next(
        new AppError(
          `Invalid transaction type. Valid values: ${validTypes.join(', ')}.`,
          400
        )
      );
    }

    const quantityBefore = item.quantity;
    let quantityAfter = quantityBefore;

    if (transactionType === 'stock_in') {
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
            `Cannot remove ${quantity} ${item.unit} — only ${quantityBefore} available.`,
            400
          )
        );
      }
      quantityAfter = quantityBefore - Number(quantity);
    } else if (transactionType === 'adjustment') {
      quantityAfter = Number(quantity);
    }

    item.quantity = quantityAfter;
    await item.save();

    const costPerUnit = unitCost || item.unitCost;
    const totalCost = Number(quantity) * costPerUnit;

    const transaction = await InventoryTransaction.create({
      inventoryItem: inventoryItemId,
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

    await transaction.populate('inventoryItem', 'name category unit');
    await transaction.populate('performedBy', 'name role');

    res.status(201).json({
      success: true,
      message: `${transactionType.replace('_', ' ')} recorded for "${item.name}". ${quantityBefore} → ${quantityAfter} ${item.unit}.`,
      transaction,
      itemCurrentQuantity: quantityAfter,
    });
  }
);
