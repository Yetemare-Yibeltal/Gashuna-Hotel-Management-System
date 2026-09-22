import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Check, RefreshCw } from 'lucide-react';
import { payrollAPI } from '../../lib/api';
import { formatETB, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import StatCard from '../../components/ui/StatCard';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const months = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

export default function Payroll() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(String(currentMonth));
  const [year] = useState(String(currentYear));

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', month, year],
    queryFn: () => payrollAPI.getAll({ month: Number(month), year: Number(year) }),
    select: (d) => d.data,
  });

  const { data: statsData } = useQuery({
    queryKey: ['payroll-stats', month, year],
    queryFn: () => payrollAPI.getStats({ month: Number(month), year: Number(year) }),
    select: (d) => d.data,
  });

  const { mutate: generate, isPending: generating } = useMutation({
    mutationFn: () => payrollAPI.generate(Number(month), Number(year)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payroll'] }); toast.success('Payroll generated.'); },
  });

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => payrollAPI.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payroll'] }); toast.success('Payroll approved.'); },
  });

  const { mutate: markPaid } = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) => payrollAPI.markPaid(id, method),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payroll'] }); toast.success('Payroll marked as paid.'); },
  });

  const records = data?.payrolls || [];
  const stats = statsData?.stats;

  const columns: Column<any>[] = [
    {
      key: 'staff',
      header: 'Staff Member',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.staff?.fullName || '—'}</p>
          <p className="text-xs text-white/40 capitalize">{row.staff?.department?.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    { key: 'baseSalary', header: 'Base Salary', render: (row) => <span className="text-sm text-white">{formatETB(row.baseSalary)}</span> },
    { key: 'bonuses', header: 'Bonuses', render: (row) => <span className="text-sm text-emerald-400">{formatETB(row.bonuses || 0)}</span> },
    { key: 'deductions', header: 'Deductions', render: (row) => <span className="text-sm text-red-400">-{formatETB(row.deductions || 0)}</span> },
    { key: 'netPay', header: 'Net Pay', render: (row) => <span className="text-base font-bold text-amber-400">{formatETB(row.netPay)}</span> },
    {
      key: 'daysWorked',
      header: 'Attendance',
      render: (row) => <span className="text-sm text-white/60">{row.daysWorked || 0}/{row.daysWorked + (row.daysAbsent || 0)} days</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'paid' ? 'success' : row.status === 'approved' ? 'info' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-1">
          {row.status === 'draft' && isAdmin && (
            <Button variant="gold" size="sm" onClick={(e) => { e.stopPropagation(); approve(row._id); }}>Approve</Button>
          )}
          {row.status === 'approved' && isAdmin && (
            <Button variant="success" size="sm" leftIcon={<Check className="w-3 h-3" />}
              onClick={(e) => { e.stopPropagation(); markPaid({ id: row._id, method: 'bank_transfer' }); }}>
              Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Payroll Management"
        subtitle="Process and manage staff salary payments"
        actions={
          <Button variant="gold" leftIcon={<RefreshCw className="w-4 h-4" />} isLoading={generating} onClick={() => generate()}>
            Generate Payroll
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Payroll" value={formatETB(stats?.totalPayroll || 0)} icon={<DollarSign className="w-5 h-5 text-amber-500" />} iconBg="bg-amber-500/10" valueColor="text-amber-400" />
        <StatCard title="Paid" value={stats?.paidCount || 0} icon={<Check className="w-5 h-5 text-emerald-500" />} iconBg="bg-emerald-500/10" />
        <StatCard title="Pending" value={stats?.pendingCount || 0} icon={<DollarSign className="w-5 h-5 text-amber-500" />} iconBg="bg-amber-500/10" />
        <StatCard title="Staff Count" value={records.length} icon={<DollarSign className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-500/10" />
      </div>

      <div className="flex gap-3">
        <Select options={months} value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
      </div>

      <div className="glass-card overflow-hidden">
        <DataTable columns={columns} data={records} isLoading={isLoading} emptyMessage="No payroll records. Click Generate Payroll to create." rowKey={(row) => row._id} />
      </div>
    </div>
  );
}
