import { VehicleType, PlanType, ServiceItem } from "@/types";

/**
 * CleanPro Master Constants & Configurations
 */

export const SHOP_CONFIG = {
  name: process.env.NEXT_PUBLIC_SHOP_NAME || "CleanPro Car Wash & Detailing",
  phone: process.env.NEXT_PUBLIC_SHOP_PHONE || "+91 98765 43210",
  whatsappNumber: process.env.NEXT_PUBLIC_SHOP_WHATSAPP || "+919876543210",
  email: process.env.NEXT_PUBLIC_SHOP_EMAIL || "contact@cleanpro.com",
  address:
    process.env.NEXT_PUBLIC_SHOP_ADDRESS ||
    "Plot 42, Sector 18, Commercial Auto Hub, Gurugram, Haryana 122015",
  hours: "Monday – Sunday: 8:00 AM – 8:00 PM",
  mapsEmbedUrl:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ||
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.039290076219!2d77.0673!3d28.4795!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDI4JzQ2LjIiTiA3N8KwMDQnMDIuMyJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
  directionsUrl:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_DIRECTIONS_URL ||
    "https://maps.google.com/?q=28.4795,77.0673",
};

export const PAYMENT_CONFIG = {
  mode: "pay_at_shop" as const,
  methods: ["Cash", "UPI", "Card at Counter"],
  note: "Payment is collected at the shop after service completion.",
};

export const VEHICLE_TYPES: VehicleType[] = [
  "Small Sedan",
  "Pickup",
  "SUV",
  "Minibus",
  "Bike",
];

/**
 * CLIENT'S #1 CORE REQUIREMENT:
 * "For Basic/Normal wash, price is SAME for all vehicle types. Detailing prices may vary."
 *
 * - Basic Wash: ₹399 across Small Sedan, Pickup, SUV, Minibus, and Bike.
 * - Premium Wash & Full Detailing: tiered based on vehicle dimensions.
 */
export const PRICING_MATRIX: Record<
  PlanType,
  {
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
> = {
  "Basic Wash": {
    name: "Basic Wash",
    tagline: "Essential high-pressure foam bath & streak-free exterior finish",
    isFixedPrice: true,
    fixedPrice: 399, // Guaranteed identical price for all vehicle types!
    features: [
      "High-pressure snow foam pre-wash & rinse",
      "Hand wash with 2-bucket scratch-safe method",
      "Alloy rim face wash & tire scrubbing",
      "Hydrophobic streak-free window cleaning",
      "Exterior high-gloss tire gel dressing",
      "Air-blower drying of door seals & mirrors",
    ],
    turnaround: "25–30 mins",
  },
  "Premium Wash": {
    name: "Premium Wash",
    tagline: "Comprehensive deep clean inside and out for daily drivers",
    badge: "Most Popular",
    isFixedPrice: false,
    prices: {
      "Small Sedan": 699,
      Pickup: 799,
      SUV: 899,
      Minibus: 1099,
      Bike: 499,
    },
    features: [
      "Everything included in Basic Wash",
      "Complete cabin & boot deep vacuum extraction",
      "Dashboard, console & door cards wiped & sanitized",
      "Floor mat high-pressure wash & drying",
      "AC vent antibacterial steam blast & fresh scent",
      "Spray wax sealant coat for 30-day hydrophobic gloss",
    ],
    turnaround: "50–60 mins",
  },
  "Full Detailing": {
    name: "Full Detailing",
    tagline: "Showroom-grade paint correction, machine polish & ceramic guard",
    badge: "Ultimate Luxury",
    isFixedPrice: false,
    prices: {
      "Small Sedan": 2499,
      Pickup: 2999,
      SUV: 3499,
      Minibus: 4299,
      Bike: 1499,
    },
    features: [
      "Everything included in Premium Wash",
      "Iron decontamination & clay bar paint treatment",
      "Dual-action machine polish for swirl mark removal",
      "Interior upholstery & leather steam deep-extraction",
      "Ceramic spray sealant with 90-day gloss barrier",
      "Engine bay degreasing & protective dress",
      "Headlight restoration & crystal UV protection",
    ],
    turnaround: "3–4 hours",
    warranty: "90-Day Gloss Guarantee",
  },
};

/**
 * 9 Standard Services across Car Wash, Detailing & Bike categories
 */
export const SERVICES: ServiceItem[] = [
  // A) CAR WASH (basic)
  {
    id: "ext-foam-wash",
    title: "Exterior Foam Wash",
    category: "wash",
    description: "pH-neutral snow foam that encapsulates and lifts abrasive dirt safely without swirls.",
    iconName: "Droplets",
    duration: "25 mins",
    popular: true,
  },
  {
    id: "interior-vacuum",
    title: "Interior Vacuum",
    category: "wash",
    description: "High-power industrial vacuuming for all seats, carpets, trunk, and hidden storage pockets.",
    iconName: "Wind",
    duration: "20 mins",
  },
  {
    id: "tire-rim-cleaning",
    title: "Tire & Rim Cleaning",
    category: "wash",
    description: "Specialized brake dust iron dissolver, deep rim barrel brush scrub, and non-sling tire shine.",
    iconName: "Circle",
    duration: "15 mins",
  },
  {
    id: "window-cleaning",
    title: "Window Cleaning",
    category: "wash",
    description: "Ammonia-free glass cleaning formula safe for tinted films, delivering 100% streak-free optical clarity.",
    iconName: "Square",
    duration: "10 mins",
  },

  // B) CAR DETAILING (premium)
  {
    id: "full-body-polish",
    title: "Full Body Polish",
    category: "detailing",
    description: "Dual-action orbital machine compounding to remove micro-scratches, haze, and oxidation.",
    iconName: "Sparkles",
    duration: "2.5 hrs",
    popular: true,
  },
  {
    id: "ceramic-coating",
    title: "Ceramic Coating",
    category: "detailing",
    description: "Nano-SiO2 chemical bond shield providing extreme water beading, chemical resistance, and deep gloss.",
    iconName: "Shield",
    duration: "5 hrs",
  },
  {
    id: "interior-deep-clean",
    title: "Interior Deep Clean",
    category: "detailing",
    description: "140°C pressurized steam extraction, leather balm conditioning, and ozone odor elimination.",
    iconName: "Armchair",
    duration: "2 hrs",
  },
  {
    id: "paint-correction",
    title: "Paint Correction",
    category: "detailing",
    description: "Precision multi-stage paint leveling measuring paint thickness to eliminate up to 95% of defects.",
    iconName: "Paintbrush",
    duration: "4 hrs",
  },

  // C) BIKE WASH
  {
    id: "bike-wash",
    title: "Bike & Superbike Wash",
    category: "bike",
    description: "Gentle low-pressure foam rinse, chain degreasing & ultrasonic clean, O-ring safe lube & chrome polish.",
    iconName: "Bike",
    duration: "30 mins",
    popular: true,
  },
];

/**
 * Time Slots (9 AM to 6 PM in 1-hour slots)
 */
export const TIME_SLOTS: string[] = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "01:00 PM - 02:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
];

/**
 * Clean Coins Loyalty Program Rules
 */
export const LOYALTY_RULES = {
  // ₹100 spent = 10 Clean Coins
  RUPEES_FOR_TEN_COINS: 100,
  COINS_EARNED_PER_RUPEE: 0.1,
  // 100 coins = ₹50 discount
  COIN_REDEMPTION_VALUE: 0.5,
  MIN_COINS_TO_REDEEM: 50,
  REFERRAL_BONUS_COINS: 50,
};

/**
 * Monthly Membership Cards (Upsell)
 */
export const MEMBERSHIP_PLANS = [
  {
    id: "silver-pass",
    title: "CleanPass Silver",
    price: 999,
    washesCount: 4,
    validity: "30 Days",
    savingsPercent: "Save 38%",
    features: [
      "4 Exterior Snow Foam Washes",
      "1 Interior Deep Vacuuming",
      "Free Alloy Wheel & Tire Shine per wash",
      "Priority Queue Access (Skip the wait)",
      "Dedicated member WhatsApp line",
    ],
  },
  {
    id: "gold-pass",
    title: "CleanPass VIP Gold",
    price: 2499,
    washesCount: 12,
    validity: "90 Days",
    savingsPercent: "Save 52%",
    popular: true,
    features: [
      "12 Exterior & Interior Washes",
      "2 Machine Wax Polish Sessions",
      "1 Anti-Bacterial AC Steam Sterilization",
      "Complimentary Doorstep Pickup & Drop",
      "Valid across 2 registered household vehicles",
      "VIP Bay Booking anytime with 2-hour notice",
    ],
  },
];

/**
 * Trust Badges & Metrics
 */
export const TRUST_BADGES = [
  {
    title: "5-Star Rated Service",
    description: "Over 1,200+ 5-star customer reviews across Google & Justdial",
    iconName: "Star",
  },
  {
    title: "Eco-Friendly Chemistry",
    description: "Biodegradable, zero-phosphate wash shampoos safe for paint and environment",
    iconName: "Leaf",
  },
  {
    title: "Certified Detailers",
    description: "IDA-certified technicians trained in German paint correction standards",
    iconName: "Award",
  },
  {
    title: "100% Scratch-Free",
    description: "Plush 800 GSM microfiber mitts & grit-guard filter buckets",
    iconName: "ShieldCheck",
  },
];

/**
 * Customer Testimonials
 */
export const TESTIMONIALS = [
  {
    id: 1,
    name: "Vikram Malhotra",
    vehicle: "BMW 520d",
    rating: 5,
    comment:
      "CleanPro did a 3-stage paint correction and ceramic coat on my BMW. The car looks glossier than when it left the showroom. Incredible attention to detail!",
    date: "2 weeks ago",
  },
  {
    id: 2,
    name: "Pooja Sharma",
    vehicle: "Hyundai Creta",
    rating: 5,
    comment:
      "The interior deep clean is miraculous. My kids had spilled juice and snacks in the rear seats, and CleanPro made it look and smell brand new. Highly recommend!",
    date: "1 month ago",
  },
  {
    id: 3,
    name: "Aman Singhania",
    vehicle: "Ducati Monster 821",
    rating: 5,
    comment:
      "Finding people who know how to wash a superbike without damaging sensitive electronics is tough. CleanPro's bike wash is second to none.",
    date: "3 weeks ago",
  },
];
