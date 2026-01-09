import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendTestEmail, verifyEmailConfiguration } from "@/lib/email";

/**
 * Test email endpoint - Admin only
 * Tests email configuration and sends a test email
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Login required" },
        { status: 401 }
      );
    }

    // Admin only
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { email } = await request.json();
    const targetEmail = email || session.user.email;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, message: "Email address required" },
        { status: 400 }
      );
    }

    // Verify email configuration first
    const isConfigured = await verifyEmailConfiguration();
    
    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          message: "Email service not configured. Please check EMAIL_USER and EMAIL_PASSWORD environment variables.",
          configured: false,
        },
        { status: 500 }
      );
    }

    // Send test email
    const emailSent = await sendTestEmail(targetEmail);

    if (emailSent) {
      return NextResponse.json(
        {
          success: true,
          message: `Test email sent successfully to ${targetEmail}`,
          configured: true,
          emailSent: true,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send test email. Check server logs for details.",
          configured: true,
          emailSent: false,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while testing email",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check email configuration status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const isConfigured = await verifyEmailConfiguration();

    return NextResponse.json(
      {
        success: true,
        configured: isConfigured,
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || '587',
        user: process.env.EMAIL_USER ? '✓ Configured' : '✗ Missing',
        password: process.env.EMAIL_PASSWORD ? '✓ Configured' : '✗ Missing',
        from: process.env.EMAIL_FROM || 'noreply@phish.equators.tech',
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Error checking email configuration",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
