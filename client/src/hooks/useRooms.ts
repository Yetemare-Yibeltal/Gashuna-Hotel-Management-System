import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { roomsAPI } from '../lib/api';

export const useRooms = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['rooms', params],
    queryFn: () => roomsAPI.getAll(params),
    select: (res) => res.data,
  });

export const useAvailableRooms = (params: {
  checkIn: string;
  checkOut: string;
  capacity?: number;
  type?: string;
}) =>
  useQuery({
    queryKey: ['rooms', 'available', params],
    queryFn: () => roomsAPI.getAvailable(params),
    enabled: !!params.checkIn && !!params.checkOut,
    select: (res) => res.data,
  });

export const useRoom = (id: string) =>
  useQuery({
    queryKey: ['rooms', id],
    queryFn: () => roomsAPI.getById(id),
    enabled: !!id,
    select: (res) => res.data,
  });

export const useRoomStats = () =>
  useQuery({
    queryKey: ['rooms', 'stats'],
    queryFn: () => roomsAPI.getStats(),
    select: (res) => res.data,
    refetchInterval: 60000,
  });

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => roomsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room created successfully.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create room.'),
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      roomsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room updated successfully.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update room.'),
  });
};

export const useUpdateRoomStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      roomsAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room status updated.');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update room status.'),
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deactivated successfully.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete room.'),
  });
};
