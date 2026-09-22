import { useState } from 'react';
import { Plus, Star, Users, Phone, Globe } from 'lucide-react';
import { useGuests, useToggleVIP } from '../../hooks/useGuests';
import { formatETB, timeAgo, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../hooks/useAuth';

const filterOptions = [
  { value: '', label: 'All Guests' },
  { value: 'vip', label: 'VIP Only' },
  { value: 'repeat', label: 'Repeat Guests' },
];

export default function Guests() {
  const { isAdminOrManager } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useGuests({
    page,
    limit: 20,
    search: search || undefined,
    vip: filter === 'vip' ? true : undefined,
    repeat: filter === 'repeat' ? true : undefined,
  });

  const guests = data?.guests || [];
  const { mutate: toggleVIP } = useToggleVIP();

  const columns: Column<any>[] = [
    {
      key: 'fullName',
      header: 'Guest',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-600/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-amber-500">
              {row.fullName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-white">{row.fullName}</p>
              {row.vip && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
            </div>
            <p className="text-xs text-white/40">{row.email || 'No email'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-white/60">
          <Phone className="w-3.5 h-3.5 text-white/30" />
          {row.phone}
        </div>
      ),
    },
    {
      key: 'nationality',
      header: 'Nationality',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-white/60">
          <Globe className="w-3.5 h-3.5 text-white/30" />
          {row.nationality || 'Ethiopia'}
        </div>
      ),
    },
    {
      key: 'totalStays',
      header: 'Stays',
      render: (row) => (
        <div className="text-center">
          <p className="text-base font-bold text-white">{row.totalStays}</p>
          <p className="text-xs text-white/30">visits</p>
        </div>
      ),
      align: 'center',
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      render: (row) => (
        <span className="font-semibold text-amber-400">{formatETB(row.totalSpent || 0)}</span>
      ),
    },
    {
      key: 'loyaltyPoints',
      header: 'Loyalty Pts',
      render: (row) => (
        <Badge variant="gold">{row.loyaltyPoints || 0} pts</Badge>
      ),
    },
    {
      key: 'vip',
      header: 'VIP',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); if (isAdminOrManager) toggleVIP(row._id); }}
          className={classNames(
            'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all',
            row.vip
              ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
              : 'bg-white/5 text-white/30 hover:bg-white/10'
          )}
        >
          <Star className={classNames('w-3 h-3', row.vip && 'fill-amber-400')} />
          {row.vip ? 'VIP' : 'Regular'}
        </button>
      ),
    },
    {
      key: 'createdAt',
      header: 'Member Since',
      render: (row) => (
        <span className="text-xs text-white/40">{timeAgo(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Guests"
        subtitle={`${data?.total || 0} total guests · ${data?.stats?.vipCount || 0} VIP`}
        actions={
          <Button variant="gold" leftIcon={<Plus className="w-4 h-4" />}>
            Add Guest
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search by name, phone, email..." onSearch={setSearch} />
        </div>
        <Select
          options={filterOptions}
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="sm:w-44"
        />
      </div>

      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={guests}
          isLoading={isLoading}
          emptyMessage="No guests found."
          rowKey={(row) => row._id}
        />
        {data?.total > 0 && (
          <div className="border-t border-white/5">
            <Pagination
              page={page}
              pages={data?.pages || 1}
              total={data?.total || 0}
              limit={20}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
