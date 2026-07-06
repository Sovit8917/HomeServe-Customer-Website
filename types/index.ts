export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  avatar?: string;
  role: 'CUSTOMER' | 'WORKER' | 'ADMIN';
  isActive: boolean;
  language: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { services: number };
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number;
  priceType: string;
  duration: number;
  isActive: boolean;
  category?: Category;
}

export interface Worker {
  id: string;
  name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  avatar?: string;
  bio?: string;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  isOnline: boolean;
  experience: number;
  serviceRadius: number;
  skills?: { skill: string }[];
  services?: { service: Service; price?: number }[];
}

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  address?: Address;
  worker?: Worker;
  items?: BookingItem[];
  payment?: Payment;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
}

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface BookingItem {
  id: string;
  service: Service;
  quantity: number;
  price: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: 'UPI' | 'CARD' | 'WALLET' | 'CASH';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  booking?: Booking;
  user?: User;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  type?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description?: string;
  createdAt: string;
}
