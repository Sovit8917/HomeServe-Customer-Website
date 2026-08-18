import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
// Root server URL (no /api/v1 suffix) — used for socket.io namespaces.
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || BASE_URL.replace(/\/api\/v1\/?$/, '');
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Upload (backend streams to AWS S3, returns a public URL)
export const uploadApi = {
  uploadSingle: (file: File, folder = 'avatars') => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/single?folder=${folder}`, formData);
  },
};

// Auth
// Twilio (and most SMS providers) require E.164 format; the UI only collects
// a plain 10-digit Indian number, so we normalize it here before every call.
const toE164 = (phone: string) => (phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`);

export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone: toE164(phone), role: 'CUSTOMER' }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone: toE164(phone), otp, role: 'CUSTOMER' }),
  getMe: () => api.get('/auth/me'),
};

// Categories
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getOne: (id: string) => api.get(`/categories/${id}`),
};

// Services
export const servicesApi = {
  getAll: (categoryId?: string) => api.get('/services', { params: { categoryId } }),
  getPopular: () => api.get('/services/popular'),
  getDeals: () => api.get('/services/deals'),
  getRecentViews: () => api.get('/services/recent-views'),
  trackView: (id: string) => api.post(`/services/${id}/view`),
  getOne: (id: string) => api.get(`/services/${id}`),
  getReviews: (id: string, page = 1, limit = 10) => api.get(`/services/${id}/reviews`, { params: { page, limit } }),
};

// Workers
export const workersApi = {
  getNearby: (lat: number, lng: number, serviceId?: string) =>
    api.get('/workers/nearby', { params: { lat, lng, serviceId } }),
  getOne: (id: string) => api.get(`/workers/${id}`),
  getReviews: (id: string, page = 1, limit = 10) => api.get(`/workers/${id}/reviews`, { params: { page, limit } }),
  // Per-slot availability heatmap (FREE/BOOKED/UNAVAILABLE + decline risk) for a worker on a given date.
  getAvailabilitySlots: (id: string, date: string) => api.get(`/workers/${id}/availability-slots`, { params: { date } }),
};

// Bookings
export const bookingsApi = {
  create: (data: any) => api.post('/bookings', data),
  // Server-side price preview (tax, coupon/subscription discount, subscription upsell) — mirrors create()'s pricing exactly.
  preview: (data: any) => api.post('/bookings/preview', data),
  getMy: (status?: string) => api.get('/bookings/my', { params: { status } }),
  getOne: (id: string) => api.get(`/bookings/${id}`),
  cancel: (id: string, reason: string, refundTo?: 'ORIGINAL' | 'WALLET') =>
    api.put(`/bookings/${id}/cancel`, { reason, refundTo }),
  reschedule: (id: string, scheduledDate: string, scheduledTime: string) =>
    api.put(`/bookings/${id}/reschedule`, { scheduledDate, scheduledTime }),
  respondToReschedule: (id: string, accept: boolean) =>
    api.put(`/bookings/${id}/reschedule/respond`, { accept }),
  respondToExtraCharge: (requestId: string, approve: boolean) =>
    api.post(`/bookings/extra-charge/${requestId}/respond`, { approve }),
  respondToExtraTime: (requestId: string, approve: boolean) =>
    api.post(`/bookings/extra-time/${requestId}/respond`, { approve }),
  raiseSos: (id: string, body: { latitude?: number; longitude?: number; message?: string }) =>
    api.post(`/bookings/${id}/sos`, body),
};

// Reviews
export const reviewsApi = {
  create: (data: any) => api.post('/reviews', data),
  getWorkerReviews: (workerId: string) => api.get(`/reviews/worker/${workerId}`),
};

// Users
export const usersApi = {
  updateProfile: (data: any) => api.put('/users/profile', data),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data: any) => api.post('/users/addresses', data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
  getSavedCards: () => api.get('/users/saved-cards'),
  deleteSavedCard: (id: string) => api.delete(`/users/saved-cards/${id}`),
};

// Wallet
export const walletApi = {
  get: () => api.get('/wallet'),
  getTransactions: (page = 1, limit = 20) => api.get('/wallet/transactions', { params: { page, limit } }),
  createTopupOrder: (amount: number) => api.post('/wallet/create-order', { amount }),
  verifyTopup: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; amount: number }) =>
    api.post('/wallet/verify', data),
};

// Notifications
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Coupons
export const couponsApi = {
  getActive: () => api.get('/coupons/active'),
  validate: (code: string, orderAmount: number) => api.post('/coupons/validate', { code, orderAmount }),
};

// Support
export const supportApi = {
  createTicket: (data: { subject: string; description: string }) => api.post('/support/tickets', data),
  getMyTickets: () => api.get('/support/tickets'),
  getTicket: (id: string) => api.get(`/support/tickets/${id}`),
  reply: (id: string, message: string) => api.post(`/support/tickets/${id}/reply`, { message }),
  closeTicket: (id: string) => api.put(`/support/tickets/${id}/close`),
  getFaqs: () => api.get('/support/faq'),
};

// Payments (Razorpay + wallet + cash)
export const paymentsApi = {
  createOrder: (bookingId: string) => api.post(`/payments/create-order/${bookingId}`),
  verify: (data: { bookingId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; method: string }) =>
    api.post('/payments/verify', data),
  payCash: (bookingId: string) => api.post(`/payments/cash/${bookingId}`),
  payFromWallet: (bookingId: string) => api.post(`/payments/wallet/${bookingId}`),
  getDetails: (bookingId: string) => api.get(`/payments/${bookingId}`),
  getPaymentHistory: (page = 1, limit = 20) => api.get('/payments/history/mine', { params: { page, limit } }),
  getRefundHistory: (page = 1, limit = 20) => api.get('/payments/refunds/mine', { params: { page, limit } }),
  previewCancellation: (bookingId: string) => api.get(`/payments/cancellation-preview/${bookingId}`),
  createExtraChargeOrder: (extraChargeRequestId: string) =>
    api.post(`/payments/extra-charge/${extraChargeRequestId}/create-order`),
  verifyExtraChargePayment: (data: { extraChargeRequestId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post('/payments/extra-charge/verify', data),
  createExtraTimeOrder: (extraTimeRequestId: string) =>
    api.post(`/payments/extra-time/${extraTimeRequestId}/create-order`),
  verifyExtraTimePayment: (data: { extraTimeRequestId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post('/payments/extra-time/verify', data),
};

// Chat
export const chatApi = {
  getBookingChats: () => api.get('/chat/bookings'),
  getMessages: (bookingId: string, page = 1, limit = 50) =>
    api.get(`/chat/${bookingId}/messages`, { params: { page, limit } }),
  sendMessage: (bookingId: string, message: string) =>
    api.post(`/chat/${bookingId}/messages`, { message }),
  getUnreadCount: (bookingId: string) => api.get(`/chat/${bookingId}/unread`),

  // Pre-booking chat — talk to a worker before making a booking.
  getPreBookingThreads: () => api.get('/chat/prebooking/threads'),
  getPreBookingMessages: (otherPartyId: string, page = 1, limit = 50) =>
    api.get(`/chat/prebooking/${otherPartyId}/messages`, { params: { page, limit } }),
  sendPreBookingMessage: (otherPartyId: string, message: string) =>
    api.post(`/chat/prebooking/${otherPartyId}/messages`, { message }),
  getPreBookingUnreadCount: (otherPartyId: string) => api.get(`/chat/prebooking/${otherPartyId}/unread`),
  markPreBookingRead: (otherPartyId: string) => api.post(`/chat/prebooking/${otherPartyId}/read`),
};

// Banners
export const bannersApi = {
  getActive: () => api.get('/banners'),
};

// Subscriptions
export const subscriptionsApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  getMy: () => api.get('/subscriptions/my'),
  createOrder: (planId: string) => api.post('/subscriptions/order', { planId }),
  verify: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post('/subscriptions/verify', data),
  cancel: () => api.post('/subscriptions/cancel'),
};

// Invoices
export const invoicesApi = {
  getAll: (page = 1, limit = 20) => api.get('/invoices', { params: { page, limit } }),
  getByBooking: (bookingId: string) => api.get(`/invoices/booking/${bookingId}`),
  getOne: (id: string) => api.get(`/invoices/${id}`),
  downloadPdf: (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

// Disputes
export const disputesApi = {
  raise: (data: { bookingId: string; reason: string; description: string; amountClaimed?: number; evidenceUrls?: string[] }) =>
    api.post('/disputes', data),
  getMy: (page = 1, limit = 20) => api.get('/disputes/mine', { params: { page, limit } }),
  getOne: (id: string) => api.get(`/disputes/${id}`),
  withdraw: (id: string) => api.post(`/disputes/${id}/withdraw`),
};

// AI Support
export interface AiChatTurn {
  role: 'user' | 'model';
  text: string;
}
export const aiSupportApi = {
  chat: (message: string, history: AiChatTurn[]) =>
    api.post('/ai-support/chat', { message, history }),
  escalate: (history: AiChatTurn[], subject?: string) =>
    api.post('/ai-support/escalate', { history, subject }),
};
