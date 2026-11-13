import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: params.id }, { bookingId: params.id }],
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization check
    if (
      session.user.role !== "admin" &&
      booking.userId !== session.user.id
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

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: params.id }, { bookingId: params.id }],
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const { status, notes } = await req.json();

    // ─────────────────────────────────────────────────────────
    // CANCELLATION LOGIC WITH LOYALTY COIN REFUND
    // ─────────────────────────────────────────────────────────
    if (status === "cancelled") {
      // Non-admins can only cancel their own bookings
      if (
        session.user.role !== "admin" &&
        booking.userId !== session.user.id
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

      // Execute cancellation and coin refund atomically
      const updatedBooking = await prisma.$transaction(async (tx) => {
        const cancelled = await tx.booking.update({
          where: { id: booking.id },
          data: { status: "cancelled" },
        });

        if (booking.coinsUsed > 0 && booking.userId) {
          await tx.user.update({
            where: { id: booking.userId },
            data: { cleanCoins: { increment: booking.coinsUsed } },
          });

          await tx.coinTransaction.create({
            data: {
              userId: booking.userId,
              type: "earned",
              amount: booking.coinsUsed,
              reason: `Refund of ${booking.coinsUsed} Clean Coins for cancelled booking ${booking.bookingId}`,
              bookingId: booking.id,
            },
          });
        }

        return cancelled;
      });

      return NextResponse.json({
        success: true,
        message:
          booking.coinsUsed > 0
            ? `Booking cancelled. ${booking.coinsUsed} Clean Coins have been refunded to your account.`
            : "Booking cancelled successfully",
        booking: updatedBooking,
      });
    }

    // Block direct "completed" updates
    if (status === "completed") {
      return NextResponse.json(
        {
          success: false,
          error: "Please use the /complete endpoint to finalize appointments and disburse Clean Coins rewards.",
        },
        { status: 400 }
      );
    }

    const data: any = {};
    if (session.user.role === "admin" && status) {
      data.status = status;
    }
    if (notes !== undefined) {
      data.notes = notes;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data,
    });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("PATCH /api/bookings/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
