import { NextResponse } from "next/server";
import mongoose from "mongoose";

/// Health check endpoint for monitoring system status
/// Returns the connection status of MongoDB and other services
export async function GET() {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    return NextResponse.json({
      status: "ok",
      mongodb: mongoStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        mongodb: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
