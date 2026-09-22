import { useState } from 'react';
import { Shield, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsAPI } from '../../lib/api';
import { formatDateTime, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'BOOKING', label: 'Booking' },
];

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, action],
    queryFn: () => auditLogsAPI.getAll({ page, limit: 20, search: search || undefined, action: action || undefined }),
    select: (d) => d.data,
  });

  const logs = data?.logs || [];

  const columns: Column<any>[] = [
    {
      key: 'userName',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{row.userName}</p>
            <p className="text-xs text-white/40 capitalize">{row.userRole}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <Badge variant={
          row.action === 'DELETE' ? 'error' :
          row.action === 'CREATE' ? 'success' :
          row.action === 'UPDATE' ? 'info' :
          row.action === 'LOGIN' || row.action === 'LOGOUT' ? 'gray' :
          row.action === 'PAYMENT' ? 'gold' : 'info'
        }>
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (row) => (
        <span className="text-sm text-white/60">{row.resource}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <p className="text-xs text-white/50 max-w-xs truncate">{row.description}</p>
      ),
    },
    {
      key: 'success',
      header: 'Result',
      render: (row) => (
        <Badge variant={row.success ? 'success' : 'error'}>
          {row.success ? 'Success' : 'Failed'}
        </Badge>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP',
      render: (row) => (
        <span className="text-xs text-white/30 font-mono">{row.ipAddress || '—'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Time',
      render: (row) => (
        <span className="text-xs text-white/40">{formatDateTime(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Audit Logs"
        subtitle="System activity and security audit trail"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search logs..." onSearch={setSearch} />
        </div>
        <Select options={actionOptions} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="sm:w-44" />
      </div>

      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          emptyMessage="No audit logs found."
          rowKey={(row) => row._id}
        />
        {data?.total > 0 && (
          <div className="border-t border-white/5">
            <Pagination page={page} pages={data?.pages || 1} total={data?.total || 0} limit={20} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
