/**
 * Patel Car'spa & Detailing Studio Complete TypeScript Definitions
 */

export type VehicleType =
  | "Small Sedan"
  | "Pickup"
  | "SUV"
  | "Minibus"
  | "Bike";

export type PlanType = "Basic Wash" | "Premium Wash" | "Full Detailing";

export type BookingStatus =
  | "confirmed"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled";

export type UserRole = "customer" | "admin";

export type ServiceCategory = "wash" | "detailing" | "bike";

// Core User Interface
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
  cleanCoins: number;
  referralCode: string;
  referredBy?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Booking Interface
export interface IBooking {
  _id: string;
  bookingId: string;
  userId: string | IUser;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  service: string;
  plan: PlanType;
  vehicleType: VehicleType;
  vehicleNumber: string;
  date: string;
  timeSlot: string;
  address?: string;
  notes?: string;
  basePrice: number;
  coinsUsed: number;
  discount: number;
  finalPrice: number;
  status: BookingStatus;
  qrCode?: string;
  whatsappSent: {
    bookingConfirmed: boolean;
    ready: boolean;
    reminder: boolean;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Clean Coins Transaction Interface
export interface ICoinTransaction {
  _id: string;
  userId: string;
  type: "earned" | "redeemed";
  amount: number;
  reason: string;
  bookingId?: string | null;
  createdAt: string | Date;
}

// Promo Coupon Interface (DEPRECATED — superseded by IPromoCode below; retained for migration only)
export interface ICoupon {
  _id?: string;
  id?: string;
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrderValue?: number;
  validFrom?: string | Date;
  validUntil: string | Date;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Promo Code Discount Type
export type DiscountType = "FLAT" | "PERCENTAGE";

// Promo Code — admin-configurable discount code (replaces the legacy ICoupon)
export interface IPromoCode {
  _id?: string;
  id?: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minBookingAmount?: number | null;
  expiryDate: string;
  isActive: boolean;
  // Key setting for the FIRST50 bug: how many times ONE user may redeem this code.
  usageLimitPerUser: number;
  // Optional cap on total redemptions across all users.
  totalUsageLimit?: number | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Promo Code Usage — one record per redemption, for limit enforcement & history.
export interface IPromoCodeUsage {
  _id?: string;
  id?: string;
  promoCodeId: string;
  promoCode: string; // denormalized for quick display
  userId: string;
  userName: string; // denormalized for quick display
  bookingId: string;
  bookingRef: string; // denormalized CW-XXXX for quick display
  usedAt: string | Date;
}

// Service Catalogue Item
export interface ServiceItem {
  id: string;
  title: string;
  category: ServiceCategory;
  description: string;
  iconName: string;
  duration: string;
  popular?: boolean;
}

// Membership Pass Item
export interface MembershipItem {
  id: string;
  title: string;
  price: number;
  washesCount: number;
  validity: string;
  savingsPercent: string;
  popular?: boolean;
  features: string[];
}

// Pricing Plan Details
export interface PricingPlanDetails {
  name: PlanType;
  tagline: string;
  badge?: string;
  isFixedPrice: boolean;
  fixedPrice?: number;
  prices?: Record<VehicleType, number>;
  features: string[];
  turnaround: string;
  warranty?: string;
}

// API Response Wrappers
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Booking Form State Interface
export interface BookingFormData {
  service: string;
  plan: PlanType;
  vehicleType: VehicleType;
  vehicleNumber: string;
  date: string;
  timeSlot: string;
  address?: string;
  notes?: string;
  useCleanCoins: boolean;
  couponCode?: string;
}

// Re-export Employee Panel Staff Types
export * from "./staff";

