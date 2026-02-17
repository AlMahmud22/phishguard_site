"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import ThreeJSIcon to avoid SSR issues
const ThreeJSIcon = dynamic(() => import("@/components/ThreeJSIcon"), {
  ssr: false,
  loading: () => (
    <div className="w-16 h-16 mx-auto bg-blue-600/10 rounded-lg animate-pulse"></div>
  ),
});

export default function DownloadSection() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      // Create a simple download link to the zip file
      const link = document.createElement("a");
      link.href = "/downloads/phishguard-setup.zip";
      link.download = "phishguard-setup.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block mb-6 p-3 bg-primary-500/10 rounded-full border border-primary-400/30 shadow-lg">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Download PhishGuard Desktop
          </h2>
          
          <p className="text-lg text-gray-700 mb-8">
            Get real-time phishing protection with our powerful desktop application. Monitor your clipboard, get instant threat alerts, and stay protected 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105"
            >
              {downloading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Setup
                </>
              )}
            </button>

            <a
              href="/register"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/50 flex items-center justify-center gap-2 hover:scale-105"
            >
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
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Sign Up
            </a>
          </div>

          {/* Features with Three.js 3D Icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="glass-card p-6 rounded-lg hover:border-primary-500/50 transition-all group hover:scale-105">
              <div className="mb-4">
                <ThreeJSIcon type="cube" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">
                Real-Time Scanning
              </h3>
              <p className="text-sm text-gray-600">
                Monitor clipboard automatically
              </p>
            </div>

            <div className="glass-card p-6 rounded-lg hover:border-accent-500/50 transition-all group hover:scale-105">
              <div className="mb-4">
                <ThreeJSIcon type="shield" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">
                3 AI Engines
              </h3>
              <p className="text-sm text-gray-600">
                Advanced threat detection
              </p>
            </div>

            <div className="glass-card p-6 rounded-lg hover:border-primary-500/50 transition-all group hover:scale-105">
              <div className="mb-4">
                <ThreeJSIcon type="chart" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">
                Scan History
              </h3>
              <p className="text-sm text-gray-600">
                Track all your scans
              </p>
            </div>
          </div>

          {/* System Requirements */}
          <div className="mt-12 p-6 glass-card rounded-lg text-left max-w-xl mx-auto">
            <h4 className="font-bold text-gray-900 mb-3 text-lg">
              System Requirements
            </h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-primary-600 font-bold">✓</span>
                Windows 10 or newer (64-bit)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600 font-bold">✓</span>
                100 MB free disk space
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600 font-bold">✓</span>
                Administrator privileges
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600 font-bold">✓</span>
                Internet for cloud scanning
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
