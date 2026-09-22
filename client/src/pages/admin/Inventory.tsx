import { useState } from 'react';
import { Plus, AlertTriangle, Package } from 'lucide-react';
import { useInventory, useLowStock, useInventoryStats } from '../../hooks/useInventory';
import { formatETB, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import StatCard from '../../components/ui/StatCard';
import Pagination from '../../components/ui/Pagination';
import { SkeletonStatCard } from '../../components/ui/Skeleton';

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'bar', label: 'Bar' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'office', label: 'Office' },
  { value: 'amenities', label: 'Amenities' },
];

export default function Inventory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const { data, isLoading } = useInventory({
    page, limit: 20,
    search: search || undefined,
    category: category || undefined,
    lowStock: showLowStock ? true : undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useInventoryStats();
  const { data: lowStockData } = useLowStock();

  const stats = statsData?.stats;
  const items = data?.items || [];
  const lowStockItems = lowStockData?.items || [];

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Item',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-600/10 rounded-lg">
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{row.name}</p>
            <p className="text-xs text-white/40 capitalize">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Stock',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className={classNames(
            'text-sm font-semibold',
            row.quantity === 0 ? 'text-red-400' :
            row.quantity <= row.reorderLevel ? 'text-amber-400' : 'text-emerald-400'
          )}>
            {row.quantity} {row.unit}
          </span>
          {row.quantity <= row.reorderLevel && (
            <AlertTriangle className={classNames('w-3.5 h-3.5', row.quantity === 0 ? 'text-red-400' : 'text-amber-400')} />
          )}
        </div>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder At',
      render: (row) => (
        <span className="text-sm text-white/50">{row.reorderLevel} {row.unit}</span>
      ),
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      render: (row) => (
        <span className="text-sm text-amber-400">{formatETB(row.unitCost)}</span>
      ),
    },
    {
      key: 'totalValue',
      header: 'Total Value',
      render: (row) => (
        <span className="text-sm font-semibold text-white">{formatETB(row.quantity * row.unitCost)}</span>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => (
        <span className="text-xs text-white/40">{row.supplier || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={
          row.quantity === 0 ? 'error' :
          row.quantity <= row.reorderLevel ? 'warning' : 'success'
        }>
          {row.quantity === 0 ? 'Out of Stock' :
           row.quantity <= row.reorderLevel ? 'Low Stock' : 'In Stock'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button variant="ghost" size="sm">
          Update Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Inventory Management"
        subtitle={`${data?.total || 0} items · ${lowStockItems.length} low stock alerts`}
        actions={
          <Button variant="gold" leftIcon={<Plus className="w-4 h-4" />}>
            Add Item
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard title="Total Items" value={stats?.totalItems || 0} icon={<Package className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-500/10" />
            <StatCard title="Total Value" value={formatETB(stats?.totalValue || 0)} icon={<Package className="w-5 h-5 text-amber-500" />} iconBg="bg-amber-500/10" valueColor="text-amber-400" />
            <StatCard title="Low Stock" value={stats?.lowStockCount || 0} icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} iconBg="bg-amber-500/10" />
            <StatCard title="Out of Stock" value={stats?.outOfStockCount || 0} icon={<AlertTriangle className="w-5 h-5 text-red-500" />} iconBg="bg-red-500/10" />
          </>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-amber-400">Low Stock Alert</p>
          </div>
          <p className="text-xs text-white/50">
            {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} need restocking:{' '}
            {lowStockItems.slice(0, 3).map((i: any) => i.name).join(', ')}
            {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search inventory..." onSearch={setSearch} />
        </div>
        <Select options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-44" />
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={classNames(
            'px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border',
            showLowStock
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-white/5 text-white/50 border-white/10'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Low Stock Only
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          emptyMessage="No inventory items found."
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
