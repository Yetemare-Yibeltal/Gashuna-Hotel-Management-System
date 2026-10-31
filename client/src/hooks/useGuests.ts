import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { guestsAPI } from '../lib/api';

export const useGuests = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['guests', params],
    queryFn: () => guestsAPI.getAll(params),
    select: (res) => res.data,
  });

export const useGuest = (id: string) =>
  useQuery({
    queryKey: ['guests', id],
    queryFn: () => guestsAPI.getById(id),
    enabled: !!id,
    select: (res) => res.data,
  });

export const useGuestStats = () =>
  useQuery({
    queryKey: ['guests', 'stats'],
    queryFn: () => guestsAPI.getStats(),
    select: (res) => res.data,
  });

export const useCreateGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => guestsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast.success('Guest record created successfully.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create guest.'),
  });
};

export const useUpdateGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      guestsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast.success('Guest record updated successfully.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update guest.'),
  });
};

export const useToggleVIP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => guestsAPI.toggleVIP(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast.success(`VIP status ${res.data.vip ? 'granted' : 'removed'}.`);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update VIP status.'),
  });
};
