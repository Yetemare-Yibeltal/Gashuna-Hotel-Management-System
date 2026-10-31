import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryAPI } from '../lib/api';

export const useInventory = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryAPI.getAll(params),
    select: (res) => res.data,
  });

export const useLowStock = () =>
  useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryAPI.getLowStock(),
    select: (res) => res.data,
    refetchInterval: 60000,
  });

export const useInventoryStats = () =>
  useQuery({
    queryKey: ['inventory', 'stats'],
    queryFn: () => inventoryAPI.getStats(),
    select: (res) => res.data,
  });

export const useInventoryItem = (id: string) =>
  useQuery({
    queryKey: ['inventory', id],
    queryFn: () => inventoryAPI.getById(id),
    enabled: !!id,
    select: (res) => res.data,
  });

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => inventoryAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Inventory item created successfully.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create item.'),
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      inventoryAPI.updateStock(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(res.data.message || 'Stock updated successfully.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update stock.'),
  });
};
