import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BedDouble, Clock, Check, Play, ClipboardList } from 'lucide-react';
import { housekeepingAPI } from '../../lib/api';
import { formatDate, timeAgo, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import StatusDot from '../../components/ui/StatusDot';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Tasks' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'inspected', label: 'Inspected' },
];

export default function Housekeeping() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['housekeeping', status, page],
    queryFn: () => housekeepingAPI.getAll({ status: status || undefined, page, limit: 20 }),
    select: (d) => d.data,
  });

  const { mutate: startTask } = useMutation({
    mutationFn: (id: string) => housekeepingAPI.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
      toast.success('Task started.');
    },
  });

  const { mutate: completeTask } = useMutation({
    mutationFn: (id: string) => housekeepingAPI.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
      toast.success('Task completed.');
    },
  });

  const tasks = data?.tasks || [];

  const columns: Column<any>[] = [
    {
      key: 'room',
      header: 'Room',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-lg">
            <BedDouble className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Room {row.room?.roomNumber || '—'}</p>
            <p className="text-xs text-white/40">{row.room?.type?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Task Type',
      render: (row) => (
        <Badge variant="info">{row.type?.replace(/_/g, ' ') || 'Cleaning'}</Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge variant={row.priority === 'urgent' ? 'error' : row.priority === 'high' ? 'warning' : 'gray'}>
          {row.priority || 'normal'}
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
          <StatusDot status={row.status} />
          <Badge variant={
            row.status === 'done' || row.status === 'inspected' ? 'success' :
            row.status === 'in_progress' ? 'warning' :
            row.status === 'pending' ? 'error' : 'info'
          }>
            {row.status?.replace(/_/g, ' ')}
          </Badge>
        </div>
      ),
    },
    {
      key: 'scheduledFor',
      header: 'Scheduled',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Clock className="w-3.5 h-3.5" />
          {row.scheduledFor ? formatDate(row.scheduledFor) : timeAgo(row.createdAt)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-1">
          {row.status === 'assigned' && (
            <Button variant="gold" size="sm" leftIcon={<Play className="w-3 h-3" />}
              onClick={(e) => { e.stopPropagation(); startTask(row._id); }}
            >
              Start
            </Button>
          )}
          {row.status === 'in_progress' && (
            <Button variant="success" size="sm" leftIcon={<Check className="w-3 h-3" />}
              onClick={(e) => { e.stopPropagation(); completeTask(row._id); }}
            >
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Housekeeping"
        subtitle="Manage room cleaning and maintenance tasks"
        actions={
          <Button variant="gold" leftIcon={<ClipboardList className="w-4 h-4" />}>
            New Task
          </Button>
        }
      />

      <div className="flex gap-3">
        <Select options={statusOptions} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-48" />
      </div>

      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={tasks}
          isLoading={isLoading}
          emptyMessage="No housekeeping tasks found."
          rowKey={(row) => row._id}
        />
      </div>
    </div>
  );
}
