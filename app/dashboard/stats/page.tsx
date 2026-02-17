"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { fetchUserStats } from "@/lib/api";
import type { UserStats, ApiResponse } from "@/types";
import AnimatedIcon from "@/components/three/AnimatedIcon";
import ParticlesBackground from "@/components/backgrounds/ParticlesBackground";

/// dynamically import chart components with lazy loading for better performance
/// these components use Recharts library which is heavy, so lazy loading improves initial page load
const StatsChart = dynamic(() => import("@/components/StatsChart"), {
  loading: () => (
    <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6">
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
      <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6">
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
      try {
        /// fetch user statistics for analytics dashboard
        const response = await fetchUserStats();
        
        if (response.success && response.data) {
          // Transform API response to match expected UserStats format
          const apiData = response.data;
          const transformedStats: UserStats = {
            totalScans: apiData.overview?.totalScans || 0,
            phishingDetected: apiData.overview?.threatsDetected || 0,
            safeUrls: apiData.overview?.safeCount || 0,
            averageConfidence: (apiData.overview?.averageScore || 0) / 100, // Convert score to confidence
            scansByDate: (apiData.activityByDay || []).map((day: any) => ({
              date: day.date,
              scans: day.count,
              phishing: day.danger + day.warning,
              safe: day.safe,
            })),
            topThreats: (apiData.recentDangers || []).map((danger: any) => ({
              url: danger.url,
              count: 1, // API doesn't provide count, using 1 as placeholder
            })).slice(0, 10),
          };
          setStats(transformedStats);
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
      <div className="min-h-screen bg-gray-50">
        <ParticlesBackground variant="network" color="#3b82f6" />
        <div className="max-w-7xl mx-auto relative z-10 px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-black text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-700 text-lg font-semibold">Visual analytics and insights</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6 animate-pulse"
              >
                <div className="h-64 bg-gray-200 rounded"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /// error state
  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ParticlesBackground variant="network" color="#3b82f6" />
        <div className="max-w-7xl mx-auto relative z-10 px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-black text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-700 text-lg font-semibold">Visual analytics and insights</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4">
              <AnimatedIcon type="shield" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Statistics Available</h3>
            <p className="text-gray-700 font-medium mb-4">
              {error || "You need to perform some scans first to see statistics. Use the URL scanner to get started."}
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
      <ParticlesBackground variant="network" color="#3b82f6" />
      
      <div className="max-w-7xl mx-auto relative z-10 px-4 py-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-black text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-700 text-lg font-semibold">Visual analytics and insights</p>
        </motion.div>

        {/* Key metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-6 hover:shadow-lg transition-all"
          >
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Total Scans</p>
            <p className="text-4xl font-extrabold text-gray-900">{stats.totalScans}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-6 hover:shadow-lg transition-all"
          >
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Phishing Detected</p>
            <p className="text-4xl font-extrabold text-red-600">{stats.phishingDetected}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-6 hover:shadow-lg transition-all"
          >
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Safe URLs</p>
            <p className="text-4xl font-extrabold text-green-600">{stats.safeUrls}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-6 hover:shadow-lg transition-all"
          >
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Avg Confidence</p>
            <p className="text-4xl font-extrabold text-blue-700">
              {(stats.averageConfidence * 100).toFixed(1)}%
            </p>
          </motion.div>
        </div>

        {/* Main chart with type selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Scan Trends</h2>
            <div className="flex space-x-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setChartType("line")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  chartType === "line"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  chartType === "bar"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType("pie")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  chartType === "pie"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                Pie
              </button>
            </div>
          </div>
          <StatsChart stats={stats} type={chartType} />
        </motion.div>

        {/* Additional insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top threats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Threats</h2>
            <TopThreatsChart threats={stats.topThreats} />
          </motion.div>

          {/* Detection rate card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Detection Rate</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-base font-semibold text-gray-800">Phishing Detection</span>
                  <span className="text-base font-bold text-gray-900">
                    {((stats.phishingDetected / stats.totalScans) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.phishingDetected / stats.totalScans) * 100}%` }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="bg-red-500 h-4 rounded-full"
                  ></motion.div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-base font-semibold text-gray-800">Safe URLs</span>
                  <span className="text-base font-bold text-gray-900">
                    {((stats.safeUrls / stats.totalScans) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.safeUrls / stats.totalScans) * 100}%` }}
                    transition={{ delay: 0.9, duration: 1 }}
                    className="bg-green-500 h-4 rounded-full"
                  ></motion.div>
                </div>
              </div>
              <div className="pt-4 border-t-2 border-gray-300">
                <p className="text-base font-medium text-gray-700">
                  Based on {stats.totalScans} total scans with an average confidence of{" "}
                  {(stats.averageConfidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
