import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, LogOut, User, Settings, ChevronDown,
  Menu, Sun, Moon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useUIStore } from '../../store/uiStore';
import { classNames, timeAgo } from '../../lib/utils';
import Badge from '../ui/Badge';

export default function AdminTopbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { setSidebarOpen, sidebarOpen } = useUIStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-64">
          <Search className="w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything..."
            className="bg-transparent text-sm text-white placeholder-white/30 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="relative p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <Badge variant="gold">{unreadCount} new</Badge>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-white/30 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => {
                        markRead(n._id);
                        if (n.link) { navigate(n.link); setShowNotifications(false); }
                      }}
                      className={classNames(
                        'px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors',
                        !n.isRead && 'bg-amber-500/5'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={classNames(
                          'w-2 h-2 rounded-full mt-1.5 shrink-0',
                          n.type === 'success' ? 'bg-emerald-400' :
                          n.type === 'warning' ? 'bg-amber-400' :
                          n.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{n.title}</p>
                          <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-white/30 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-white/10">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors w-full text-center"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-amber-600/20 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-500">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white/30 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-white/40">{user?.email}</p>
                <Badge variant="gold" size="sm" className="mt-1.5 capitalize">
                  {user?.role}
                </Badge>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/admin/settings'); setShowProfile(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => { logout(); setShowProfile(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => { setShowNotifications(false); setShowProfile(false); }}
        />
      )}
    </header>
  );
}
