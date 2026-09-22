import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConciergeBell, Plus, Check, Clock } from 'lucide-react';
import { serviceRequestsAPI } from '../../lib/api';
import { formatDate, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Requests' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Services() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', status],
    queryFn: () => serviceRequestsAPI.getAll({ status: status || undefined }),
    select: (d) => d.data,
  });

  const { mutate: confirmRequest } = useMutation({
    mutationFn: (id: string) => serviceRequestsAPI.confirm(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-requests'] }); toast.success('Request confirmed.'); },
  });

  const { mutate: completeRequest } = useMutation({
    mutationFn: (id: string) => serviceRequestsAPI.complete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-requests'] }); toast.success('Request completed.'); },
  });

  const requests = data?.requests || [];

  const columns: Column<any>[] = [
    {
      key: 'requestNumber',
      header: 'Request #',
      render: (row) => <span className="font-mono text-amber-400 text-xs">{row.requestNumber}</span>,
    },
    {
      key: 'guest',
      header: 'Guest',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.guest?.fullName || '—'}</p>
          <p className="text-xs text-white/40">Room {row.roomNumber || '—'}</p>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      render: (row) => <span className="text-sm text-white">{row.service?.name || '—'}</span>,
    },
    {
      key: 'scheduledDate',
      header: 'Scheduled',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Clock className="w-3.5 h-3.5" />
          {row.scheduledDate ? formatDate(row.scheduledDate) : 'ASAP'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={
          row.status === 'completed' ? 'success' :
          row.status === 'in_progress' ? 'warning' :
          row.status === 'confirmed' ? 'info' :
          row.status === 'pending' ? 'error' : 'gray'
        }>
          {row.status?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-1">
          {row.status === 'pending' && (
            <Button variant="gold" size="sm" onClick={(e) => { e.stopPropagation(); confirmRequest(row._id); }}>
              Confirm
            </Button>
          )}
          {(row.status === 'confirmed' || row.status === 'in_progress') && (
            <Button variant="success" size="sm" leftIcon={<Check className="w-3 h-3" />}
              onClick={(e) => { e.stopPropagation(); completeRequest(row._id); }}
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
        title="Service Requests"
        subtitle="Manage guest service requests and concierge bookings"
        actions={<Button variant="gold" leftIcon={<Plus className="w-4 h-4" />}>New Request</Button>}
      />
      <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} className="w-48" />
      <div className="glass-card overflow-hidden">
        <DataTable columns={columns} data={requests} isLoading={isLoading} emptyMessage="No service requests found." rowKey={(row) => row._id} />
      </div>
    </div>
  );
}
