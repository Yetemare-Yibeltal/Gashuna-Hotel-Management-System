import { create } from 'zustand';

export interface BookingGuest {
  fullName: string;
  phone: string;
  email?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
}

export interface BookingState {
  selectedRoomId: string | null;
  selectedRoom: Record<string, any> | null;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nights: number;
  guestDetails: BookingGuest;
  specialRequests: string;
  paymentMethod: string;
  bookingRef: string | null;
  totalAmount: number;
  step: number;
  setSelectedRoom: (room: Record<string, any> | null) => void;
  setDates: (checkIn: string, checkOut: string, nights: number) => void;
  setGuests: (adults: number, children: number) => void;
  setGuestDetails: (details: Partial<BookingGuest>) => void;
  setSpecialRequests: (requests: string) => void;
  setPaymentMethod: (method: string) => void;
  setBookingRef: (ref: string) => void;
  setTotalAmount: (amount: number) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetBooking: () => void;
}

const initialGuestDetails: BookingGuest = {
  fullName: '',
  phone: '',
  email: '',
  nationality: 'Ethiopia',
  idType: 'kebele_id',
  idNumber: '',
};

export const useBookingStore = create<BookingState>((set) => ({
  selectedRoomId: null,
  selectedRoom: null,
  checkIn: '',
  checkOut: '',
  adults: 1,
  children: 0,
  nights: 0,
  guestDetails: initialGuestDetails,
  specialRequests: '',
  paymentMethod: 'chapa',
  bookingRef: null,
  totalAmount: 0,
  step: 1,

  setSelectedRoom: (room) =>
    set({ selectedRoom: room, selectedRoomId: room?._id || null }),
  setDates: (checkIn, checkOut, nights) => set({ checkIn, checkOut, nights }),
  setGuests: (adults, children) => set({ adults, children }),
  setGuestDetails: (details) =>
    set((state) => ({ guestDetails: { ...state.guestDetails, ...details } })),
  setSpecialRequests: (requests) => set({ specialRequests: requests }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setBookingRef: (ref) => set({ bookingRef: ref }),
  setTotalAmount: (amount) => set({ totalAmount: amount }),
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  resetBooking: () =>
    set({
      selectedRoomId: null,
      selectedRoom: null,
      checkIn: '',
      checkOut: '',
      adults: 1,
      children: 0,
      nights: 0,
      guestDetails: initialGuestDetails,
      specialRequests: '',
      paymentMethod: 'chapa',
      bookingRef: null,
      totalAmount: 0,
      step: 1,
    }),
}));
