import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { maintenanceAPI } from '../../lib/api';
import { formatDate, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import StatusDot from '../../components/ui/StatusDot';
import StatCard from '../../components/ui/StatCard';
import { SkeletonStatCard } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'critical', label: '🚨 Critical' },
  { value: 'high', label: '⚠️ High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

export default function Maintenance() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', status, priority],
    queryFn: () => maintenanceAPI.getAll({ status: status || undefined, priority: priority || undefined }),
    select: (d) => d.data,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: () => maintenanceAPI.getStats(),
    select: (d) => d.data,
  });

  const { mutate: resolveRequest } = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      maintenanceAPI.resolve(id, { resolutionNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Maintenance request resolved.');
    },
  });

  const requests = data?.requests || [];
  const stats = statsData?.stats;

  const columns: Column<any>[] = [
    {
      key: 'requestNumber',
      header: 'Request #',
      render: (row) => (
        <span className="font-mono text-amber-400 text-xs">{row.requestNumber}</span>
      ),
    },
    {
      key: 'title',
      header: 'Issue',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.title}</p>
          <p className="text-xs text-white/40">{row.location}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <Badge variant="info">{row.category}</Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge variant={
          row.priority === 'critical' ? 'error' :
          row.priority === 'high' ? 'warning' :
          row.priority === 'normal' ? 'info' : 'gray'
        }>
          {row.priority === 'critical' ? '🚨 ' : row.priority === 'high' ? '⚠️ ' : ''}{row.priority}
        </Badge>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (row) => (
        <span className="text-sm text-white/60">{row.assignedTo?.fullName || 'Unassigned'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusDot status={row.status} type="maintenance" />
          <Badge variant={
            row.status === 'resolved' || row.status === 'closed' ? 'success' :
            row.status === 'in_progress' ? 'warning' :
            row.status === 'open' ? 'error' : 'info'
          }>
            {row.status?.replace(/_/g, ' ')}
          </Badge>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Reported',
      render: (row) => (
        <span className="text-xs text-white/40">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-1">
          {(row.status === 'in_progress' || row.status === 'assigned') && (
            <Button
              variant="success"
              size="sm"
              leftIcon={<CheckCircle className="w-3 h-3" />}
              onClick={(e) => { e.stopPropagation(); resolveRequest({ id: row._id }); }}
            >
              Resolve
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Maintenance"
        subtitle="Track and resolve facility maintenance requests"
        actions={
          <Button variant="gold" leftIcon={<Plus className="w-4 h-4" />}>
            New Request
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard title="Open Requests" value={stats?.open || 0} icon={<AlertTriangle className="w-5 h-5 text-red-500" />} iconBg="bg-red-500/10" />
            <StatCard title="In Progress" value={stats?.inProgress || 0} icon={<Wrench className="w-5 h-5 text-amber-500" />} iconBg="bg-amber-500/10" />
            <StatCard title="Critical" value={stats?.critical || 0} icon={<AlertTriangle className="w-5 h-5 text-red-500" />} iconBg="bg-red-500/10" />
            <StatCard title="Resolved Today" value={stats?.resolvedToday || 0} icon={<CheckCircle className="w-5 h-5 text-emerald-500" />} iconBg="bg-emerald-500/10" />
          </>
        )}
      </div>

      <div className="flex gap-3">
        <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} className="w-44" />
        <Select options={priorityOptions} value={priority} onChange={(e) => setPriority(e.target.value)} className="w-44" />
      </div>

      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={requests}
          isLoading={isLoading}
          emptyMessage="No maintenance requests found."
          rowKey={(row) => row._id}
        />
      </div>
    </div>
  );
}
