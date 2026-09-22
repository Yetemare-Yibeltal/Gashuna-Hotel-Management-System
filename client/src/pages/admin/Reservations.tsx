import { useState } from 'react';
import { Plus, Eye, Check, X, LogIn, LogOut, Calendar } from 'lucide-react';
import { useBookings, useConfirmBooking, useCancelBooking, useCheckIn, useCheckOut } from '../../hooks/useBooking';
import { formatETB, formatDate, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusDot from '../../components/ui/StatusDot';
import { useAuth } from '../../hooks/useAuth';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

export default function Reservations() {
  const { isAdminOrManager } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ type: string; id: string; ref: string } | null>(null);

  const { data, isLoading } = useBookings({
    page, limit, search: search || undefined, status: status || undefined,
  });

  const bookings = data?.bookings || [];
  const { mutate: confirmBooking, isPending: confirming } = useConfirmBooking();
  const { mutate: cancelBooking, isPending: cancelling } = useCancelBooking();
  const { mutate: checkIn, isPending: checkingIn } = useCheckIn();
  const { mutate: checkOut, isPending: checkingOut } = useCheckOut();

  const handleConfirm = () => {
    if (!confirmDialog) return;
    if (confirmDialog.type === 'confirm') confirmBooking(confirmDialog.id);
    if (confirmDialog.type === 'cancel') cancelBooking({ id: confirmDialog.id });
    if (confirmDialog.type === 'checkin') checkIn(confirmDialog.id);
    if (confirmDialog.type === 'checkout') checkOut(confirmDialog.id);
    setConfirmDialog(null);
  };

  const columns: Column<any>[] = [
    {
      key: 'bookingRef',
      header: 'Booking Ref',
      render: (row) => (
        <span className="font-mono text-amber-400 text-xs font-semibold">{row.bookingRef}</span>
      ),
    },
    {
      key: 'guest',
      header: 'Guest',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.guest?.fullName || '—'}</p>
          <p className="text-xs text-white/40">{row.guest?.phone}</p>
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Room',
      render: (row) => (
        <div>
          <p className="text-sm text-white">{row.room?.name || '—'}</p>
          <p className="text-xs text-white/40 capitalize">{row.room?.type?.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'checkIn',
      header: 'Check-in',
      render: (row) => (
        <div>
          <p className="text-sm text-white">{formatDate(row.checkIn)}</p>
          <p className="text-xs text-white/40">{row.nights} night{row.nights > 1 ? 's' : ''}</p>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (row) => (
        <span className="font-semibold text-amber-400">{formatETB(row.totalAmount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusDot status={row.status} type="booking" />
          <Badge variant={
            row.status === 'confirmed' ? 'info' :
            row.status === 'checked_in' ? 'success' :
            row.status === 'pending' ? 'warning' :
            row.status === 'cancelled' || row.status === 'no_show' ? 'error' : 'gray'
          }>
            {row.status?.replace(/_/g, ' ')}
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && isAdminOrManager && (
            <Button
              variant="success"
              size="sm"
              leftIcon={<Check className="w-3 h-3" />}
              onClick={(e) => { e.stopPropagation(); setConfirmDialog({ type: 'confirm', id: row._id, ref: row.bookingRef }); }}
            >
              Confirm
            </Button>
          )}
          {row.status === 'confirmed' && (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<LogIn className="w-3 h-3" />}
              onClick={(e) => { e.stopPropagation(); setConfirmDialog({ type: 'checkin', id: row._id, ref: row.bookingRef }); }}
            >
              Check In
            </Button>
          )}
          {row.status === 'checked_in' && (
            <Button
              variant="navy"
              size="sm"
              leftIcon={<LogOut className="w-3 h-3" />}
              onClick={(e) => { e.stopPropagation(); setConfirmDialog({ type: 'checkout', id: row._id, ref: row.bookingRef }); }}
            >
              Check Out
            </Button>
          )}
          {(row.status === 'pending' || row.status === 'confirmed') && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<X className="w-3 h-3" />}
              onClick={(e) => { e.stopPropagation(); setConfirmDialog({ type: 'cancel', id: row._id, ref: row.bookingRef }); }}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reservations"
        subtitle="Manage all hotel bookings and guest check-ins"
        actions={
          <Button variant="gold" leftIcon={<Plus className="w-4 h-4" />}>
            New Booking
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            placeholder="Search by guest name, booking ref..."
            onSearch={setSearch}
          />
        </div>
        <div className="sm:w-48">
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={bookings}
          isLoading={isLoading}
          emptyMessage="No bookings found."
          rowKey={(row) => row._id}
        />
        {data?.total > 0 && (
          <div className="border-t border-white/5">
            <Pagination
              page={page}
              pages={data?.pages || 1}
              total={data?.total || 0}
              limit={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={handleConfirm}
        title={
          confirmDialog?.type === 'confirm' ? 'Confirm Booking' :
          confirmDialog?.type === 'cancel' ? 'Cancel Booking' :
          confirmDialog?.type === 'checkin' ? 'Check In Guest' :
          'Check Out Guest'
        }
        message={
          confirmDialog?.type === 'confirm'
            ? `Confirm booking ${confirmDialog?.ref}?`
            : confirmDialog?.type === 'cancel'
            ? `Cancel booking ${confirmDialog?.ref}? This cannot be undone.`
            : confirmDialog?.type === 'checkin'
            ? `Check in guest for booking ${confirmDialog?.ref}?`
            : `Check out guest for booking ${confirmDialog?.ref}?`
        }
        variant={confirmDialog?.type === 'cancel' ? 'danger' : 'info'}
        confirmLabel={
          confirmDialog?.type === 'confirm' ? 'Confirm Booking' :
          confirmDialog?.type === 'cancel' ? 'Cancel Booking' :
          confirmDialog?.type === 'checkin' ? 'Check In' : 'Check Out'
        }
        isLoading={confirming || cancelling || checkingIn || checkingOut}
      />
    </div>
  );
}
