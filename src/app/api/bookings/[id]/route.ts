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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const booking = findBookingById(params.id);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization check
    const bookingUserId = typeof booking.userId === "string" ? booking.userId : (booking.userId as any)?.id;
    if (
      session.user.role !== "admin" &&
      bookingUserId !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("GET /api/bookings/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const booking = findBookingById(params.id);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingUserId = typeof booking.userId === "string" ? booking.userId : (booking.userId as any)?.id;
    const { status, notes } = await req.json();

    // ─────────────────────────────────────────────────────────
    // CANCELLATION LOGIC WITH LOYALTY COIN REFUND
    // ─────────────────────────────────────────────────────────
    if (status === "cancelled") {
      // Non-admins can only cancel their own bookings
      if (
        session.user.role !== "admin" &&
        bookingUserId !== session.user.id
      ) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      if (booking.status === "cancelled") {
        return NextResponse.json({
          success: true,
          message: "Booking is already cancelled",
          booking,
        });
      }

      if (booking.status !== "confirmed") {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot cancel a job that is already in progress, ready, or completed",
          },
          { status: 400 }
        );
      }

      // Mark cancelled
      const cancelledBooking = updateBooking(booking.id, { status: "cancelled" });

      // Refund Clean Coins if customer redeemed any for this booking
      if (booking.coinsUsed > 0 && bookingUserId) {
        const customer = findUserById(bookingUserId);
        if (customer) {
          updateUser(customer.id || customer._id, {
            cleanCoins: (customer.cleanCoins || 0) + booking.coinsUsed,
          });

          createCoinTransaction({
            userId: customer.id || customer._id,
            type: "earned",
            amount: booking.coinsUsed,
            reason: `Refund of ${booking.coinsUsed} Clean Coins for cancelled booking ${booking.bookingId}`,
            bookingId: booking.id || booking._id,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message:
          booking.coinsUsed > 0
            ? `Booking cancelled. ${booking.coinsUsed} Clean Coins have been refunded to your account.`
            : "Booking cancelled successfully",
        booking: cancelledBooking,
      });
    }

    // Block direct "completed" updates to ensure loyalty points and WhatsApp triggers run via /complete
    if (status === "completed") {
      return NextResponse.json(
        {
          success: false,
          error: "Please use the /complete endpoint to finalize appointments and disburse Clean Coins rewards.",
        },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};

    // Admin status updates
    if (session.user.role === "admin" && status) {
      updates.status = status;
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const updatedBooking = updateBooking(booking.id, updates);
    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("PATCH /api/bookings/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
