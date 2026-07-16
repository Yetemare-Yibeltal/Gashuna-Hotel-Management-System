import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import FoodOrder from '../models/FoodOrder';
import MenuItem from '../models/MenuItem';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

export const getFoodOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      status,
      orderType,
      guestId,
      bookingId,
      page,
      limit,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (guestId) filter.guest = guestId;
    if (bookingId) filter.booking = bookingId;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      FoodOrder.find(filter)
        .populate('guest', 'fullName phone vip')
        .populate('booking', 'bookingRef checkIn checkOut')
        .populate('servedBy', 'name role')
        .populate('items.menuItem', 'name category image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      FoodOrder.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      orders,
    });
  }
);

export const getActiveOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const orders = await FoodOrder.find({
      status: { $in: ['pending', 'preparing', 'ready'] },
    })
      .populate('guest', 'fullName phone vip')
      .populate('items.menuItem', 'name category preparationTime')
      .sort({ orderedAt: 1 });

    const summary = {
      pending: orders.filter((o) => o.status === 'pending').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      total: orders.length,
    };

    res.status(200).json({
      success: true,
      summary,
      orders,
    });
  }
);

export const getFoodOrderStats = asyncHandler(
  async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayOrders, totalOrders] = await Promise.all([
      FoodOrder.countDocuments({
        createdAt: { $gte: today, $lte: todayEnd },
      }),
      FoodOrder.countDocuments(),
    ]);

    const revenueStats = await FoodOrder.aggregate([
      { $match: { status: 'delivered', isPaid: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    const todayRevenue = await FoodOrder.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: today, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
        },
      },
    ]);

    const popularItems = await FoodOrder.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          totalOrdered: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'itemInfo',
        },
      },
      { $unwind: '$itemInfo' },
      {
        $project: {
          name: '$itemInfo.name',
          category: '$itemInfo.category',
          totalOrdered: 1,
          totalRevenue: 1,
        },
      },
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const todayRevenueTotal = todayRevenue[0]?.total || 0;

    res.status(200).json({
      success: true,
      stats: {
        todayOrders,
        totalOrders,
        totalRevenue,
        todayRevenue: todayRevenueTotal,
        formattedTotalRevenue: formatETB(totalRevenue),
        formattedTodayRevenue: formatETB(todayRevenueTotal),
        popularItems,
      },
    });
  }
);

export const getFoodOrderById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const order = await FoodOrder.findById(req.params.id)
      .populate('guest', 'fullName phone email vip')
      .populate('booking', 'bookingRef checkIn checkOut')
      .populate('servedBy', 'name role')
      .populate('items.menuItem', 'name nameAmharic category price image preparationTime');

    if (!order) {
      return next(
        new AppError(
          `No food order found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      order,
    });
  }
);

export const createFoodOrder = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      guestId,
      bookingId,
      roomNumber,
      tableNumber,
      orderType,
      items,
      notes,
    } = req.body;

    if (!orderType || !items || items.length === 0) {
      return next(
        new AppError(
          'Please provide order type and at least one item.',
          400
        )
      );
    }

    if (orderType === 'room_service' && !roomNumber) {
      return next(
        new AppError(
          'Room number is required for room service orders.',
          400
        )
      );
    }

    if (orderType === 'restaurant' && !tableNumber) {
      return next(
        new AppError(
          'Table number is required for restaurant orders.',
          400
        )
      );
    }

    const orderItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      if (!item.menuItemId || !item.quantity) {
        return next(
          new AppError(
            'Each item must have a menu item ID and quantity.',
            400
          )
        );
      }

      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return next(
          new AppError(
            `Menu item not found: ${item.menuItemId}`,
            404
          )
        );
      }

      if (!menuItem.available) {
        return next(
          new AppError(
            `"${menuItem.name}" is currently not available.`,
            400
          )
        );
      }

      const itemTotal = menuItem.price * item.quantity;
      calculatedTotal += itemTotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        total: itemTotal,
        specialInstructions: item.specialInstructions?.trim() || undefined,
      });
    }

    const orderNumber = generateOrderNumber();

    const order = await FoodOrder.create({
      orderNumber,
      guest: guestId || undefined,
      booking: bookingId || undefined,
      roomNumber: roomNumber?.trim() || undefined,
      tableNumber: tableNumber?.trim() || undefined,
      orderType,
      items: orderItems,
      subtotal: calculatedTotal,
      total: calculatedTotal,
      status: 'pending',
      orderedAt: new Date(),
      notes: notes?.trim() || undefined,
      isPaid: false,
    });

    await order.populate('items.menuItem', 'name category image');

    const { default: User } = await import('../models/User');
    const manager = await User.findOne({
      role: { $in: ['admin', 'manager'] },
    });

    if (manager) {
      await Notification.createNotification({
        recipient: manager._id,
        type: 'info',
        event: 'GENERAL',
        title: `New ${orderType === 'room_service' ? 'Room Service' : 'Restaurant'} Order — ${orderNumber}`,
        message: `${orderItems.length} item(s) ordered. Total: ${formatETB(calculatedTotal)}. ${orderType === 'room_service' ? `Room: ${roomNumber}` : `Table: ${tableNumber}`}`,
        link: '/admin/food-orders',
      });
    }

    res.status(201).json({
      success: true,
      message: `Order ${orderNumber} placed successfully. Total: ${formatETB(calculatedTotal)}`,
      order,
    });
  }
);

export const updateOrderStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status } = req.body;

    const validStatuses = [
      'pending',
      'preparing',
      'ready',
      'delivered',
      'cancelled',
    ];

    if (!status || !validStatuses.includes(status)) {
      return next(
        new AppError(
          `Invalid status. Valid values: ${validStatuses.join(', ')}.`,
          400
        )
      );
    }

    const order = await FoodOrder.findById(req.params.id);

    if (!order) {
      return next(
        new AppError(
          `No food order found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return next(
        new AppError(
          `Cannot update a ${order.status} order.`,
          400
        )
      );
    }

    const previousStatus = order.status;
    order.status = status;

    if (status === 'preparing' && !order.preparedAt) {
      order.preparedAt = new Date();
    }

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.servedBy = req.user?._id;
    }

    await order.save();

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Inventory',
        resourceId: order._id.toString(),
        description: `${req.user.name} updated order ${order.orderNumber} status: '${previousStatus}' → '${status}'`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} status updated to '${status}'.`,
      order,
    });
  }
);

export const markOrderPaid = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const order = await FoodOrder.findById(req.params.id);

    if (!order) {
      return next(
        new AppError(
          `No food order found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (order.isPaid) {
      return next(
        new AppError('This order has already been paid.', 400)
      );
    }

    if (order.status !== 'delivered') {
      return next(
        new AppError(
          'Order must be delivered before marking as paid.',
          400
        )
      );
    }

    order.isPaid = true;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} marked as paid. Amount: ${formatETB(order.total)}`,
      order,
    });
  }
);
