import cron from 'node-cron';
import InventoryItem from '../models/InventoryItem';
import Notification from '../models/Notification';
import User from '../models/User';

export const startInventoryAlertJob = (): void => {
  // Run every day at 8:00 AM Ethiopia time (5:00 AM UTC)
  cron.schedule('0 5 * * *', async () => {
    console.log('📦 Running inventory alert job...');

    try {
      const allItems = await InventoryItem.find({ isActive: true });

      const lowStockItems = allItems.filter(
        (item) => item.quantity <= item.reorderLevel && item.quantity > 0
      );

      const outOfStockItems = allItems.filter(
        (item) => item.quantity === 0
      );

      if (lowStockItems.length === 0 && outOfStockItems.length === 0) {
        console.log('✅ All inventory items are sufficiently stocked.');
        return;
      }

      const adminUsers = await User.find({
        role: { $in: ['admin', 'manager'] },
        isActive: true,
      });

      for (const adminUser of adminUsers) {
        if (outOfStockItems.length > 0) {
          const itemNames = outOfStockItems
            .slice(0, 5)
            .map((i) => i.name)
            .join(', ');

          await Notification.createNotification({
            recipient: adminUser._id,
            type: 'error',
            event: 'LOW_STOCK',
            title: `🚨 Out of Stock — ${outOfStockItems.length} item(s)`,
            message: `The following items are completely out of stock: ${itemNames}${outOfStockItems.length > 5 ? ` and ${outOfStockItems.length - 5} more` : ''}. Please reorder immediately.`,
            link: '/admin/inventory',
          });
        }

        if (lowStockItems.length > 0) {
          const itemNames = lowStockItems
            .slice(0, 5)
            .map((i) => `${i.name} (${i.quantity} ${i.unit} left)`)
            .join(', ');

          await Notification.createNotification({
            recipient: adminUser._id,
            type: 'warning',
            event: 'LOW_STOCK',
            title: `⚠️ Low Stock Alert — ${lowStockItems.length} item(s)`,
            message: `Low stock detected: ${itemNames}${lowStockItems.length > 5 ? ` and ${lowStockItems.length - 5} more items` : ''}. Please reorder soon.`,
            link: '/admin/inventory',
          });
        }
      }

      // ── Group by category for detailed logging ─────────────
      const categoryBreakdown: Record<string, number> = {};
      [...lowStockItems, ...outOfStockItems].forEach((item) => {
        categoryBreakdown[item.category] =
          (categoryBreakdown[item.category] || 0) + 1;
      });

      console.log(
        `✅ Inventory alert job completed. Low stock: ${lowStockItems.length}, Out of stock: ${outOfStockItems.length}`
      );
      console.log('Category breakdown:', categoryBreakdown);
    } catch (error) {
      console.error('❌ Inventory alert job failed:', error);
    }
  });

  console.log('✅ Inventory alert job scheduled — runs daily at 8:00 AM');
};
