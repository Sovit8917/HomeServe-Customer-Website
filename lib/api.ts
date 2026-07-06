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
  getOne: (id: string) => api.get(`/services/${id}`),
};

// Workers
export const workersApi = {
  getNearby: (lat: number, lng: number, serviceId?: string) =>
    api.get('/workers/nearby', { params: { lat, lng, serviceId } }),
  getOne: (id: string) => api.get(`/workers/${id}`),
  getReviews: (id: string, page = 1, limit = 10) => api.get(`/workers/${id}/reviews`, { params: { page, limit } }),
};

// Bookings
export const bookingsApi = {
  create: (data: any) => api.post('/bookings', data),
  getMy: (status?: string) => api.get('/bookings/my', { params: { status } }),
  getOne: (id: string) => api.get(`/bookings/${id}`),
  cancel: (id: string, reason: string) => api.put(`/bookings/${id}/cancel`, { reason }),
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
};

// Wallet
export const walletApi = {
  get: () => api.get('/wallet'),
  getTransactions: () => api.get('/wallet/transactions'),
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
};

// Chat
export const chatApi = {
  getBookingChats: () => api.get('/chat/bookings'),
  getMessages: (bookingId: string, page = 1, limit = 50) =>
    api.get(`/chat/${bookingId}/messages`, { params: { page, limit } }),
  sendMessage: (bookingId: string, message: string) =>
    api.post(`/chat/${bookingId}/messages`, { message }),
  getUnreadCount: (bookingId: string) => api.get(`/chat/${bookingId}/unread`),
};
