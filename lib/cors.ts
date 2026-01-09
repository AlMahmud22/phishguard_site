import { NextRequest, NextResponse } from "next/server";

/**
 * CORS Middleware for Desktop App Authentication
 * Allows requests from the local Electron app (localhost:3456)
 */
export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const response = NextResponse.next();

  // Allow requests from desktop app's local server
  const allowedOrigins = [
    "http://localhost:3456",
    "http://127.0.0.1:3456",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  return response;
}

// Handle OPTIONS preflight requests
export function handleCorsOptions(request: NextRequest) {
  const origin = request.headers.get("origin");
  
  const allowedOrigins = [
    "http://localhost:3456",
    "http://127.0.0.1:3456",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  return new NextResponse(null, { status: 403 });
}
