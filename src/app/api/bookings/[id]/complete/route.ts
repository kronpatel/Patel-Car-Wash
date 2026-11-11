import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  findBookingById,
  updateBooking,
  findUserById,
  updateUser,
  createCoinTransaction,
} from "@/lib/jsonDb";
import { sendVehicleReadyWhatsApp } from "@/lib/whatsapp";
import { calculateEarnedCoins } from "@/lib/utils";

/**
 * PATCH /api/bookings/[id]/complete
 * OWNER / ADMIN PROTECTED ENDPOINT
 *
 * Implements the two-step completion lifecycle:
 * Step 1 (action = "ready"):
 *   - Marks vehicle "ready"
 *   - Auto-triggers WhatsApp #2: "🎉 Your vehicle is ready! Pay at counter 🚗"
 *
 * Step 2 (action = "completed"):
 *   - Customer pays cash/UPI at counter
 *   - Marks booking "completed"
 *   - Calculates and credits Clean Coins loyalty points (₹100 spent = 10 coins)
 *   - Logs CoinTransaction
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Owner authorization required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body.action || "ready"; // "ready" | "completed"

    const booking = findBookingById(params.id);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot process or complete a booking that has been cancelled.",
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────
    // STEP 1: MARK VEHICLE READY -> TRIGGER WHATSAPP #2
    // ─────────────────────────────────────────────────────────
    if (action === "ready") {
      let waReadySent = booking.whatsappSent?.ready || false;

      // Trigger WhatsApp #2 notification
      try {
        const waResult = await sendVehicleReadyWhatsApp({
          customerName: booking.customerName,
          phone: booking.customerPhone,
          bookingId: booking.bookingId,
          vehicleType: booking.vehicleType,
          vehicleNumber: booking.vehicleNumber,
          finalPrice: booking.finalPrice,
        });

        if (waResult.success) {
          waReadySent = true;
        }
      } catch (waError) {
        console.warn("WhatsApp Ready alert error (non-fatal):", waError);
      }

      const updated = updateBooking(booking.id, {
        status: "ready",
        whatsappSent: {
          ...booking.whatsappSent,
          ready: waReadySent,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Vehicle marked ready and customer notified via WhatsApp",
        booking: updated,
      });
    }

    // ─────────────────────────────────────────────────────────
    // STEP 2: MARK COMPLETED -> CREDIT CLEAN COINS
    // ─────────────────────────────────────────────────────────
    if (action === "completed") {
      if (booking.status === "completed") {
        return NextResponse.json({
          success: true,
          message: "Booking is already marked completed",
          booking,
        });
      }

      const updated = updateBooking(booking.id, { status: "completed" });

      // Calculate Clean Coins earned: ₹100 spent = 10 coins
      const earnedCoins = calculateEarnedCoins(booking.finalPrice);

      let creditedCoins = 0;
      if (earnedCoins > 0) {
        const bookingUserId = typeof booking.userId === "string" ? booking.userId : (booking.userId as any)?.id;
        const customer = findUserById(bookingUserId);
        if (customer) {
          const newCoinTotal = (customer.cleanCoins || 0) + earnedCoins;
          updateUser(customer.id || customer._id, { cleanCoins: newCoinTotal });
          creditedCoins = earnedCoins;

          // Log transaction
          createCoinTransaction({
            userId: customer.id || customer._id,
            type: "earned",
            amount: earnedCoins,
            reason: `Earned from completed wash ${booking.bookingId}`,
            bookingId: booking.id || booking._id,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Booking completed. ${creditedCoins} Clean Coins credited to customer.`,
        booking: updated,
        earnedCoins: creditedCoins,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid completion action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/bookings/[id]/complete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking lifecycle status" },
      { status: 500 }
    );
  }
}
