import { useState } from 'react';
import { Plus, BedDouble, Edit, Trash2 } from 'lucide-react';
import { useRooms, useUpdateRoomStatus, useDeleteRoom } from '../../hooks/useRooms';
import { formatETB, classNames } from '../../lib/utils';
import SectionHeader from '../../components/ui/SectionHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusDot from '../../components/ui/StatusDot';
import SearchBar from '../../components/ui/SearchBar';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'reserved', label: 'Reserved' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'standard', label: 'Standard' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'junior_suite', label: 'Junior Suite' },
  { value: 'suite', label: 'Suite' },
];

const typeGradients: Record<string, string> = {
  standard: 'from-blue-900/40 to-slate-900',
  deluxe: 'from-purple-900/40 to-slate-900',
  junior_suite: 'from-amber-900/40 to-slate-900',
  suite: 'from-yellow-900/40 to-slate-900',
};

const newStatusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'reserved', label: 'Reserved' },
];

export default function RoomsManager() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useRooms({
    search: search || undefined,
    status: status || undefined,
    type: type || undefined,
  });

  const rooms = data?.rooms || [];
  const { mutate: updateStatus } = useUpdateRoomStatus();
  const { mutate: deleteRoom, isPending: deleting } = useDeleteRoom();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Room Management"
        subtitle={`${rooms.length} rooms · ${data?.stats?.available || 0} available`}
        actions={
          <Button variant="gold" leftIcon={<Plus className="w-4 h-4" />}>
            Add Room
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search rooms..." onSearch={setSearch} />
        </div>
        <Select
          options={statusOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-44"
        />
        <Select
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="sm:w-44"
        />
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={<BedDouble className="w-12 h-12" />}
          title="No rooms found"
          description="Add rooms or adjust your filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room: any) => (
            <div key={room._id} className="glass-card overflow-hidden">
              {/* Room Image */}
              <div className={classNames('h-36 bg-gradient-to-br relative', typeGradients[room.type] || typeGradients.standard)}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BedDouble className="w-12 h-12 text-white/10" />
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <StatusDot status={room.status} type="room" showLabel />
                </div>
                <div className="absolute top-3 right-3">
                  <span className="text-xs bg-black/40 text-white/70 px-2 py-0.5 rounded-md capitalize">
                    {room.type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Room {room.roomNumber}
                  </p>
                </div>
              </div>

              {/* Room Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{room.name}</p>
                    <p className="text-xs text-white/40">Floor {room.floor} · {room.view}</p>
                  </div>
                  <p className="text-base font-bold text-amber-400">{formatETB(room.price)}/night</p>
                </div>

                {/* Status Change */}
                <div className="mb-3">
                  <Select
                    options={newStatusOptions}
                    value={room.status}
                    onChange={(e) => updateStatus({ id: room._id, status: e.target.value })}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<Edit className="w-3 h-3" />} fullWidth>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="w-3 h-3" />}
                    onClick={() => setDeleteDialog({ id: room._id, name: room.name })}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={() => { deleteRoom(deleteDialog!.id); setDeleteDialog(null); }}
        title="Deactivate Room"
        message={`Deactivate ${deleteDialog?.name}? This room will no longer be available for booking.`}
        variant="danger"
        confirmLabel="Deactivate"
        isLoading={deleting}
      />
    </div>
  );
}
