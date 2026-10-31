import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { timeAgo, classNames } from '../../lib/utils';
import type { Notification } from '../../store/notificationStore';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const typeColors: Record<string, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  info: 'bg-blue-400',
};

export default function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const navigate = useNavigate();
  const { markRead } = useNotifications();

  const handleClick = () => {
    if (!notification.isRead) markRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={classNames(
        'flex items-start gap-3 px-4 py-3.5 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5',
        !notification.isRead && 'bg-amber-500/5'
      )}
    >
      <div
        className={classNames(
          'w-2 h-2 rounded-full mt-1.5 shrink-0',
          typeColors[notification.type] || 'bg-white/40'
        )}
      />
      <div className="flex-1 min-w-0">
        <p
          className={classNames(
            'text-sm font-medium truncate',
            notification.isRead ? 'text-white/60' : 'text-white'
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-white/40 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[10px] text-white/25 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.isRead && (
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
      )}
    </div>
  );
}
