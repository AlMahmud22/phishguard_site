"use client";

import Link from "next/link";

/// maintenance mode page displayed during scheduled downtime or system updates
/// can be activated by setting MAINTENANCE_MODE=true in environment variables
export default function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="text-center max-w-2xl mx-auto">
        {/* Maintenance icon */}
        <div className="mb-8">
          <svg
            className="w-32 h-32 mx-auto text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Maintenance message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          We'll Be Back Soon
        </h1>

        <p className="text-xl text-gray-600 mb-6">
          PhishGuard is currently undergoing scheduled maintenance to improve
          your experience.
        </p>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <p className="text-gray-700 mb-4">
            We're working hard to enhance our phishing detection system with new
            features and improvements.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Expected downtime: 30 minutes</span>
          </div>
        </div>

        {/* Status updates */}
        <div className="space-y-3 mb-8">
          <p className="text-sm text-gray-600">
            For real-time updates, follow us on social media or check our status
            page.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="https://status.phish.equators.tech"
              className="text-blue-600 hover:underline text-sm font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Status Page
            </Link>
            <span className="text-gray-400">•</span>
            <Link
              href="mailto:support@phish.equators.tech"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>

        {/* Back button */}
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}
