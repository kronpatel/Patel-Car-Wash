import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/send
 * Admin internal endpoint for testing WhatsApp connectivity.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Phone and message are required" },
        { status: 400 }
      );
    }

    const result = await sendWhatsApp(phone, message);

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
    });
  } catch (error) {
    console.error("POST /api/whatsapp/send error:", error);
    return NextResponse.json(
      { success: false, error: "WhatsApp dispatch failed" },
      { status: 500 }
    );
  }
}
