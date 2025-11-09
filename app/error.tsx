"use client";

import { useEffect } from "react";
import Link from "next/link";

/// global error boundary component that catches unhandled errors in the app
/// provides user-friendly error message and recovery options
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /// log error to console for debugging
    /// in production, this could send to error monitoring service (e.g., Sentry)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Error icon */}
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error message */}
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">
          Something Went Wrong
        </h2>

        <p className="text-lg text-gray-600 mb-2">
          We encountered an unexpected error while processing your request.
        </p>

        {/* Error details for development */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 mb-6 text-left bg-gray-100 p-4 rounded-lg">
            <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="text-xs text-gray-600 overflow-auto">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        {/* Recovery actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium inline-block"
          >
            Go to Homepage
          </Link>
        </div>

        {/* Support information */}
        <p className="mt-8 text-sm text-gray-500">
          If this problem persists, please contact our support team with error
          code: {error.digest || "UNKNOWN"}
        </p>
      </div>
    </div>
  );
}
