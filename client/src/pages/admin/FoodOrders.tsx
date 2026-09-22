import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UtensilsCrossed, Clock, Check, Play } from 'lucide-react';
import { foodOrdersAPI } from '../../lib/api';
import { formatETB, formatDate, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import StatCard from '../../components/ui/StatCard';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function FoodOrders() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['food-orders', status],
    queryFn: () => foodOrdersAPI.getAll({ status: status || undefined, limit: 50 }),
    select: (d) => d.data,
    refetchInterval: 30000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['food-orders-stats'],
    queryFn: () => foodOrdersAPI.getStats(),
    select: (d) => d.data,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      foodOrdersAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-orders'] });
      toast.success('Order status updated.');
    },
  });

  const orders = data?.orders || [];
  const stats = statsData?.stats;

  const nextStatus: Record<string, string> = {
    pending: 'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'delivered',
  };

  const nextStatusLabel: Record<string, string> = {
    pending: 'Confirm',
    confirmed: 'Start Preparing',
    preparing: 'Mark Ready',
    ready: 'Mark Delivered',
  };

  const columns: Column<any>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (row) => (
        <span className="font-mono text-amber-400 text-xs font-semibold">{row.orderNumber}</span>
      ),
    },
    {
      key: 'guest',
      header: 'Guest / Room',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.guest?.fullName || 'Walk-in'}</p>
          <p className="text-xs text-white/40">{row.roomNumber ? `Room ${row.roomNumber}` : row.orderType}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (row) => (
        <div>
          <p className="text-sm text-white">{row.items?.length} item{row.items?.length > 1 ? 's' : ''}</p>
          <p className="text-xs text-white/40 truncate max-w-32">
            {row.items?.slice(0, 2).map((i: any) => i.menuItem?.name || i.name).join(', ')}
          </p>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (row) => (
        <span className="font-semibold text-amber-400">{formatETB(row.totalAmount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={
          row.status === 'delivered' ? 'success' :
          row.status === 'ready' ? 'info' :
          row.status === 'preparing' ? 'warning' :
          row.status === 'pending' ? 'error' :
          row.status === 'cancelled' ? 'error' : 'gray'
        }>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ordered',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(row.createdAt)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-1">
          {nextStatus[row.status] && (
            <Button
              variant={row.status === 'ready' ? 'success' : 'gold'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                updateStatus({ id: row._id, status: nextStatus[row.status] });
              }}
            >
              {nextStatusLabel[row.status]}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Food Orders"
        subtitle="Manage restaurant and room service orders"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={<UtensilsCrossed className="w-5 h-5 text-amber-500" />} iconBg="bg-amber-500/10" />
        <StatCard title="Pending" value={stats?.pendingOrders || 0} icon={<Clock className="w-5 h-5 text-red-500" />} iconBg="bg-red-500/10" />
        <StatCard title="Preparing" value={stats?.preparingOrders || 0} icon={<Play className="w-5 h-5 text-amber-500" />} iconBg="bg-amber-500/10" />
        <StatCard title="Today's Revenue" value={formatETB(stats?.todayRevenue || 0)} icon={<Check className="w-5 h-5 text-emerald-500" />} iconBg="bg-emerald-500/10" valueColor="text-amber-400" />
      </div>

      <div className="flex gap-3">
        <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} className="w-48" />
      </div>

      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          emptyMessage="No food orders found."
          rowKey={(row) => row._id}
        />
      </div>
    </div>
  );
}
