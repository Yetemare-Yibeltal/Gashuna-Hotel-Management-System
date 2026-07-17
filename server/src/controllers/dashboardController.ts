import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Booking from '../models/Booking';
import Room from '../models/Room';
import Guest from '../models/Guest';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import Staff from '../models/Staff';
import HousekeepingTask from '../models/HousekeepingTask';
import MaintenanceRequest from '../models/MaintenanceRequest';
import InventoryItem from '../models/InventoryItem';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

export const getDashboardStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const endOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0,
      23,
      59,
      59
    );

    // ── Room Stats ────────────────────────────────────────────
    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      cleaningRooms,
      maintenanceRooms,
    ] = await Promise.all([
      Room.countDocuments({ isActive: true }),
      Room.countDocuments({ isActive: true, status: 'available' }),
      Room.countDocuments({ isActive: true, status: 'occupied' }),
      Room.countDocuments({ isActive: true, status: 'cleaning' }),
      Room.countDocuments({ isActive: true, status: 'maintenance' }),
    ]);

    const occupancyRate =
      totalRooms > 0
        ? Math.round((occupiedRooms / totalRooms) * 100 * 10) / 10
        : 0;

    // ── Booking Stats ─────────────────────────────────────────
    const [
      todayCheckIns,
      todayCheckOuts,
      pendingBookings,
      confirmedBookings,
      totalBookingsThisMonth,
    ] = await Promise.all([
      Booking.countDocuments({
        checkIn: { $gte: today, $lte: todayEnd },
        status: 'confirmed',
      }),
      Booking.countDocuments({
        checkOut: { $gte: today, $lte: todayEnd },
        status: 'checked_in',
      }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
    ]);

    // ── Revenue Stats ─────────────────────────────────────────
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    const lastMonthRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
        },
      },
    ]);

    const todayRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: today, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
        },
      },
    ]);

    const currentMonthRevenue = monthlyRevenue[0]?.total || 0;
    const previousMonthRevenue = lastMonthRevenue[0]?.total || 0;
    const todayRevenueTotal = todayRevenue[0]?.total || 0;

    const revenueGrowth =
      previousMonthRevenue > 0
        ? Math.round(
            ((currentMonthRevenue - previousMonthRevenue) /
              previousMonthRevenue) *
              100 *
              10
          ) / 10
        : 0;

    // ── Guest Stats ───────────────────────────────────────────
    const [totalGuests, newGuestsThisMonth, vipGuests] =
      await Promise.all([
        Guest.countDocuments(),
        Guest.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),
        Guest.countDocuments({ vip: true }),
      ]);

    // ── Staff Stats ───────────────────────────────────────────
    const [totalActiveStaff, staffOnLeave] = await Promise.all([
      Staff.countDocuments({ status: 'active' }),
      Staff.countDocuments({ status: 'on_leave' }),
    ]);

    // ── Housekeeping Stats ────────────────────────────────────
    const [pendingHousekeeping, inProgressHousekeeping] =
      await Promise.all([
        HousekeepingTask.countDocuments({ status: 'pending' }),
        HousekeepingTask.countDocuments({ status: 'in_progress' }),
      ]);

    // ── Maintenance Stats ─────────────────────────────────────
    const [openMaintenance, criticalMaintenance] = await Promise.all([
      MaintenanceRequest.countDocuments({
        status: { $in: ['open', 'assigned', 'in_progress'] },
      }),
      MaintenanceRequest.countDocuments({
        priority: 'critical',
        status: { $nin: ['resolved', 'closed', 'cancelled'] },
      }),
    ]);

    // ── Inventory Alerts ──────────────────────────────────────
    const allInventoryItems = await InventoryItem.find({
      isActive: true,
    }).select('quantity reorderLevel name category');

    const lowStockCount = allInventoryItems.filter(
      (item) => item.quantity <= item.reorderLevel
    ).length;

    const outOfStockCount = allInventoryItems.filter(
      (item) => item.quantity === 0
    ).length;

    // ── Recent Bookings ───────────────────────────────────────
    const recentBookings = await Booking.find()
      .populate('guest', 'fullName phone vip')
      .populate('room', 'name roomNumber type')
      .sort({ createdAt: -1 })
      .limit(5);

    // ── Today's Schedule ──────────────────────────────────────
    const [todayArrivals, todayDepartures] = await Promise.all([
      Booking.find({
        checkIn: { $gte: today, $lte: todayEnd },
        status: { $in: ['confirmed', 'checked_in'] },
      })
        .populate('guest', 'fullName phone vip')
        .populate('room', 'name roomNumber type')
        .sort({ checkIn: 1 }),
      Booking.find({
        checkOut: { $gte: today, $lte: todayEnd },
        status: 'checked_in',
      })
        .populate('guest', 'fullName phone vip')
        .populate('room', 'name roomNumber type')
        .sort({ checkOut: 1 }),
    ]);

    // ── Unread Notifications ──────────────────────────────────
    const unreadNotifications = await Notification.countDocuments({
      recipient: req.user?._id,
      isRead: false,
    });

    // ── Payment Method Breakdown This Month ───────────────────
    const paymentBreakdown = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // ── Weekly Revenue Trend ──────────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: sevenDaysAgo, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$paidAt' },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        rooms: {
          total: totalRooms,
          available: availableRooms,
          occupied: occupiedRooms,
          cleaning: cleaningRooms,
          maintenance: maintenanceRooms,
          occupancyRate,
        },
        bookings: {
          todayCheckIns,
          todayCheckOuts,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          thisMonth: totalBookingsThisMonth,
        },
        revenue: {
          today: todayRevenueTotal,
          thisMonth: currentMonthRevenue,
          lastMonth: previousMonthRevenue,
          growth: revenueGrowth,
          invoicesThisMonth: monthlyRevenue[0]?.count || 0,
          formattedToday: formatETB(todayRevenueTotal),
          formattedThisMonth: formatETB(currentMonthRevenue),
          formattedLastMonth: formatETB(previousMonthRevenue),
          paymentBreakdown,
          weeklyTrend: weeklyRevenue,
        },
        guests: {
          total: totalGuests,
          newThisMonth: newGuestsThisMonth,
          vip: vipGuests,
        },
        staff: {
          active: totalActiveStaff,
          onLeave: staffOnLeave,
        },
        housekeeping: {
          pending: pendingHousekeeping,
          inProgress: inProgressHousekeeping,
          total: pendingHousekeeping + inProgressHousekeeping,
        },
        maintenance: {
          open: openMaintenance,
          critical: criticalMaintenance,
        },
        inventory: {
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
        },
        notifications: {
          unread: unreadNotifications,
        },
        recentBookings,
        todaySchedule: {
          arrivals: todayArrivals,
          departures: todayDepartures,
        },
      },
    });
  }
);

export const getQuickStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      occupiedRooms,
      totalRooms,
      todayCheckIns,
      pendingBookings,
      unreadNotifications,
    ] = await Promise.all([
      Room.countDocuments({ isActive: true, status: 'occupied' }),
      Room.countDocuments({ isActive: true }),
      Booking.countDocuments({
        checkIn: { $gte: today, $lte: todayEnd },
        status: 'confirmed',
      }),
      Booking.countDocuments({ status: 'pending' }),
      Notification.countDocuments({
        recipient: req.user?._id,
        isRead: false,
      }),
    ]);

    const todayRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: today, $lte: todayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        occupancyRate:
          totalRooms > 0
            ? Math.round((occupiedRooms / totalRooms) * 100)
            : 0,
        occupiedRooms,
        totalRooms,
        todayCheckIns,
        pendingBookings,
        todayRevenue: todayRevenue[0]?.total || 0,
        formattedTodayRevenue: formatETB(
          todayRevenue[0]?.total || 0
        ),
        unreadNotifications,
      },
    });
  }
);
