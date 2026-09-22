import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Users, Plus, Trash2, RefreshCw, Shield } from 'lucide-react';
import { settingsAPI } from '../../lib/api';
import { timeAgo, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { HOTEL } from '../../config/constants';

export default function Settings() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'hotel' | 'users'>('hotel');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['settings-users'],
    queryFn: () => settingsAPI.getUsers(),
    select: (d) => d.data,
    enabled: isAdmin,
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: (id: string) => settingsAPI.toggleUserStatus(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings-users'] }); toast.success('User status updated.'); },
  });

  const { mutate: resetPassword } = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      settingsAPI.resetPassword(id, password),
    onSuccess: () => toast.success('Password reset successfully.'),
  });

  const { mutate: deleteUser, isPending: deleting } = useMutation({
    mutationFn: (id: string) => settingsAPI.deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings-users'] }); toast.success('User deleted.'); setDeleteDialog(null); },
  });

  const users = usersData?.users || [];

  const userColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-400">{row.name?.charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{row.name}</p>
            <p className="text-xs text-white/40">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge variant={row.role === 'admin' ? 'error' : row.role === 'manager' ? 'warning' : 'info'}>
          <Shield className="w-3 h-3 mr-1" />
          {row.role}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'error'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (row) => (
        <span className="text-xs text-white/40">{row.lastLogin ? timeAgo(row.lastLogin) : 'Never'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleStatus(row._id); }}>
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="w-3 h-3" />}
            onClick={(e) => { e.stopPropagation(); resetPassword({ id: row._id, password: 'Gashuna@2025' }); }}
          >
            Reset Password
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3 h-3" />}
            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ id: row._id, name: row.name }); }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Settings"
        subtitle="Hotel configuration and user management"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {(['hotel', 'users'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={classNames(
              'px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-all -mb-px',
              activeTab === tab
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-white/40 hover:text-white/70'
            )}
          >
            {tab === 'hotel' ? '🏨 Hotel Info' : '👤 User Management'}
          </button>
        ))}
      </div>

      {activeTab === 'hotel' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Hotel Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: 'Hotel Name', value: HOTEL.name },
              { label: 'Hotel Name (Amharic)', value: HOTEL.nameAmharic },
              { label: 'Email', value: HOTEL.email },
              { label: 'Website', value: HOTEL.website },
              { label: 'Currency', value: HOTEL.currency },
              { label: 'VAT Rate', value: HOTEL.vatRatePercent },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-white/40 font-medium mb-1">{label}</p>
                <p className="text-sm text-white">{value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-white/40 font-medium mb-1">Address</p>
            <p className="text-sm text-white">{HOTEL.address}</p>
            <p className="text-sm text-white/40 font-amharic mt-1">{HOTEL.addressAmharic}</p>
          </div>
          <div className="pt-4 border-t border-white/5">
            <p className="text-xs text-white/20">
              To update hotel settings, contact your system administrator.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'users' && isAdmin && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="gold" leftIcon={<Plus className="w-4 h-4" />}>
              Add User
            </Button>
          </div>
          <div className="glass-card overflow-hidden">
            <DataTable
              columns={userColumns}
              data={users}
              isLoading={usersLoading}
              emptyMessage="No users found."
              rowKey={(row) => row._id}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={() => deleteUser(deleteDialog!.id)}
        title="Delete User"
        message={`Delete user "${deleteDialog?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete User"
        isLoading={deleting}
      />
    </div>
  );
}
