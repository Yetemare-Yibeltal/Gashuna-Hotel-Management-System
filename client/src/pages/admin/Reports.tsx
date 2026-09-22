import { useState } from 'react';
import { BarChart3, Download, RefreshCw, TrendingUp, Users, Package } from 'lucide-react';
import { useReports, useGenerateRevenueReport, useGenerateOccupancyReport, useGeneratePayrollReport } from '../../hooks/useReports';
import { formatDate, formatETB } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../hooks/useAuth';

const months = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const reportTypes = [
  { value: '', label: 'All Reports' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'occupancy', label: 'Occupancy' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'guests', label: 'Guests' },
];

export default function Reports() {
  const { isAdminOrManager } = useAuth();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [genMonth, setGenMonth] = useState(String(new Date().getMonth() + 1));
  const [genYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useReports({ page, limit: 20, type: type || undefined });
  const reports = data?.reports || [];

  const { mutate: genRevenue, isPending: genRevLoading } = useGenerateRevenueReport();
  const { mutate: genOccupancy, isPending: genOccLoading } = useGenerateOccupancyReport();
  const { mutate: genPayroll, isPending: genPayLoading } = useGeneratePayrollReport();

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Report',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.title}</p>
          <p className="text-xs text-white/40">{row.period}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge variant={row.type === 'revenue' ? 'gold' : row.type === 'occupancy' ? 'info' : 'gray'}>
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'totalRevenueETB',
      header: 'Revenue',
      render: (row) => (
        <span className="text-sm font-semibold text-amber-400">
          {row.totalRevenueETB ? formatETB(row.totalRevenueETB) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'ready' ? 'success' : row.status === 'generating' ? 'warning' : 'error'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'generatedAt',
      header: 'Generated',
      render: (row) => <span className="text-xs text-white/40">{formatDate(row.generatedAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button variant="ghost" size="sm" leftIcon={<Download className="w-3 h-3" />}>
          Download
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports"
        subtitle="Generate and download hotel performance reports"
      />

      {/* Generate Reports */}
      {isAdminOrManager && (
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Generate New Report
          </h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-44">
              <Select label="Month" options={months} value={genMonth} onChange={(e) => setGenMonth(e.target.value)} />
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="gold"
                size="sm"
                leftIcon={<TrendingUp className="w-4 h-4" />}
                isLoading={genRevLoading}
                onClick={() => genRevenue({ month: Number(genMonth), year: genYear })}
              >
                Revenue Report
              </Button>
              <Button
                variant="navy"
                size="sm"
                leftIcon={<BarChart3 className="w-4 h-4" />}
                isLoading={genOccLoading}
                onClick={() => genOccupancy({ month: Number(genMonth), year: genYear })}
              >
                Occupancy Report
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Users className="w-4 h-4" />}
                isLoading={genPayLoading}
                onClick={() => genPayroll({ month: Number(genMonth), year: genYear })}
              >
                Payroll Report
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Select options={reportTypes} value={type} onChange={(e) => setType(e.target.value)} className="w-44" />
      </div>

      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={reports}
          isLoading={isLoading}
          emptyMessage="No reports generated yet."
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
