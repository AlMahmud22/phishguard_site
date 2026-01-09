"use client";

import { useState, useEffect } from "react";

interface ConnectionStatus {
  mongodb: boolean;
  checking: boolean;
}

export default function ConnectionStatusBanner() {
  const [status, setStatus] = useState<ConnectionStatus>({
    mongodb: true,
    checking: true,
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setStatus({
          mongodb: data.mongodb === "connected",
          checking: false,
        });
      } catch (error) {
        setStatus({
          mongodb: false,
          checking: false,
        });
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (status.checking || status.mongodb || dismissed) {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
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
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Database Connection Issue
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              Unable to connect to MongoDB. Your data may not be available until
              the connection is restored.
            </p>
            <p className="mt-1">
              <strong>Solution:</strong> Whitelist your IP address in MongoDB Atlas.
              <a
                href="https://cloud.mongodb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1 hover:text-red-900"
              >
                Go to MongoDB Atlas →
              </a>
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
