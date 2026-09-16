import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { useUIStore } from '../../store/uiStore';
import { useSocket } from '../../hooks/useSocket';
import { classNames } from '../../lib/utils';

export default function AdminLayout() {
  useSocket();
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      <AdminSidebar />
      <div
        className={classNames(
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <AdminTopbar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
