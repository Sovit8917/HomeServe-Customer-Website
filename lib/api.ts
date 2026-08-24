import axios from 'axios';
import { useAuthStore } from '@/store/auth';

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

// Guards against the redirect-loop bug: previously a 401 only cleared the
// raw 'token'/'user' localStorage keys, but auth state actually also lives
// in zustand's persisted 'auth-store' key and in the 'token' cookie
// (store/auth.ts). Those were never cleared here, so after a redirect to
// /login, the (still-truthy) zustand `user` would immediately bounce the
// browser back to the protected page, which would call the API again with
// no Authorization header (since the raw key WAS gone), 401 again, redirect
// again — an infinite loop that hammered the API. Routing the 401 handler
// through the store's own logout() clears all three in one place, and the
// `loggingOut` flag stops concurrent in-flight 401s from re-triggering it.
let loggingOut = false;

const PROTECTED_PATHS = [
  '/checkout',
  '/cart',
  '/bookings',
  '/profile',
  '/wallet',
  '/chat',
  '/notifications',
  '/disputes',
  '/invoices',
  '/favorites',
  '/payments',
  '/recurring-bookings',
  '/onboarding',
  '/subscription/my',
  '/support',
];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined' && !loggingOut) {
      loggingOut = true;
      useAuthStore.getState().logout();
      const currentPath = window.location.pathname;
      if (PROTECTED_PATHS.some((p) => currentPath.startsWith(p))) {
        window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
      } else {
        loggingOut = false;
      }
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
// Normalize phone to plain digits (e.g. 9337012814) without country code prefix
const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 12 && cleaned.startsWith('91') ? cleaned.slice(2) : cleaned;
};

export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone: formatPhone(phone), role: 'CUSTOMER' }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone: formatPhone(phone), otp, role: 'CUSTOMER' }),
  getMe: () => api.get('/auth/me'),
  // Same three endpoints the mobile app calls (src/api/endpoints.ts) —
  // the website now talks to NestJS directly instead of Better Auth.
  googleLogin: (idToken: string) => api.post('/auth/google', { idToken }),
  emailRegister: (email: string, password: string, name: string) =>
    api.post('/auth/email/register', { email, password, name }),
  emailLogin: (email: string, password: string) =>
    api.post('/auth/email/login', { email, password }),
};

// Categories
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getOne: (id: string) => api.get(`/categories/${id}`),
};

// Services
export const servicesApi = {
  getAll: (params?: string | { categoryId?: string; search?: string; q?: string; sortBy?: string }) => {
    const queryParams = typeof params === 'string' ? { categoryId: params } : params;
    return api.get('/services', { params: queryParams });
  },
  getPopular: () => api.get('/services/popular'),
  getDeals: () => api.get('/services/deals'),
  getRecentViews: () => api.get('/services/recent-views'),
  trackView: (id: string) => api.post(`/services/${id}/view`),
  getOne: (id: string) => api.get(`/services/${id}`),
  getReviews: (id: string, page = 1, limit = 10) => api.get(`/services/${id}/reviews`, { params: { page, limit } }),
  // Search bar dropdown — service + category name matches for a partial query.
  getSearchSuggestions: (q: string, limit = 8) => api.get('/services/search-suggestions', { params: { q, limit } }),
  // "You might also like" — related services for the service detail page.
  getRelated: (id: string, limit = 10) => api.get(`/services/${id}/related`, { params: { limit } }),
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
  // Chronological event history (placed, accepted, running late, started,
  // completed, cancelled, etc.) for the "Booking Timeline" screen.
  getTimeline: (id: string) => api.get(`/bookings/${id}/timeline`),
  cancel: (id: string, reason: string, refundTo?: 'ORIGINAL' | 'WALLET') =>
    api.put(`/bookings/${id}/cancel`, { reason, refundTo }),
  reschedule: (id: string, scheduledDate: string, scheduledTime: string) =>
    api.put(`/bookings/${id}/reschedule`, { scheduledDate, scheduledTime }),
  respondToReschedule: (id: string, accept: boolean) =>
    api.put(`/bookings/${id}/reschedule/respond`, { accept }),
  respondToExtraCharge: (requestId: string, approve: boolean, cashCollected?: number) =>
    api.post(`/bookings/extra-charge/${requestId}/respond`, { approve, cashCollected }),
  respondToExtraTime: (requestId: string, approve: boolean) =>
    api.post(`/bookings/extra-time/${requestId}/respond`, { approve }),
  raiseSos: (id: string, body: { latitude?: number; longitude?: number; message?: string }) =>
    api.post(`/bookings/${id}/sos`, body),
  // Live-tracking share link — Uber-trip-share-style link a customer can
  // text to family. Creates the token on first call, reuses it after.
  getShareLink: (id: string) => api.post(`/bookings/${id}/share`),
};

// Public, unauthenticated lookup for a booking share link — a bare axios
// call (bypassing the `api` instance's auth interceptor) since whoever
// opens this link (e.g. a family member) is never logged in.
export const publicTrackingApi = {
  get: (token: string) => axios.get(`${BASE_URL}/bookings/track/${token}`),
};

// Server-authoritative tracking fallbacks for when the live-tracking
// socket hasn't connected yet or has dropped: last known worker
// location, and an approximate (explicitly `approximate: true`) ETA.
export const trackingApi = {
  getLastLocation: (bookingId: string) => api.get(`/tracking/booking/${bookingId}`),
  getEta: (bookingId: string) => api.get(`/tracking/booking/${bookingId}/eta`),
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
  updateAddress: (id: string, data: any) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
  updateFcmToken: (fcmToken: string) => api.put('/users/fcm-token', { fcmToken }),
  getSavedCards: () => api.get('/users/saved-cards'),
  // Step 1/2 of "Add Card": opens a ₹1 auth order to tokenize the card,
  // then verifies the payment signature and persists the token.
  createSaveCardOrder: () => api.post('/users/saved-cards/order'),
  verifySaveCard: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post('/users/saved-cards/verify', data),
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
  getFailedPayments: (page = 1, limit = 20) => api.get('/payments/failed/mine', { params: { page, limit } }),
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

// Cart — server-persisted, survives across devices/sessions
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (serviceId: string, quantity = 1) => api.post('/cart/items', { serviceId, quantity }),
  updateItem: (serviceId: string, quantity: number) => api.patch(`/cart/items/${serviceId}`, { quantity }),
  removeItem: (serviceId: string) => api.delete(`/cart/items/${serviceId}`),
  clear: () => api.delete('/cart'),
  checkout: (data: any) => api.post('/cart/checkout', data),
};

// Wishlist (services) — server-persisted favorites
export const wishlistApi = {
  getAll: () => api.get('/wishlist'),
  getIds: () => api.get('/wishlist/ids'),
  add: (serviceId: string) => api.post(`/wishlist/${serviceId}`),
  remove: (serviceId: string) => api.delete(`/wishlist/${serviceId}`),
};

// Favorite Workers — server-persisted favorites
export const favoriteWorkersApi = {
  getAll: () => api.get('/favorite-workers'),
  getIds: () => api.get('/favorite-workers/ids'),
  add: (workerId: string) => api.post(`/favorite-workers/${workerId}`),
  remove: (workerId: string) => api.delete(`/favorite-workers/${workerId}`),
};

// Recurring bookings
export const recurringBookingsApi = {
  create: (data: any) => api.post('/recurring-bookings', data),
  getMy: () => api.get('/recurring-bookings/my'),
  update: (id: string, data: any) => api.patch(`/recurring-bookings/${id}`, data),
  skipNext: (id: string) => api.post(`/recurring-bookings/${id}/skip-next`),
  pause: (id: string) => api.post(`/recurring-bookings/${id}/pause`),
  resume: (id: string) => api.post(`/recurring-bookings/${id}/resume`),
  cancel: (id: string) => api.post(`/recurring-bookings/${id}/cancel`),
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
