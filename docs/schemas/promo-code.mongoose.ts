// ============================================================================
// Mongoose Schema Definition: PromoCode & PromoCodeUsage
// Save as models/PromoCode.ts and models/PromoCodeUsage.ts when migrating to MongoDB
// ============================================================================

import mongoose, { Schema, Document } from "mongoose";

export enum DiscountType {
  FLAT = "FLAT",
  PERCENTAGE = "PERCENTAGE",
}

export interface IPromoCodeDoc extends Document {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minBookingAmount?: number;
  expiryDate: Date;
  isActive: boolean;
  usageLimitPerUser: number;
  totalUsageLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const PromoCodeSchema = new Schema<IPromoCodeDoc>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: Object.values(DiscountType),
      required: true,
      default: DiscountType.FLAT,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minBookingAmount: {
      type: Number,
      default: null,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // THE KEY FIX: Configurable per-user limit (1 = once per user)
    usageLimitPerUser: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    totalUsageLimit: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

export const PromoCode =
  mongoose.models.PromoCode ||
  mongoose.model<IPromoCodeDoc>("PromoCode", PromoCodeSchema);

// ============================================================================
// PromoCodeUsage Schema (Redemption History)
// ============================================================================

export interface IPromoCodeUsageDoc extends Document {
  promoCodeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  usedAt: Date;
}

export const PromoCodeUsageSchema = new Schema<IPromoCodeUsageDoc>({
  promoCodeId: {
    type: Schema.Types.ObjectId,
    ref: "PromoCode",
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
    unique: true,
  },
  usedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for lightning-fast enforcement:
// PromoCodeUsage.countDocuments({ promoCodeId, userId })
PromoCodeUsageSchema.index({ promoCodeId: 1, userId: 1 });

export const PromoCodeUsage =
  mongoose.models.PromoCodeUsage ||
  mongoose.model<IPromoCodeUsageDoc>("PromoCodeUsage", PromoCodeUsageSchema);
