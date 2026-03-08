"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { motion } from "framer-motion";
import { fetchScanHistory } from "@/lib/api";
import type { ScanHistory, ApiResponse } from "@/types";
import ParticlesBackground from "@/components/backgrounds/ParticlesBackground";

/// dynamically import components with lazy loading for better performance
const HistoryTable = nextDynamic(() => import("@/components/HistoryTable"), {
  loading: () => (
    <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  ssr: false,
});

/// History page displays all user scan records from backend
/// fetches data from GET /api/url/history endpoint
export const dynamic = 'force-dynamic'

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /// fetch scan history on component mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        /// fetch user scan history from backend with higher limit to get all scans
        const response = await fetchScanHistory({ page: 1, limit: 500 });
        
        if (response.success && response.data?.scans) {
          setHistory(response.data.scans);
        } else {
          setError(response.message || "Failed to load scan history");
        }
      } catch (err) {
        console.error("Failed to fetch scan history:", err);
        setError("Unable to load scan history. Please try again later.");
        
        /// if authentication fails, redirect to login
        if ((err as any)?.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [router]);

  /// error state
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ParticlesBackground variant="bubbles" color="#3b82f6" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-5xl font-black text-gray-900 mb-2">History</h1>
            <p className="text-gray-700 text-lg font-semibold">View all your URL scan records</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-12 text-center"
          >
            <svg
              className="w-16 h-16 mx-auto mb-4 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-yellow-600 font-bold text-lg mb-2">Unable to load history</p>
            <p className="text-gray-700 font-medium mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Retry
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  /// empty state - no scans yet
  if (!isLoading && history.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ParticlesBackground variant="bubbles" color="#3b82f6" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-5xl font-black text-gray-900 mb-2">History</h1>
            <p className="text-gray-700 text-lg font-semibold">View all your URL scan records</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-12 text-center"
          >
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Scans Yet</h3>
            <p className="text-gray-700 font-medium mb-4">
              You haven't performed any URL scans yet. Use the URL scanner to get started.
            </p>
            <Link href="/" className="btn-primary">
              Go to Home
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ParticlesBackground variant="bubbles" color="#3b82f6" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-black text-gray-900 mb-2">History</h1>
          <p className="text-gray-700 text-lg font-semibold">View all your URL scan records</p>
        </motion.div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-6 hover:shadow-lg transition-all cursor-pointer"
          >
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Total Scans</p>
            <p className="text-4xl font-extrabold text-blue-600">
              {history.length}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-6 hover:shadow-lg transition-all cursor-pointer"
          >
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Phishing Detected</p>
            <p className="text-4xl font-extrabold text-red-600">
              {history.filter((scan: any) => scan.status === "danger" || scan.status === "warning").length}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-6 hover:shadow-lg transition-all cursor-pointer"
          >
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Safe URLs</p>
            <p className="text-4xl font-extrabold text-green-600">
              {history.filter((scan: any) => scan.status === "safe").length}
            </p>
          </motion.div>
        </div>

        {/* History table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6"
        >
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">All Scans</h2>
            <div className="flex space-x-2">
              <button className="btn-secondary text-sm">
                Export CSV
              </button>
              <button className="btn-secondary text-sm">
                Filter
              </button>
            </div>
          </div>
          <HistoryTable history={history} isLoading={isLoading} />
        </motion.div>
      </div>
    </div>
  );
}
