"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { fetchUserStats } from "@/lib/api";
import type { UserStats, ApiResponse } from "@/types";
import URLScanCard from "@/components/URLScanCard";
import StatsOverview from "@/components/StatsOverview";
import ParticlesBackground from "@/components/backgrounds/ParticlesBackground";

// Dynamically import Three.js components to avoid SSR issues
const AnimatedIcon = dynamic(
  () => import("@/components/three/AnimatedIcon"),
  { ssr: false }
);

/// Dashboard page - main user interface after authentication
/// displays scan history, analytics, and user information
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const isLoading = status === "loading";
  const isAdmin = session?.user?.role === "admin";
  const isTester = session?.user?.role === "tester";

  /// Fetch user statistics on component mount
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetchUserStats();
        if (response.success && response.data) {
          setStatsData(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (session) {
      loadAnalytics();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"
          />
          <p className="mt-6 text-lg text-gray-900 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const overview = statsData?.overview || {};
  const activity = statsData?.activity || {};
  const limits = statsData?.limits || {};

  return (
    <div className="relative min-h-screen bg-gray-50">
      <ParticlesBackground variant="dots" color="#3b82f6" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Welcome Section */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {session?.user?.name || "User"}!
            </h1>
            <p className="text-gray-700 text-base lg:text-lg font-medium mb-4">
              Your PhishGuard protection is active
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <motion.span 
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200 font-medium"
                whileHover={{ scale: 1.05 }}
              >
                {session?.user?.role === 'admin' ? 'Administrator' : session?.user?.role === 'tester' ? 'Tester' : 'User'}
              </motion.span>
              {statsData?.accountInfo?.isPremium && (
                <motion.span 
                  className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-semibold border border-yellow-200"
                  whileHover={{ scale: 1.05 }}
                >
                  Premium
                </motion.span>
              )}
              {activity?.streak > 0 && (
                <motion.span 
                  className="px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-semibold shadow-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  {activity.streak} Day Streak
                </motion.span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/dashboard/history"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  View History
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/dashboard/stats"
                  className="px-6 py-2.5 bg-white text-gray-900 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Analytics
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* URL Scan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <URLScanCard />
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <StatsOverview />
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Scans */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Total Scans</p>
            </div>
            {isLoadingData ? (
              <div className="h-10 w-20 bg-primary-800/50 rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-4xl font-extrabold text-gray-900 mb-1">
                  {overview.totalScans || 0}
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  +{activity.today || 0} today
                </p>
              </>
            )}
          </motion.div>

          {/* Threats Detected */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase">Threats</p>
            </div>
            {isLoadingData ? (
              <div className="h-10 w-20 bg-red-800/50 rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-3xl font-bold text-red-600 mb-1">
                  {overview.threatsDetected || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {overview.dangerCount || 0} high risk
                </p>
              </>
            )}
          </motion.div>

          {/* Safe URLs */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase">Safe URLs</p>
            </div>
            {isLoadingData ? (
              <div className="h-10 w-20 bg-green-800/50 rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {overview.safeCount || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {overview.totalScans ? Math.round((overview.safeCount / overview.totalScans) * 100) : 0}% safe rate
                </p>
              </>
            )}
          </motion.div>

          {/* Average Score */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase">Avg Score</p>
            </div>
            {isLoadingData ? (
              <div className="h-10 w-20 bg-accent-800/50 rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-3xl font-bold text-yellow-600 mb-1">
                  {overview.averageScore || 0}
                </p>
                <p className="text-sm text-gray-600">
                  Detection accuracy
                </p>
              </>
            )}
          </motion.div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Grid */}
            <motion.div 
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.02, y: -2 }}>
                  <Link
                    href="/dashboard/history"
                    className="block p-6 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-200 rounded-xl transition-all duration-200 group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Scan History</h3>
                        <p className="text-sm text-gray-600">View all past scans and results</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02, y: -2 }}>
                  <Link
                    href="/dashboard/stats"
                    className="block p-6 bg-gray-50 hover:bg-green-50 border-2 border-gray-200 hover:border-green-200 rounded-xl transition-all duration-200 group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Statistics</h3>
                        <p className="text-sm text-gray-600">Detailed analytics & insights</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02, y: -2 }}>
                  <Link href="/dashboard/settings"
                    className="block p-6 bg-gray-50 hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-200 rounded-xl transition-all duration-200 group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Settings</h3>
                        <p className="text-sm text-gray-600">Manage your account</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>

                {(isAdmin || isTester) && (
                  <motion.div whileHover={{ scale: 1.02, y: -2 }}>
                    <Link
                      href={isAdmin ? "/dashboard/admin/users" : "/dashboard/admin/logs"}
                      className="block p-6 bg-gray-50 hover:bg-red-50 border-2 border-gray-200 hover:border-red-200 rounded-xl transition-all duration-200 group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg mb-1">
                            {isAdmin ? 'Admin Panel' : 'System Logs'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isAdmin ? 'Manage users & system' : 'View system activity'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>

          {/* Recent Activity */}
          <motion.div 
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Activity Overview
            </h2>
            {isLoadingData ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <motion.div 
                  className="flex items-center justify-between p-5 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all duration-200"
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">Today's Activity</p>
                      <p className="text-sm text-gray-600">{activity.today || 0} scans performed</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
                    Today
                  </span>
                </motion.div>

                <motion.div 
                  className="flex items-center justify-between p-5 bg-gray-50 border border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-xl transition-all duration-200"
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">This Week</p>
                      <p className="text-sm text-gray-600">{activity.thisWeek || 0} total scans</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold">
                    7 Days
                  </span>
                </motion.div>

                <motion.div 
                  className="flex items-center justify-between p-5 bg-gray-50 border border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl transition-all duration-200"
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">This Month</p>
                      <p className="text-sm text-gray-600">{activity.thisMonth || 0} scans this month</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold">
                    30 Days
                  </span>
                </motion.div>

                {activity.streak > 0 && (
                  <motion.div 
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 hover:border-orange-300 rounded-xl transition-all duration-200"
                    whileHover={{ x: 5 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm3.64 7.36a2.016 2.016 0 000 2.84l3.54 3.54a2 2 0 002.82-2.82l-3.54-3.54a2 2 0 00-2.82 0zM12 22c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-7c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">Active Streak</p>
                        <p className="text-sm text-gray-600">{activity.streak} consecutive days</p>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-bold shadow-sm">
                      Streak
                    </span>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Info & Limits */}
        <div className="space-y-6">
          {/* Account Info Card */}
          <motion.div 
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-200"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account Info
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-blue-600 uppercase tracking-wider mb-1 font-bold">Name</p>
                <p className="font-bold text-gray-900 text-lg">{session?.user?.name || "N/A"}</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-purple-600 uppercase tracking-wider mb-1 font-bold">Email</p>
                <p className="font-semibold text-gray-900 text-sm break-all">{session?.user?.email || "N/A"}</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-green-600 uppercase tracking-wider mb-1 font-bold">Role</p>
                <p className="font-bold text-gray-900 text-lg capitalize">{session?.user?.role || "user"}</p>
              </div>
              {statsData?.accountInfo?.memberSince && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-orange-600 uppercase tracking-wider mb-1 font-bold">Member Since</p>
                  <p className="font-bold text-gray-900">
                    {new Date(statsData.accountInfo.memberSince).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Usage Limits Card */}
          {limits.daily && (
            <motion.div 
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-200"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Usage Limits
              </h2>
              <div className="space-y-5">
                {/* Daily Limit */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-gray-900">Daily Quota</span>
                    <span className="text-sm font-black text-gray-900">
                      {limits.daily.used} / {limits.daily.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className={`h-3 rounded-full ${
                        (limits.daily.used / limits.daily.limit) > 0.9 ? 'bg-red-500' :
                        (limits.daily.used / limits.daily.limit) > 0.7 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((limits.daily.used / limits.daily.limit) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.9 }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 font-semibold">{limits.daily.remaining} scans remaining today</p>
                </div>

                {/* Monthly Limit */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-gray-900">Monthly Quota</span>
                    <span className="text-sm font-black text-gray-900">
                      {limits.monthly.used} / {limits.monthly.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className={`h-3 rounded-full ${
                        (limits.monthly.used / limits.monthly.limit) > 0.9 ? 'bg-red-500' :
                        (limits.monthly.used / limits.monthly.limit) > 0.7 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((limits.monthly.used / limits.monthly.limit) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 1 }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 font-semibold">{limits.monthly.remaining} scans remaining this month</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Getting Started Guide */}
          <motion.div 
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-200"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quick Guide
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-bold">1</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">Install the PhishGuard desktop app</p>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-bold">2</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">Scan suspicious URLs in real-time</p>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-bold">3</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">Monitor results in your dashboard</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </div>
  );
}
