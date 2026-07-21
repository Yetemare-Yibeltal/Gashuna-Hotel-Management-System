import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db';

import User from '../models/User';
import Room from '../models/Room';
import RoomType from '../models/RoomType';
import MenuItem from '../models/MenuItem';
import Staff from '../models/Staff';
import Service from '../models/Service';
import InventoryItem from '../models/InventoryItem';
import InventoryTransaction from '../models/InventoryTransaction';

import usersData from './data/users.json';
import roomTypesData from './data/roomTypes.json';
import roomsData from './data/rooms.json';
import menuData from './data/menu.json';
import staffData from './data/staff.json';
import servicesData from './data/services.json';
import inventoryData from './data/inventory.json';

const seedDatabase = async (): Promise<void> => {
  try {
    await connectDB();

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🌱  GASHUNA HOTEL — DATABASE SEEDER');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    // ── Ask for confirmation ──────────────────────────────────
    const args = process.argv.slice(2);
    const forceFlag = args.includes('--force');

    if (!forceFlag) {
      const existingUsers = await User.countDocuments();
      if (existingUsers > 0) {
        console.log('⚠️  Database already has data.');
        console.log(
          '   Run with --force flag to overwrite: npm run seed -- --force'
        );
        console.log('');
        process.exit(0);
      }
    }

    // ── Clear existing data ───────────────────────────────────
    console.log('🗑️  Clearing existing data...');

    await Promise.all([
      User.deleteMany({}),
      Room.deleteMany({}),
      RoomType.deleteMany({}),
      MenuItem.deleteMany({}),
      Staff.deleteMany({}),
      Service.deleteMany({}),
      InventoryItem.deleteMany({}),
      InventoryTransaction.deleteMany({}),
    ]);

    console.log('✅ Existing data cleared.');
    console.log('');

    // ── Seed Users ────────────────────────────────────────────
    console.log('👤 Seeding admin users...');

    const createdUsers = [];
    for (const userData of usersData) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });
      createdUsers.push(user);
      console.log(
        `   ✅ Created user: ${user.name} (${user.role}) — ${user.email}`
      );
    }
    console.log(`✅ ${createdUsers.length} users seeded.`);
    console.log('');

    // ── Seed Room Types ───────────────────────────────────────
    console.log('🏨 Seeding room types...');

    const createdRoomTypes = await RoomType.insertMany(roomTypesData);
    createdRoomTypes.forEach((rt) => {
      console.log(
        `   ✅ Room type: ${rt.name} — ETB ${rt.minPrice.toLocaleString()} to ETB ${rt.maxPrice.toLocaleString()}`
      );
    });
    console.log(`✅ ${createdRoomTypes.length} room types seeded.`);
    console.log('');

    // ── Seed Rooms ────────────────────────────────────────────
    console.log('🛏️  Seeding rooms...');

    const createdRooms = await Room.insertMany(roomsData);
    createdRooms.forEach((room) => {
      console.log(
        `   ✅ Room ${room.roomNumber}: ${room.name} — ETB ${room.price.toLocaleString()}/night`
      );
    });
    console.log(`✅ ${createdRooms.length} rooms seeded.`);
    console.log('');

    // ── Seed Menu Items ───────────────────────────────────────
    console.log('🍽️  Seeding restaurant menu...');

    const createdMenuItems = await MenuItem.insertMany(menuData);
    const menuByCategory: Record<string, number> = {};
    createdMenuItems.forEach((item) => {
      menuByCategory[item.category] =
        (menuByCategory[item.category] || 0) + 1;
    });

    Object.entries(menuByCategory).forEach(([category, count]) => {
      console.log(`   ✅ ${category}: ${count} items`);
    });
    console.log(`✅ ${createdMenuItems.length} menu items seeded.`);
    console.log('');

    // ── Seed Staff ────────────────────────────────────────────
    console.log('👥 Seeding staff records...');

    const createdStaff = await Staff.insertMany(
      staffData.map((s) => ({
        ...s,
        hireDate: new Date(s.hireDate),
      }))
    );

    const staffByDept: Record<string, number> = {};
    createdStaff.forEach((staff) => {
      staffByDept[staff.department] =
        (staffByDept[staff.department] || 0) + 1;
    });

    Object.entries(staffByDept).forEach(([dept, count]) => {
      console.log(`   ✅ ${dept}: ${count} staff`);
    });
    console.log(`✅ ${createdStaff.length} staff members seeded.`);
    console.log('');

    // ── Seed Services ─────────────────────────────────────────
    console.log('🛎️  Seeding hotel services...');

    const createdServices = await Service.insertMany(servicesData);
    createdServices.forEach((service) => {
      const priceStr =
        service.price === 0
          ? 'Free'
          : `ETB ${service.price.toLocaleString()} ${service.unit}`;
      console.log(`   ✅ ${service.name} — ${priceStr}`);
    });
    console.log(`✅ ${createdServices.length} services seeded.`);
    console.log('');

    // ── Seed Inventory ────────────────────────────────────────
    console.log('📦 Seeding inventory items...');

    const adminUser = createdUsers.find((u) => u.role === 'admin');
    const createdItems = await InventoryItem.insertMany(inventoryData);

    // Create initial stock_in transactions for all items
    const transactions = createdItems.map((item) => ({
      inventoryItem: item._id,
      transactionType: 'stock_in',
      quantity: item.quantity,
      quantityBefore: 0,
      quantityAfter: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.quantity * item.unitCost,
      reason: 'Initial stock entry — database seed',
      supplier: item.supplier,
      performedBy: adminUser?._id,
    }));

    await InventoryTransaction.insertMany(transactions);

    const inventoryByCategory: Record<string, number> = {};
    createdItems.forEach((item) => {
      inventoryByCategory[item.category] =
        (inventoryByCategory[item.category] || 0) + 1;
    });

    Object.entries(inventoryByCategory).forEach(([category, count]) => {
      console.log(`   ✅ ${category}: ${count} items`);
    });

    const totalInventoryValue = createdItems.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );

    console.log(`✅ ${createdItems.length} inventory items seeded.`);
    console.log(
      `✅ Total inventory value: ETB ${totalInventoryValue.toLocaleString()}`
    );
    console.log('');

    // ── Summary ───────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════');
    console.log('  ✅  DATABASE SEEDING COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('  📊 Summary:');
    console.log(`     👤 Users:          ${createdUsers.length}`);
    console.log(`     🏨 Room Types:     ${createdRoomTypes.length}`);
    console.log(`     🛏️  Rooms:          ${createdRooms.length}`);
    console.log(`     🍽️  Menu Items:     ${createdMenuItems.length}`);
    console.log(`     👥 Staff:          ${createdStaff.length}`);
    console.log(`     🛎️  Services:       ${createdServices.length}`);
    console.log(`     📦 Inventory:      ${createdItems.length}`);
    console.log('');
    console.log('  🔑 Login Credentials:');
    console.log('     Admin:       admin@gashuna.com / Gashuna@2025');
    console.log('     Manager:     manager@gashuna.com / Gashuna@2025');
    console.log('     Receptionist: reception@gashuna.com / Gashuna@2025');
    console.log('');
    console.log('  🌐 Start the server: npm run dev');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ SEEDING FAILED:', error);
    console.error('');
    process.exit(1);
  }
};

seedDatabase();
