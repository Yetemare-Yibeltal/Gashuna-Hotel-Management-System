import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { staffAPI } from '../lib/api';

export const useStaff = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['staff', params],
    queryFn: () => staffAPI.getAll(params),
    select: (res) => res.data,
  });

export const useStaffMember = (id: string) =>
  useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffAPI.getById(id),
    enabled: !!id,
    select: (res) => res.data,
  });

export const useStaffStats = () =>
  useQuery({
    queryKey: ['staff', 'stats'],
    queryFn: () => staffAPI.getStats(),
    select: (res) => res.data,
  });

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => staffAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member created successfully.');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to create staff member.'),
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      staffAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member updated successfully.');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update staff member.'),
  });
};

export const useUpdateStaffStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      terminationDate,
    }: {
      id: string;
      status: string;
      terminationDate?: string;
    }) => staffAPI.updateStatus(id, status, terminationDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff status updated successfully.');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update staff status.'),
  });
};
