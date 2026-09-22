import { useState } from 'react';
import { Plus, Users, Phone, Briefcase } from 'lucide-react';
import { useStaff, useUpdateStaffStatus } from '../../hooks/useStaff';
import { formatETB, timeAgo, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import StatusDot from '../../components/ui/StatusDot';

const deptOptions = [
  { value: '', label: 'All Departments' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'security', label: 'Security' },
  { value: 'management', label: 'Management' },
  { value: 'accounting', label: 'Accounting' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'terminated', label: 'Terminated' },
];

export default function Staff() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('active');

  const { data, isLoading } = useStaff({
    page, limit: 20,
    search: search || undefined,
    department: department || undefined,
    status: status || undefined,
  });

  const staff = data?.staff || [];
  const { mutate: updateStatus } = useUpdateStaffStatus();

  const columns: Column<any>[] = [
    {
      key: 'fullName',
      header: 'Staff Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
            {row.photo ? (
              <img src={row.photo} alt={row.fullName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-blue-400">
                {row.fullName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{row.fullName}</p>
            <p className="text-xs text-white/40">{row.position}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-white/60">
          <Briefcase className="w-3.5 h-3.5 text-white/30" />
          <span className="capitalize">{row.department?.replace(/_/g, ' ')}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-white/60">
          <Phone className="w-3.5 h-3.5 text-white/30" />
          {row.phone}
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      render: (row) => (
        <span className="font-semibold text-amber-400">{formatETB(row.salary)}/mo</span>
      ),
    },
    {
      key: 'shift',
      header: 'Shift',
      render: (row) => (
        <Badge variant={row.shift === 'morning' ? 'info' : row.shift === 'afternoon' ? 'warning' : 'gray'}>
          {row.shift}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusDot status={row.status} type="staff" />
          <Badge variant={row.status === 'active' ? 'success' : row.status === 'on_leave' ? 'warning' : 'error'}>
            {row.status?.replace(/_/g, ' ')}
          </Badge>
        </div>
      ),
    },
    {
      key: 'hireDate',
      header: 'Joined',
      render: (row) => (
        <span className="text-xs text-white/40">{timeAgo(row.hireDate)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">Edit</Button>
          {row.status === 'active' && (
            <Button
              variant="warning"
              size="sm"
              onClick={(e) => { e.stopPropagation(); updateStatus({ id: row._id, status: 'on_leave' }); }}
            >
              Leave
            </Button>
          )}
          {row.status === 'on_leave' && (
            <Button
              variant="success"
              size="sm"
              onClick={(e) => { e.stopPropagation(); updateStatus({ id: row._id, status: 'active' }); }}
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Staff Management"
        subtitle={`${data?.total || 0} staff members · ${data?.stats?.active || 0} active`}
        actions={
          <Button variant="gold" leftIcon={<Plus className="w-4 h-4" />}>
            Add Staff
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search staff..." onSearch={setSearch} />
        </div>
        <Select options={deptOptions} value={department} onChange={(e) => setDepartment(e.target.value)} className="sm:w-48" />
        <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40" />
      </div>

      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={staff}
          isLoading={isLoading}
          emptyMessage="No staff members found."
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
