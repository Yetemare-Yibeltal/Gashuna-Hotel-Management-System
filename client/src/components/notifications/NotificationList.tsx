import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

interface NotificationListProps {
  onClose: () => void;
}

export default function NotificationList({ onClose }: NotificationListProps) {
  const { notifications, unreadCount, markAllRead, clearRead, isLoading } = useNotifications();

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
            >
              Mark all read
            </button>
          )}
          {notifications.some((n: any) => n.isRead) && (
            <button
              onClick={() => clearRead()}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Clear read
            </button>
          )}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/30">No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 12).map((n: any) => (
            <NotificationItem key={n._id} notification={n} onClose={onClose} />
          ))
        )}
      </div>
    </div>
  );
}
