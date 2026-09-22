import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { invoicesAPI, paymentsAPI } from '../../lib/api';
import { formatETB, formatDate, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import { SkeletonStatCard } from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';

const statusOptions = [
  { value: '', label: 'All Invoices' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const tabs = ['invoices', 'payments'];

export default function Billing() {
  const { isAdminOrManager } = useAuth();
  const [activeTab, setActiveTab] = useState('invoices');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data: invoiceData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', page, status, search],
    queryFn: () => invoicesAPI.getAll({ page, limit: 20, status: status || undefined, search: search || undefined }),
    select: (d) => d.data,
    enabled: activeTab === 'invoices',
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: () => invoicesAPI.getStats(),
    select: (d) => d.data,
  });

  const { data: paymentData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => paymentsAPI.getAll({ page, limit: 20 }),
    select: (d) => d.data,
    enabled: activeTab === 'payments',
  });

  const invoiceColumns: Column<any>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (row) => (
        <span className="font-mono text-amber-400 text-xs font-semibold">{row.invoiceNumber}</span>
      ),
    },
    {
      key: 'guest',
      header: 'Guest',
      render: (row) => (
        <p className="text-sm text-white">{row.guest?.fullName || '—'}</p>
      ),
    },
    {
      key: 'issueDate',
      header: 'Date',
      render: (row) => <span className="text-sm text-white/60">{formatDate(row.issueDate || row.createdAt)}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => <span className="font-semibold text-amber-400">{formatETB(row.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={
          row.status === 'paid' ? 'success' :
          row.status === 'issued' ? 'info' :
          row.status === 'overdue' ? 'error' :
          row.status === 'draft' ? 'gray' : 'warning'
        }>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      render: (row) => (
        <span className="text-xs text-white/50 capitalize">{row.paymentMethod?.replace(/_/g, ' ') || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'issued' && isAdminOrManager && (
            <Button variant="success" size="sm" onClick={(e) => e.stopPropagation()}>
              Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  const paymentColumns: Column<any>[] = [
    {
      key: 'paymentRef',
      header: 'Ref',
      render: (row) => <span className="font-mono text-amber-400 text-xs">{row.paymentRef}</span>,
    },
    {
      key: 'guest',
      header: 'Guest',
      render: (row) => <p className="text-sm text-white">{row.guest?.fullName || '—'}</p>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => <span className="font-semibold text-amber-400">{formatETB(row.amount)}</span>,
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (row) => (
        <span className="text-xs text-white/60 capitalize">{row.channel?.replace(/_/g, ' ') || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'success' ? 'success' : row.status === 'failed' ? 'error' : row.status === 'refunded' ? 'info' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => <span className="text-xs text-white/40">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Billing & Payments"
        subtitle="Manage invoices, payments, and financial records"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={formatETB(statsData?.stats?.totalRevenue || 0)}
              icon={<DollarSign className="w-5 h-5 text-amber-500" />}
              iconBg="bg-amber-500/10"
              valueColor="text-amber-400"
            />
            <StatCard
              title="Paid Invoices"
              value={statsData?.stats?.paidInvoices || 0}
              icon={<Receipt className="w-5 h-5 text-emerald-500" />}
              iconBg="bg-emerald-500/10"
            />
            <StatCard
              title="Outstanding"
              value={formatETB(statsData?.stats?.outstandingAmount || 0)}
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              iconBg="bg-amber-500/10"
            />
            <StatCard
              title="This Month"
              value={formatETB(statsData?.stats?.thisMonthRevenue || 0)}
              icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
              iconBg="bg-blue-500/10"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={classNames(
              'px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-all -mb-px',
              activeTab === tab
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-white/40 hover:text-white/70'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab === 'invoices' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <SearchBar placeholder="Search invoices..." onSearch={setSearch} />
          </div>
          <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} className="w-44" />
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <DataTable
          columns={activeTab === 'invoices' ? invoiceColumns : paymentColumns}
          data={activeTab === 'invoices' ? (invoiceData?.invoices || []) : (paymentData?.payments || [])}
          isLoading={activeTab === 'invoices' ? invoicesLoading : paymentsLoading}
          emptyMessage={`No ${activeTab} found.`}
          rowKey={(row) => row._id}
        />
        <div className="border-t border-white/5">
          <Pagination
            page={page}
            pages={activeTab === 'invoices' ? (invoiceData?.pages || 1) : (paymentData?.pages || 1)}
            total={activeTab === 'invoices' ? (invoiceData?.total || 0) : (paymentData?.total || 0)}
            limit={20}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
