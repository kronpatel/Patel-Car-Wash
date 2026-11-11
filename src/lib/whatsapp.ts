import axios from "axios";
import { SHOP_CONFIG, PAYMENT_CONFIG } from "./constants";

export interface WhatsAppSendResult {
  success: boolean;
  provider: "ultramsg" | "cloud_api" | "mock";
  messageId?: string;
  error?: string;
}

/**
 * Standardizes international phone format for WhatsApp (e.g. +91 98765 43210 -> 919876543210)
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  // If 10-digit Indian number without country code, prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Sends a WhatsApp message using UltraMsg API (primary) with WhatsApp Cloud API fallback.
 * If credentials are not configured, logs the message safely in dev mode without crashing.
 */
export async function sendWhatsApp(
  toPhone: string,
  message: string
): Promise<WhatsAppSendResult> {
  const recipient = formatPhoneNumberForWhatsApp(toPhone);

  const ultraMsgInstance = process.env.ULTRAMSG_INSTANCE_ID;
  const ultraMsgToken = process.env.ULTRAMSG_TOKEN;

  // 1. PRIMARY: UltraMsg API
  if (
    ultraMsgInstance &&
    ultraMsgToken &&
    ultraMsgToken !== "your_ultramsg_token_here"
  ) {
    try {
      const response = await axios.post(
        `https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`,
        new URLSearchParams({
          token: ultraMsgToken,
          to: recipient,
          body: message,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 8000,
        }
      );

      if (response.data && (response.data.sent === "true" || response.data.id)) {
        return {
          success: true,
          provider: "ultramsg",
          messageId: response.data.id?.toString(),
        };
      }
    } catch (ultraError: unknown) {
      console.warn("UltraMsg dispatch failed, trying Cloud API fallback:", ultraError);
    }
  }

  // 2. FALLBACK: WhatsApp Cloud API (Meta Graph API)
  const cloudToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const cloudPhoneId = process.env.WHATSAPP_CLOUD_PHONE_ID;

  if (
    cloudToken &&
    cloudPhoneId &&
    cloudToken !== "your_facebook_graph_api_token"
  ) {
    try {
      const cloudResponse = await axios.post(
        `https://graph.facebook.com/v19.0/${cloudPhoneId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: { preview_url: false, body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${cloudToken}`,
            "Content-Type": "application/json",
          },
          timeout: 8000,
        }
      );

      if (cloudResponse.data?.messages?.[0]?.id) {
        return {
          success: true,
          provider: "cloud_api",
          messageId: cloudResponse.data.messages[0].id,
        };
      }
    } catch (cloudError: unknown) {
      console.error("WhatsApp Cloud API fallback also failed:", cloudError);
    }
  }

  // 3. DEV / MOCK FALLBACK
  console.log(`[WHATSAPP MOCK LOG] Sent to ${recipient}:\n${message}\n--------------------`);
  return {
    success: true,
    provider: "mock",
    messageId: `mock_${Date.now()}`,
  };
}

/**
 * Message #1: Sent automatically upon Booking Confirmation
 */
export async function sendBookingConfirmationWhatsApp(params: {
  customerName: string;
  phone: string;
  bookingId: string;
  vehicleType: string;
  vehicleNumber: string;
  date: string;
  timeSlot: string;
  plan: string;
  finalPrice: number;
}): Promise<WhatsAppSendResult> {
  const message = [
    `✅ *Booking Confirmed!*`,
    ``,
    `Hi ${params.customerName}, your wash appointment is booked at *Patel car'spa & Detailing*.`,
    ``,
    `📋 *Booking ID:* ${params.bookingId}`,
    `🚗 *Vehicle:* ${params.vehicleType} (${params.vehicleNumber})`,
    `📅 *Date:* ${params.date}`,
    `⏰ *Time Slot:* ${params.timeSlot}`,
    `✨ *Plan:* ${params.plan}`,
    `💵 *Estimated Total:* ₹${params.finalPrice}`,
    ``,
    `📍 *Location:* ${SHOP_CONFIG.address}`,
    `💵 *Payment Note:* ${PAYMENT_CONFIG.note}`,
    `💡 *No advance payment needed. Just show this Booking ID at the shop.*`,
    ``,
    `We'll notify you on WhatsApp as soon as your vehicle is washed & ready! 🚗✨`,
    `— *Patel car'spa & Detailing*`,
  ].join("\n");

  return sendWhatsApp(params.phone, message);
}

/**
 * Message #2: Sent when Owner clicks "Mark Ready" in Admin Dashboard
 */
export async function sendVehicleReadyWhatsApp(params: {
  customerName: string;
  phone: string;
  bookingId: string;
  vehicleType: string;
  vehicleNumber: string;
  finalPrice: number;
}): Promise<WhatsAppSendResult> {
  const message = [
    `🎉 *Your Vehicle is READY for Pickup!*`,
    ``,
    `Hi ${params.customerName}, your ${params.vehicleType} (${params.vehicleNumber}) is sparkling clean, inspected, and ready! 🚗✨`,
    ``,
    `📋 *Booking ID:* ${params.bookingId}`,
    `💵 *Amount Due:* ₹${params.finalPrice}`,
    `💳 *Payment:* Cash, UPI, or Card at the shop counter`,
    ``,
    `📍 *Pickup Address:*`,
    `${SHOP_CONFIG.address}`,
    `🗺️ *Directions:* ${SHOP_CONFIG.directionsUrl}`,
    ``,
    `Thank you for choosing Patel car'spa & Detailing! Safe driving! 🌟`,
  ].join("\n");

  return sendWhatsApp(params.phone, message);
}

/**
 * Message #3: 1-hour appointment reminder (Bonus feature)
 */
export async function sendAppointmentReminderWhatsApp(params: {
  customerName: string;
  phone: string;
  timeSlot: string;
}): Promise<WhatsAppSendResult> {
  const message = [
    `⏰ *Reminder: Your Patel car'spa & Detailing appointment is in 1 Hour!*`,
    ``,
    `Hi ${params.customerName}, this is a gentle reminder that your slot (${params.timeSlot}) starts soon.`,
    `See you soon at Patel car'spa & Detailing! 🚗💨`,
  ].join("\n");

  return sendWhatsApp(params.phone, message);
}
