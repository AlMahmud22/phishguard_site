"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchUserStats } from "@/lib/api";
import type { UserStats, ApiResponse } from "@/types";

/// dynamically import chart components with lazy loading for better performance
/// these components use Recharts library which is heavy, so lazy loading improves initial page load
const StatsChart = dynamic(() => import("@/components/StatsChart"), {
  loading: () => (
    <div className="card">
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  ssr: false, /// disable SSR for chart components as they use client-side rendering
});

const TopThreatsChart = dynamic(
  () =>
    import("@/components/StatsChart").then((mod) => ({
      default: mod.TopThreatsChart,
    })),
  {
    loading: () => (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

/// Statistics page displays visual analytics using Recharts
/// fetches data from GET /api/user/stats endpoint
export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"line" | "bar" | "pie">("line");

  /// fetch user statistics on component mount
  useEffect(() => {
    const loadStats = async () => {
      const token = localStorage.getItem("authToken");

      /// redirect to login if no token found
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        /// fetch user statistics for analytics dashboard
        const response: ApiResponse<UserStats> = await fetchUserStats();
        
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          setError(response.message || "Failed to load statistics");
        }
      } catch (err) {
        console.error("Failed to fetch statistics:", err);
        setError("Unable to load statistics. Please try again later.");
        
        /// if authentication fails, redirect to login
        if ((err as any)?.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [router]);

  /// loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
          <p className="text-gray-600 mt-1">Visual analytics and insights</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /// error state
  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
          <p className="text-gray-600 mt-1">Visual analytics and insights</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
        <p className="text-gray-600 mt-1">Visual analytics and insights</p>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <p className="text-gray-600 text-sm">Total Scans</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalScans}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Phishing Detected</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{stats.phishingDetected}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Safe URLs</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.safeUrls}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Avg Confidence</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {(stats.averageConfidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Main chart with type selector */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Scan Trends</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartType === "line"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartType === "bar"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartType === "pie"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pie
            </button>
          </div>
        </div>
        <StatsChart stats={stats} type={chartType} />
      </div>

      {/* Additional insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top threats */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Threats</h2>
          <TopThreatsChart threats={stats.topThreats} />
        </div>

        {/* Detection rate card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detection Rate</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Phishing Detection</span>
                <span className="text-sm font-medium">
                  {((stats.phishingDetected / stats.totalScans) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(stats.phishingDetected / stats.totalScans) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Safe URLs</span>
                <span className="text-sm font-medium">
                  {((stats.safeUrls / stats.totalScans) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(stats.safeUrls / stats.totalScans) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Based on {stats.totalScans} total scans with an average confidence of{" "}
                {(stats.averageConfidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
