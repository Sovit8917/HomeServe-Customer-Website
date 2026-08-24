export interface User {
  id: string;
  phone?: string;
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
  // Extra photos for the Gallery tab (image above is the primary/hero
  // photo shown on cards) — empty unless an admin has uploaded some.
  images?: string[];
  // Optional demo/walkthrough video for the Gallery tab.
  videoUrl?: string;
  basePrice: number;
  originalPrice?: number;
  discountPercent?: number;
  priceType: string;
  duration: number;
  isActive: boolean;
  category?: Category;
  rating?: number;
  avgRating?: number;
  averageRating?: number;
  totalReviews?: number;
  viewedAt?: string;
  includedItems?: string[] | string;
  excludedItems?: string[] | string;
  includes?: string[] | string;
  excludes?: string[] | string;
  included?: string[] | string;
  excluded?: string[] | string;
  inclusions?: string[] | string;
  exclusions?: string[] | string;
  whatsIncluded?: string[] | string;
  whatsNotIncluded?: string[] | string;
}

export interface CartItem {
  id: string;
  serviceId: string;
  quantity: number;
  available: boolean;
  price: number;
  service: Service | null;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  unavailableCount: number;
}

export type RecurringFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface RecurringBookingItem {
  serviceId: string;
  quantity: number;
}

export interface RecurringBooking {
  id: string;
  userId: string;
  items: RecurringBookingItem[];
  frequency: RecurringFrequency;
  scheduledTime: string;
  nextRunDate: string;
  isActive: boolean;
  addressId?: string;
  description?: string;
  preferredWorkerId?: string;
  lastBookingId?: string;
  lastRunAt?: string;
  lastRunError?: string;
  createdAt: string;
}

export interface FailedPayment {
  paymentId: string;
  bookingId: string;
  bookingNumber: string;
  amount: number;
  method: string;
  failedAt: string;
  canRetry: boolean;
}

export interface ServiceReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: { name?: string; avatar?: string };
}

export interface SavedCard {
  id: string;
  userId: string;
  last4: string;
  network?: string;
  cardholderName?: string;
  createdAt: string;
}

export interface PreBookingThread {
  counterpartId: string;
  counterpartName?: string;
  counterpartAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageFromMe: boolean;
  unreadCount: number;
}

export interface PreBookingMessage {
  id: string;
  userId: string;
  workerId: string;
  senderType: 'USER' | 'WORKER';
  message: string;
  isRead: boolean;
  createdAt: string;
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
  contactPhone?: string;
  contactName?: string;
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
  // Reschedule
  rescheduleCount?: number;
  previousScheduledDate?: string;
  previousScheduledTime?: string;
  pendingRescheduleDate?: string;
  pendingRescheduleTime?: string;
  // Completion proof photos, uploaded by the worker
  proofBeforePhotos?: string[];
  proofAfterPhotos?: string[];
  // Extra charge / extra time requests
  extraCharges?: ExtraChargeRequest[];
  extraTimeRequests?: ExtraTimeRequest[];
  bookingNumber?: string;
  // 4-digit code the customer reads out to the worker to start the job.
  // Only ever present for the customer's own booking, only while relevant.
  startOtp?: string;
  startedAt?: string;
  completedAt?: string;
  // Set when the worker reports they're running late for this job.
  runningLateAt?: string;
  runningLateReason?: string;
}

export type BookingTimelineEventType =
  | 'CREATED' | 'WORKER_DECLINED' | 'ACCEPTED' | 'RESCHEDULED'
  | 'RUNNING_LATE' | 'REASSIGNED_NO_SHOW' | 'STARTED' | 'COMPLETED'
  | 'CANCELLED' | 'REJECTED';

export interface BookingTimelineEvent {
  type: BookingTimelineEventType;
  label: string;
  at: string;
}

export interface BookingTimeline {
  bookingId: string;
  bookingNumber: string;
  events: BookingTimelineEvent[];
}

export type ExtraChargeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ExtraChargePaymentStatus = 'NOT_REQUIRED' | 'PENDING' | 'PAID';

export interface ExtraChargeRequest {
  id: string;
  bookingId: string;
  workerId: string;
  label: string;
  amount: number;
  reason?: string;
  photos?: string[];
  status: ExtraChargeStatus;
  paymentStatus: ExtraChargePaymentStatus;
  // How much of `amount` the worker collected in cash on-site (CASH-method
  // bookings only) — the remainder (amount - cashCollected) is what's
  // still owed online. 0/undefined means fully online or fully cash,
  // matching the pre-split behaviour.
  cashCollected?: number;
  respondedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export type ExtraTimeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ExtraTimeRequest {
  id: string;
  bookingId: string;
  workerId: string;
  requestedMinutes: number;
  graceMinutesApplied: number;
  chargeableMinutes: number;
  amount: number;
  reason?: string;
  status: ExtraTimeStatus;
  paymentStatus: ExtraChargePaymentStatus;
  respondedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface AvailabilitySlot {
  time: string;
  status: 'FREE' | 'BOOKED' | 'UNAVAILABLE';
  declineRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CancellationPreview {
  isCancellable: boolean;
  isPaid: boolean;
  paidAmount?: number;
  refundAmount?: number;
  feeAmount?: number;
  feePercent?: number;
  reasonCode?: string;
  note?: string;
}

export interface BookingPricePreview {
  items: { serviceId: string; quantity: number; price: number }[];
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  couponId?: string;
  subscriptionUpsell?: any;
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
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  createdAt?: string;
  booking?: { bookingNumber: string; status: BookingStatus };
}

export interface RefundEntry {
  id: string;
  bookingId: string;
  paymentId: string;
  amount: number;
  destination: 'ORIGINAL' | 'WALLET';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  reason?: string;
  createdAt: string;
  completedAt?: string;
  booking?: { bookingNumber: string };
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
  // Structured payload the backend attaches per notification type — e.g.
  // { bookingId }, { bookingId, disputeId }, { bookingId, extraTimeRequestId },
  // { serviceId }. Used to deep-link the notification to the right screen.
  data?: Record<string, any> | null;
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

export interface Banner {
  id: string;
  title: string;
  image: string;
  link?: string;
  sortOrder: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  discountPercent: number;
  maxDiscountPerBooking?: number;
  isActive: boolean;
  sortOrder: number;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  companyName: string;
  companyGstNumber?: string;
  customerName: string;
  customerGstNumber?: string;
  placeOfSupply?: string;
  paymentMethod: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  booking?: Booking;
}

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED_REFUNDED'
  | 'RESOLVED_PARTIAL_REFUND'
  | 'RESOLVED_UPHELD'
  | 'RESOLVED_NO_ACTION'
  | 'WITHDRAWN';

export type DisputeReason =
  | 'SERVICE_NOT_AS_DESCRIBED'
  | 'WORKER_NO_SHOW'
  | 'OVERCHARGED'
  | 'DUPLICATE_CHARGE'
  | 'UNAUTHORIZED_CHARGE'
  | 'DAMAGE_OR_LOSS'
  | 'EXTRA_CHARGE_UNJUSTIFIED'
  | 'REFUND_NOT_RECEIVED'
  | 'OTHER';

export interface Dispute {
  id: string;
  bookingId: string;
  raisedByType: 'CUSTOMER' | 'WORKER';
  reason: DisputeReason;
  description: string;
  amountClaimed?: number;
  evidenceUrls?: string[];
  status: DisputeStatus;
  resolutionNote?: string;
  refundAmount?: number;
  booking?: Booking;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  plan: SubscriptionPlan;
}
