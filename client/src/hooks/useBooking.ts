
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../lib/api';

export const useBookings = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['bookings', params],
    queryFn: () => bookingsAPI.getAll(params),
    select: (res) => res.data,
  });

export const useBooking = (id: string) =>
  useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingsAPI.getById(id),
    enabled: !!id,
    select: (res) => res.data,
  });

export const useBookingStats = (params?: { month?: number; year?: number }) =>
  useQuery({
    queryKey: ['bookings', 'stats', params],
    queryFn: () => bookingsAPI.getStats(params),
    select: (res) => res.data,
    refetchInterval: 60000,
  });

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => bookingsAPI.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success(`Booking created! Ref: ${res.data.booking?.bookingRef}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create booking.'),
  });
};

export const useConfirmBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsAPI.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking confirmed successfully.');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to confirm booking.'),
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingsAPI.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled successfully.');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to cancel booking.'),
  });
};

export const useCheckIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsAPI.checkIn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Guest checked in successfully.');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to check in guest.'),
  });
};

export const useCheckOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsAPI.checkOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Guest checked out. Room is now being cleaned.');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to check out guest.'),
  });
};
