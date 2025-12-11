"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function AuthSuccessContentInner() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!code) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [code]);

  const handleRedirect = () => {
    if (!code) return;
    const url = `phishguard://auth?code=${code}`;
    window.location.href = url;
  };

  const manualClick = () => {
    if (!code) return;
    const url = `phishguard://auth?code=${code}`;
    window.location.href = url;
  };

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Request</h1>
          <p className="text-gray-600 mb-6">
            No authorization code found. Please try again.
          </p>
          <a href="/dashboard" className="px-6 py-2 bg-blue-600 text-white rounded-md">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Login Successful!
        </h1>

        {countdown > 0 ? (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Redirecting to desktop app in {countdown}...
            </p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <button
              onClick={manualClick}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Open PhishGuard Desktop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthSuccessContentInner />
    </Suspense>
  );
}
