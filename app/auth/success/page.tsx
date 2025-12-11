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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Login Successful!
          </h1>
          <p className="text-sm text-gray-600">
            Your authentication is complete
          </p>
        </div>

        {countdown > 0 ? (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Redirecting to desktop app in {countdown}...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="text-center space-y-4 mb-6">
            <button
              onClick={manualClick}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Open PhishGuard Desktop
            </button>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-sm text-gray-700 font-medium mb-2">
            Desktop app not opening?
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Copy this authentication code and paste it in the desktop app:
          </p>
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-3">
            <code className="text-xs font-mono break-all text-gray-800 select-all">
              {code}
            </code>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>Code expires in 15 minutes. Use it quickly.</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click "Enter code manually" in the desktop app login screen
          </p>
        </div>

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-center text-gray-500">
            You can close this window after the desktop app opens
          </p>
        </div>
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
