import axios, { AxiosError, AxiosResponse } from 'axios';
import { API_URL } from '../config/constants';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gashuna_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string; success?: boolean }>) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('gashuna_token');
      localStorage.removeItem('gashuna_user');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }

    if (status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    }

    if (status && status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.put('/auth/change-password', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, data: { newPassword: string; confirmPassword: string }) =>
    api.put(`/auth/reset-password/${token}`, data),
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) =>
    api.put('/auth/update-profile', data),
};

// ── Rooms ─────────────────────────────────────────────────────
export const roomsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/rooms', { params }),
  getAvailable: (params: { checkIn: string; checkOut: string; capacity?: number; type?: string }) =>
    api.get('/rooms/available', { params }),
  getById: (id: string) => api.get(`/rooms/${id}`),
  getStats: () => api.get('/rooms/stats'),
  create: (data: Record<string, unknown>) => api.post('/rooms', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/rooms/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/rooms/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/rooms/${id}`),
};

// ── Room Types ────────────────────────────────────────────────
export const roomTypesAPI = {
  getAll: () => api.get('/room-types'),
  getBySlug: (slug: string) => api.get(`/room-types/${slug}`),
  create: (data: Record<string, unknown>) => api.post('/room-types', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/room-types/${id}`, data),
  delete: (id: string) => api.delete(`/room-types/${id}`),
};

// ── Guests ────────────────────────────────────────────────────
export const guestsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/guests', { params }),
  getById: (id: string) => api.get(`/guests/${id}`),
  getBookings: (id: string) => api.get(`/guests/${id}/bookings`),
  getStats: () => api.get('/guests/stats'),
  create: (data: Record<string, unknown>) => api.post('/guests', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/guests/${id}`, data),
  addLoyaltyPoints: (id: string, points: number, reason?: string) =>
    api.patch(`/guests/${id}/loyalty`, { points, reason }),
  toggleVIP: (id: string) => api.patch(`/guests/${id}/vip`),
  delete: (id: string) => api.delete(`/guests/${id}`),
};

// ── Bookings ──────────────────────────────────────────────────
export const bookingsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  getStats: (params?: { month?: number; year?: number }) => api.get('/bookings/stats', { params }),
  create: (data: Record<string, unknown>) => api.post('/bookings', data),
  confirm: (id: string) => api.patch(`/bookings/${id}/confirm`),
  cancel: (id: string, reason?: string) =>
    api.patch(`/bookings/${id}/cancel`, { cancellationReason: reason }),
  checkIn: (id: string) => api.patch(`/bookings/${id}/checkin`),
  checkOut: (id: string) => api.patch(`/bookings/${id}/checkout`),
  updatePayment: (id: string, data: Record<string, unknown>) =>
    api.patch(`/bookings/${id}/payment`, data),
  delete: (id: string) => api.delete(`/bookings/${id}`),
};

// ── Check-ins ─────────────────────────────────────────────────
export const checkInsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/checkins', { params }),
  getActive: () => api.get('/checkins/active'),
  getById: (id: string) => api.get(`/checkins/${id}`),
  getByBooking: (bookingId: string) => api.get(`/checkins/booking/${bookingId}`),
  checkIn: (data: Record<string, unknown>) => api.post('/checkins', data),
  checkOut: (id: string, data: Record<string, unknown>) =>
    api.patch(`/checkins/${id}/checkout`, data),
  updateDeposit: (id: string, data: Record<string, unknown>) =>
    api.patch(`/checkins/${id}/deposit`, data),
};

// ── Chapa Payments ────────────────────────────────────────────
export const chapaAPI = {
  initialize: (data: Record<string, unknown>) => api.post('/chapa/initialize', data),
  verify: (txRef: string) => api.get(`/chapa/verify/${txRef}`),
  getPayments: (params?: Record<string, unknown>) => api.get('/chapa/payments', { params }),
  refund: (id: string, data: Record<string, unknown>) => api.post(`/chapa/refund/${id}`, data),
};

// ── Invoices ──────────────────────────────────────────────────
export const invoicesAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/invoices', { params }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  getByBooking: (bookingId: string) => api.get(`/invoices/booking/${bookingId}`),
  getStats: (params?: Record<string, unknown>) => api.get('/invoices/stats', { params }),
  create: (data: Record<string, unknown>) => api.post('/invoices', data),
  addItem: (id: string, item: Record<string, unknown>) =>
    api.post(`/invoices/${id}/items`, item),
  removeItem: (id: string, itemIndex: number) =>
    api.delete(`/invoices/${id}/items/${itemIndex}`),
  issue: (id: string) => api.patch(`/invoices/${id}/issue`),
  markPaid: (id: string, data: Record<string, unknown>) =>
    api.patch(`/invoices/${id}/pay`, data),
  cancel: (id: string, reason?: string) =>
    api.patch(`/invoices/${id}/cancel`, { reason }),
  email: (id: string) => api.post(`/invoices/${id}/email`),
};

// ── Payments ──────────────────────────────────────────────────
export const paymentsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/payments', { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  getStats: () => api.get('/payments/stats'),
  createManual: (data: Record<string, unknown>) => api.post('/payments', data),
  refund: (id: string, data: Record<string, unknown>) =>
    api.patch(`/payments/${id}/refund`, data),
};

// ── Menu ──────────────────────────────────────────────────────
export const menuAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/menu', { params }),
  getById: (id: string) => api.get(`/menu/${id}`),
  getStats: () => api.get('/menu/stats'),
  create: (data: Record<string, unknown>) => api.post('/menu', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/menu/${id}`, data),
  toggleAvailability: (id: string) => api.patch(`/menu/${id}/availability`),
  togglePopular: (id: string) => api.patch(`/menu/${id}/popular`),
  delete: (id: string) => api.delete(`/menu/${id}`),
};

// ── Food Orders ───────────────────────────────────────────────
export const foodOrdersAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/food-orders', { params }),
  getActive: () => api.get('/food-orders/active'),
  getById: (id: string) => api.get(`/food-orders/${id}`),
  getStats: () => api.get('/food-orders/stats'),
  create: (data: Record<string, unknown>) => api.post('/food-orders', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/food-orders/${id}/status`, { status }),
  markPaid: (id: string) => api.patch(`/food-orders/${id}/pay`),
};

// ── Staff ─────────────────────────────────────────────────────
export const staffAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/staff', { params }),
  getById: (id: string) => api.get(`/staff/${id}`),
  getStats: () => api.get('/staff/stats'),
  create: (data: Record<string, unknown>) => api.post('/staff', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/staff/${id}`, data),
  updateStatus: (id: string, status: string, terminationDate?: string) =>
    api.patch(`/staff/${id}/status`, { status, terminationDate }),
  updateSalary: (id: string, salary: number, reason?: string) =>
    api.patch(`/staff/${id}/salary`, { salary, reason }),
  delete: (id: string) => api.delete(`/staff/${id}`),
};

// ── Attendance ────────────────────────────────────────────────
export const attendanceAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/attendance', { params }),
  getToday: () => api.get('/attendance/today'),
  getByStaff: (staffId: string, params?: Record<string, unknown>) =>
    api.get(`/attendance/staff/${staffId}`, { params }),
  getMonthlySummary: (params?: Record<string, unknown>) =>
    api.get('/attendance/monthly', { params }),
  create: (data: Record<string, unknown>) => api.post('/attendance', data),
  clockIn: (id: string) => api.patch(`/attendance/${id}/clockin`),
  clockOut: (id: string) => api.patch(`/attendance/${id}/clockout`),
  approveLeave: (id: string) => api.patch(`/attendance/${id}/approve`),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/attendance/${id}`, data),
};

// ── Payroll ───────────────────────────────────────────────────
export const payrollAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/payroll', { params }),
  getById: (id: string) => api.get(`/payroll/${id}`),
  getStats: (params?: Record<string, unknown>) => api.get('/payroll/stats', { params }),
  getByStaff: (staffId: string) => api.get(`/payroll/staff/${staffId}`),
  generate: (month: number, year: number) =>
    api.post('/payroll/generate', { month, year }),
  create: (data: Record<string, unknown>) => api.post('/payroll', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/payroll/${id}`, data),
  approve: (id: string) => api.patch(`/payroll/${id}/approve`),
  markPaid: (id: string, paymentMethod: string) =>
    api.patch(`/payroll/${id}/pay`, { paymentMethod }),
  delete: (id: string) => api.delete(`/payroll/${id}`),
};

// ── Inventory ─────────────────────────────────────────────────
export const inventoryAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/inventory', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getById: (id: string) => api.get(`/inventory/${id}`),
  getStats: () => api.get('/inventory/stats'),
  create: (data: Record<string, unknown>) => api.post('/inventory', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/inventory/${id}`, data),
  updateStock: (id: string, data: Record<string, unknown>) =>
    api.patch(`/inventory/${id}/stock`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`),
  getTransactions: (params?: Record<string, unknown>) =>
    api.get('/inventory-transactions', { params }),
  getItemTransactions: (itemId: string) =>
    api.get(`/inventory-transactions/item/${itemId}`),
};

// ── Services ──────────────────────────────────────────────────
export const servicesAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/services', { params }),
  getById: (id: string) => api.get(`/services/${id}`),
  getStats: () => api.get('/services/stats'),
  create: (data: Record<string, unknown>) => api.post('/services', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/services/${id}`, data),
  toggleAvailability: (id: string) =>
    api.patch(`/services/${id}/availability`),
  delete: (id: string) => api.delete(`/services/${id}`),
};

// ── Service Requests ──────────────────────────────────────────
export const serviceRequestsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/service-requests', { params }),
  getById: (id: string) => api.get(`/service-requests/${id}`),
  getStats: () => api.get('/service-requests/stats'),
  create: (data: Record<string, unknown>) => api.post('/service-requests', data),
  confirm: (id: string, data?: Record<string, unknown>) =>
    api.patch(`/service-requests/${id}/confirm`, data),
  assign: (id: string, staffId: string) =>
    api.patch(`/service-requests/${id}/assign`, { staffId }),
  start: (id: string) => api.patch(`/service-requests/${id}/start`),
  complete: (id: string, notes?: string) =>
    api.patch(`/service-requests/${id}/complete`, { notes }),
  cancel: (id: string, reason?: string) =>
    api.patch(`/service-requests/${id}/cancel`, { cancellationReason: reason }),
};

// ── Housekeeping ──────────────────────────────────────────────
export const housekeepingAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/housekeeping', { params }),
  getPending: () => api.get('/housekeeping/pending'),
  getById: (id: string) => api.get(`/housekeeping/${id}`),
  create: (data: Record<string, unknown>) => api.post('/housekeeping', data),
  assign: (id: string, staffId: string) =>
    api.patch(`/housekeeping/${id}/assign`, { staffId }),
  start: (id: string) => api.patch(`/housekeeping/${id}/start`),
  complete: (id: string, checklist?: unknown[]) =>
    api.patch(`/housekeeping/${id}/complete`, { checklist }),
  inspect: (id: string, data: Record<string, unknown>) =>
    api.patch(`/housekeeping/${id}/inspect`, data),
  updateChecklist: (id: string, itemIndex: number, isCompleted: boolean) =>
    api.patch(`/housekeeping/${id}/checklist`, { itemIndex, isCompleted }),
};

// ── Maintenance ───────────────────────────────────────────────
export const maintenanceAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/maintenance', { params }),
  getById: (id: string) => api.get(`/maintenance/${id}`),
  getStats: () => api.get('/maintenance/stats'),
  create: (data: Record<string, unknown>) => api.post('/maintenance', data),
  assign: (id: string, staffId: string) =>
    api.patch(`/maintenance/${id}/assign`, { staffId }),
  start: (id: string) => api.patch(`/maintenance/${id}/start`),
  resolve: (id: string, data: Record<string, unknown>) =>
    api.patch(`/maintenance/${id}/resolve`, data),
  close: (id: string) => api.patch(`/maintenance/${id}/close`),
  cancel: (id: string) => api.patch(`/maintenance/${id}/cancel`),
};

// ── Reports ───────────────────────────────────────────────────
export const reportsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/reports', { params }),
  getById: (id: string) => api.get(`/reports/${id}`),
  generateRevenue: (data: { month: number; year: number }) =>
    api.post('/reports/generate/revenue', data),
  generateOccupancy: (data: { month: number; year: number }) =>
    api.post('/reports/generate/occupancy', data),
  generateGuests: (data: { month: number; year: number }) =>
    api.post('/reports/generate/guests', data),
  generatePayroll: (data: { month: number; year: number }) =>
    api.post('/reports/generate/payroll', data),
  generateInventory: () => api.post('/reports/generate/inventory', {}),
  delete: (id: string) => api.delete(`/reports/${id}`),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  getById: (id: string) => api.get(`/notifications/${id}`),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications/clear-read'),
  broadcast: (data: Record<string, unknown>) =>
    api.post('/notifications/broadcast', data),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getQuickStats: () => api.get('/dashboard/quick-stats'),
};

// ── Settings ──────────────────────────────────────────────────
export const settingsAPI = {
  getHotelSettings: () => api.get('/settings'),
  getUsers: (params?: Record<string, unknown>) =>
    api.get('/settings/users', { params }),
  getUserById: (id: string) => api.get(`/settings/users/${id}`),
  createUser: (data: Record<string, unknown>) =>
    api.post('/settings/users', data),
  updateUser: (id: string, data: Record<string, unknown>) =>
    api.put(`/settings/users/${id}`, data),
  resetPassword: (id: string, newPassword: string) =>
    api.patch(`/settings/users/${id}/reset-password`, { newPassword }),
  toggleUserStatus: (id: string) =>
    api.patch(`/settings/users/${id}/toggle-status`),
  deleteUser: (id: string) => api.delete(`/settings/users/${id}`),
};

// ── Audit Logs ────────────────────────────────────────────────
export const auditLogsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/audit-logs', { params }),
  getById: (id: string) => api.get(`/audit-logs/${id}`),
  getStats: () => api.get('/audit-logs/stats'),
  getByUser: (userId: string, params?: Record<string, unknown>) =>
    api.get(`/audit-logs/user/${userId}`, { params }),
  getByResource: (params?: Record<string, unknown>) =>
    api.get('/audit-logs/resource', { params }),
  clear: (daysOld: number) =>
    api.delete('/audit-logs/clear', { data: { daysOld } }),
};

// ── AI ────────────────────────────────────────────────────────
export const aiAPI = {
  health: () => api.get('/ai/health'),
  startChat: (data?: { guestId?: string; language?: string }) =>
    api.post('/ai/chat/session/start', data),
  sendMessage: (data: { sessionId: string; message: string; guestId?: string }) =>
    api.post('/ai/chat/message', data),
  sendAdminMessage: (data: { sessionId: string; message: string }) =>
    api.post('/ai/chat/admin/message', data),
  getChatHistory: (sessionId: string) =>
    api.get(`/ai/chat/history/${sessionId}`),
  endChat: (sessionId: string) =>
    api.patch(`/ai/chat/session/${sessionId}/end`),
  submitFeedback: (data: Record<string, unknown>) =>
    api.post('/ai/chat/feedback', data),
  getConversations: (params?: Record<string, unknown>) =>
    api.get('/ai/chat/admin/conversations', { params }),
  getChatStats: () => api.get('/ai/chat/admin/stats'),
  startVoice: (data?: Record<string, unknown>) =>
    api.post('/ai/voice/session/start', data),
  processVoice: (data: { sessionId: string; audioData: string; language?: string }) =>
    api.post('/ai/voice/process', data),
  textToSpeech: (text: string, voice?: string) =>
    api.post('/ai/voice/text-to-speech', { text, voice }, { responseType: 'arraybuffer' }),
  getVoiceHistory: (sessionId: string) =>
    api.get(`/ai/voice/history/${sessionId}`),
  endVoice: (sessionId: string) =>
    api.patch(`/ai/voice/session/${sessionId}/end`),
  getOccupancyPrediction: () => api.get('/ai/predictions/occupancy'),
  getRevenuePrediction: () => api.get('/ai/predictions/revenue'),
  getPredictionInsights: () => api.get('/ai/predictions/insights'),
  analyzeSentiment: (text: string) =>
    api.post('/ai/predictions/sentiment', { text }),
  getBookingTrends: (params?: Record<string, unknown>) =>
    api.get('/ai/predictions/trends/bookings', { params }),
  getRevenueTrends: (params?: Record<string, unknown>) =>
    api.get('/ai/predictions/trends/revenue', { params }),
  getGuestAnalytics: () => api.get('/ai/predictions/analytics/guests'),
  getRoomRecommendations: (data: Record<string, unknown>) =>
    api.post('/ai/predictions/recommendations/rooms', data),
  getGuestInsights: (guestId: string) =>
    api.get(`/ai/predictions/recommendations/guest/${guestId}`),
  getPopularRooms: () => api.get('/ai/predictions/recommendations/popular'),
  getUpsellOpportunities: (guestId: string) =>
    api.get(`/ai/predictions/upsell/${guestId}`),
};

// ── Upload ────────────────────────────────────────────────────
export const uploadAPI = {
  uploadRoomImages: (roomId: string, formData: FormData) =>
    api.post(`/upload/rooms/${roomId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadStaffPhoto: (staffId: string, formData: FormData) =>
    api.post(`/upload/staff/${staffId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadMenuPhoto: (menuId: string, formData: FormData) =>
    api.post(`/upload/menu/${menuId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadGallery: (formData: FormData) =>
    api.post('/upload/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteRoomImage: (roomId: string, imageUrl: string) =>
    api.delete(`/upload/rooms/${roomId}/image`, { data: { imageUrl } }),
  deleteFile: (fileUrl: string) =>
    api.delete('/upload/file', { data: { fileUrl } }),
};
