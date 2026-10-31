import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { reportsAPI } from '../lib/api';

export const useReports = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportsAPI.getAll(params),
    select: (res) => res.data,
  });

export const useReport = (id: string) =>
  useQuery({
    queryKey: ['reports', id],
    queryFn: () => reportsAPI.getById(id),
    enabled: !!id,
    select: (res) => res.data,
  });

const useGenerate = (
  fn: (data: { month: number; year: number }) => Promise<unknown>,
  label: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(`${label} report generated successfully.`);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to generate report.'),
  });
};

export const useGenerateRevenueReport = () =>
  useGenerate((d) => reportsAPI.generateRevenue(d), 'Revenue');

export const useGenerateOccupancyReport = () =>
  useGenerate((d) => reportsAPI.generateOccupancy(d), 'Occupancy');

export const useGeneratePayrollReport = () =>
  useGenerate((d) => reportsAPI.generatePayroll(d), 'Payroll');
