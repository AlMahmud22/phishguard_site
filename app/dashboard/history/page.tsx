"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchScanHistory } from "@/lib/api";
import type { ScanHistory, ApiResponse } from "@/types";

/// dynamically import HistoryTable component with lazy loading for better performance
/// shows loading state while component code is being fetched
const HistoryTable = dynamic(() => import("@/components/HistoryTable"), {
  loading: () => (
    <div className="card">
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  ssr: false, /// disable SSR for this component as it uses client-side data
});

/// History page displays all user scan records from backend
/// fetches data from GET /api/url/history endpoint
export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /// fetch scan history on component mount
  useEffect(() => {
    const loadHistory = async () => {
      const token = localStorage.getItem("authToken");

      /// redirect to login if no token found
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        /// fetch user scan history from backend
        const response: ApiResponse<ScanHistory[]> = await fetchScanHistory();
        
        if (response.success && response.data) {
          setHistory(response.data);
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
          <p className="text-gray-600 mt-1">View all your URL scan records</p>
        </div>

        <div className="card text-center py-12">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-red-500"
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
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
        <p className="text-gray-600 mt-1">View all your URL scan records</p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <p className="text-gray-600 text-sm">Total Scans</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{history.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Phishing Detected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {history.filter((scan) => scan.isPhishing).length}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Safe URLs</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {history.filter((scan) => !scan.isPhishing).length}
          </p>
        </div>
      </div>

      {/* History table */}
      <div className="card">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">All Scans</h2>
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
      </div>
    </div>
  );
}
