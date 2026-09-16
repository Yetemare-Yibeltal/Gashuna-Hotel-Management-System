import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarCheck, BedDouble, Users, Receipt,
  UserCheck, BarChart3, Package, Settings, Sparkles, ClipboardList,
  Wrench, UtensilsCrossed, ConciergeBell, DollarSign, Shield,
  ChevronLeft, ChevronRight, Hotel, TrendingUp,
} from 'lucide-react';
import { classNames } from '../../lib/utils';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', exact: true },
  { icon: CalendarCheck, label: 'Reservations', path: '/admin/reservations' },
  { icon: BedDouble, label: 'Rooms', path: '/admin/rooms' },
  { icon: Users, label: 'Guests', path: '/admin/guests' },
  { icon: Receipt, label: 'Billing', path: '/admin/billing' },
  { icon: UserCheck, label: 'Staff', path: '/admin/staff', roles: ['admin', 'manager'] },
  { icon: DollarSign, label: 'Payroll', path: '/admin/payroll', roles: ['admin', 'manager'] },
  { icon: BarChart3, label: 'Reports', path: '/admin/reports', roles: ['admin', 'manager'] },
  { icon: Package, label: 'Inventory', path: '/admin/inventory', roles: ['admin', 'manager'] },
  { icon: ClipboardList, label: 'Housekeeping', path: '/admin/housekeeping' },
  { icon: Wrench, label: 'Maintenance', path: '/admin/maintenance' },
  { icon: UtensilsCrossed, label: 'Food Orders', path: '/admin/food-orders' },
  { icon: ConciergeBell, label: 'Services', path: '/admin/services' },
  { icon: Shield, label: 'Audit Logs', path: '/admin/audit-logs', roles: ['admin'] },
  { icon: Settings, label: 'Settings', path: '/admin/settings', roles: ['admin'] },
];

const aiItems = [
  { icon: Sparkles, label: 'AI Assistant', path: '/admin/ai' },
  { icon: TrendingUp, label: 'AI Predictions', path: '/admin/ai/predictions', roles: ['admin', 'manager'] },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { user } = useAuth();

  const isActive = (path: string, exact = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const canAccess = (roles?: string[]) => {
    if (!roles) return true;
    return roles.includes(user?.role || '');
  };

  return (
    <aside
      className={classNames(
        'fixed left-0 top-0 bottom-0 z-40 bg-slate-950 border-r border-white/5 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 shrink-0">
        <div className="p-2 bg-amber-600/10 rounded-xl shrink-0">
          <Hotel className="w-5 h-5 text-amber-500" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
              Gashuna Hotel
            </p>
            <p className="text-xs text-white/30 truncate">Admin Dashboard</p>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="ml-auto p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all shrink-0"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className="px-2 space-y-0.5">
          {navItems.filter((item) => canAccess(item.roles)).map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                className={classNames(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  active
                    ? 'text-amber-400 bg-amber-500/10 border-r-2 border-amber-500'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className={classNames('w-4 h-4 shrink-0', active && 'text-amber-400')} />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* AI Section */}
        <div className="mt-4 pt-4 border-t border-white/5 px-2">
          {!sidebarCollapsed && (
            <p className="text-xs font-semibold text-white/20 uppercase tracking-wider px-3 mb-2">
              AI Features
            </p>
          )}
          <nav className="space-y-0.5">
            {aiItems.filter((item) => canAccess(item.roles)).map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={classNames(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    active
                      ? 'text-amber-400 bg-amber-500/10 border-r-2 border-amber-500'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className={classNames('w-4 h-4 shrink-0', active && 'text-amber-400')} />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Info */}
      <div className="shrink-0 border-t border-white/5 p-3">
        <div className={classNames('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-amber-500">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/30 capitalize truncate">{user?.role}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
