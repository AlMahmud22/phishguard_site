"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { fetchUserStats } from "@/lib/api";
import type { UserStats, ApiResponse } from "@/types";

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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const overview = statsData?.overview || {};
  const activity = statsData?.activity || {};
  const limits = statsData?.limits || {};

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Welcome Section */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 lg:p-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              Welcome back, {session?.user?.name || "User"}!
            </h1>
            <p className="text-gray-400 text-base lg:text-lg mb-4">
              Your PhishGuard protection is active
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-slate-700 text-gray-300 rounded-lg text-sm">
                {session?.user?.role === 'admin' ? 'Administrator' : session?.user?.role === 'tester' ? 'Tester' : 'User'}
              </span>
              {statsData?.accountInfo?.isPremium && (
                <span className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm">
                  Premium
                </span>
              )}
              {activity?.streak > 0 && (
                <span className="px-3 py-1 bg-orange-600 text-white rounded-lg text-sm">
                  {activity.streak} Day Streak
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/history"
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                View History
              </Link>
              <Link
                href="/dashboard/stats"
                className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase">Total Scans</p>
          </div>
          {isLoadingData ? (
            <div className="h-10 w-20 bg-slate-700 rounded animate-pulse"></div>
          ) : (
            <>
              <p className="text-3xl font-bold text-white mb-1">
                {overview.totalScans || 0}
              </p>
              <p className="text-sm text-gray-400">
                +{activity.today || 0} today
              </p>
            </>
          )}
        </div>

        {/* Threats Detected */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase">Threats</p>
          </div>
          {isLoadingData ? (
            <div className="h-10 w-20 bg-slate-700 rounded animate-pulse"></div>
          ) : (
            <>
              <p className="text-3xl font-bold text-red-400 mb-1">
                {overview.threatsDetected || 0}
              </p>
              <p className="text-sm text-gray-400">
                {overview.dangerCount || 0} high risk
              </p>
            </>
          )}
        </div>

        {/* Safe URLs */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase">Safe URLs</p>
          </div>
          {isLoadingData ? (
            <div className="h-10 w-20 bg-slate-700 rounded animate-pulse"></div>
          ) : (
            <>
              <p className="text-3xl font-bold text-green-400 mb-1">
                {overview.safeCount || 0}
              </p>
              <p className="text-sm text-gray-400">
                {overview.totalScans ? Math.round((overview.safeCount / overview.totalScans) * 100) : 0}% safe rate
              </p>
            </>
          )}
        </div>

        {/* Average Score */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase">Avg Score</p>
          </div>
          {isLoadingData ? (
            <div className="h-10 w-20 bg-slate-700 rounded animate-pulse"></div>
          ) : (
            <>
              <p className="text-3xl font-bold text-purple-400 mb-1">
                {overview.averageScore || 0}
              </p>
              <p className="text-sm text-gray-400">
                Detection accuracy
              </p>
            </>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Grid */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/dashboard/history"
                className="group p-6 bg-blue-600/20 hover:bg-blue-600/30 rounded-xl transition-all border border-blue-500/30 hover:border-blue-400/50"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-blue-500/30 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">Scan History</h3>
                    <p className="text-sm text-gray-400">View all past scans and results</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/stats"
                className="group p-6 bg-green-600/20 hover:bg-green-600/30 rounded-xl transition-all border border-green-500/30 hover:border-green-400/50"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-green-500/30 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">Statistics</h3>
                    <p className="text-sm text-gray-400">Detailed analytics & insights</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/settings"
                className="group p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-2xl transition-all hover:shadow-xl border border-purple-400 hover:scale-105"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-white/30">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">Settings</h3>
                    <p className="text-sm text-purple-100">Manage your account</p>
                  </div>
                </div>
              </Link>

              {(isAdmin || isTester) && (
                <Link
                  href={isAdmin ? "/dashboard/admin/users" : "/dashboard/admin/logs"}
                  className="group p-6 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-2xl transition-all hover:shadow-xl border border-red-400 hover:scale-105"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-white/30">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {isAdmin ? 'Admin Panel' : 'System Logs'}
                      </h3>
                      <p className="text-sm text-red-100">
                        {isAdmin ? 'Manage users & system' : 'View system activity'}
                      </p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Activity Overview
            </h2>
            {isLoadingData ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-700 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-blue-600/20 rounded-xl border border-blue-500/30">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">Today's Activity</p>
                      <p className="text-sm text-gray-400">{activity.today || 0} scans performed</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-blue-500/30 text-blue-300 rounded-lg text-sm font-bold">
                    Today
                  </span>
                </div>

                <div className="flex items-center justify-between p-5 bg-green-600/20 rounded-xl border border-green-500/30">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">This Week</p>
                      <p className="text-sm text-gray-400">{activity.thisWeek || 0} total scans</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-bold border border-white/30">
                    7 Days
                  </span>
                </div>

                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl border border-purple-400 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">This Month</p>
                      <p className="text-sm text-purple-100">{activity.thisMonth || 0} scans this month</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-bold border border-white/30">
                    30 Days
                  </span>
                </div>

                {activity.streak > 0 && (
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl border border-orange-400 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                        <span className="text-white font-bold text-2xl">🔥</span>
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">Active Streak</p>
                        <p className="text-sm text-orange-100">{activity.streak} consecutive days</p>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-bold border border-white/30">
                      Streak
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Info & Limits */}
        <div className="space-y-6">
          {/* Account Info Card */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account Info
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
                <p className="text-xs text-blue-400 uppercase tracking-wider mb-1 font-bold">Name</p>
                <p className="font-bold text-white text-lg">{session?.user?.name || "N/A"}</p>
              </div>
              <div className="p-4 bg-purple-600/20 rounded-lg border border-purple-500/30">
                <p className="text-xs text-purple-400 uppercase tracking-wider mb-1 font-bold">Email</p>
                <p className="font-semibold text-white text-sm break-all">{session?.user?.email || "N/A"}</p>
              </div>
              <div className="p-4 bg-green-600/20 rounded-lg border border-green-500/30">
                <p className="text-xs text-green-400 uppercase tracking-wider mb-1 font-bold">Role</p>
                <p className="font-bold text-white text-lg capitalize">{session?.user?.role || "user"}</p>
              </div>
              {statsData?.accountInfo?.memberSince && (
                <div className="p-4 bg-orange-600/20 rounded-lg border border-orange-500/30">
                  <p className="text-xs text-orange-400 uppercase tracking-wider mb-1 font-bold">Member Since</p>
                  <p className="font-bold text-white">
                    {new Date(statsData.accountInfo.memberSince).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Usage Limits Card */}
          {limits.daily && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-white mb-5 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Usage Limits
              </h2>
              <div className="space-y-5">
                {/* Daily Limit */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-blue-900">Daily Quota</span>
                    <span className="text-sm font-black text-blue-900">
                      {limits.daily.used} / {limits.daily.limit}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        (limits.daily.used / limits.daily.limit) > 0.9 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        (limits.daily.used / limits.daily.limit) > 0.7 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                        'bg-gradient-to-r from-green-500 to-green-600'
                      }`}
                      style={{ width: `${Math.min((limits.daily.used / limits.daily.limit) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2 font-semibold">{limits.daily.remaining} scans remaining today</p>
                </div>

                {/* Monthly Limit */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-purple-900">Monthly Quota</span>
                    <span className="text-sm font-black text-purple-900">
                      {limits.monthly.used} / {limits.monthly.limit}
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        (limits.monthly.used / limits.monthly.limit) > 0.9 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        (limits.monthly.used / limits.monthly.limit) > 0.7 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                        'bg-gradient-to-r from-green-500 to-green-600'
                      }`}
                      style={{ width: `${Math.min((limits.monthly.used / limits.monthly.limit) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-purple-700 mt-2 font-semibold">{limits.monthly.remaining} scans remaining this month</p>
                </div>
              </div>
            </div>
          )}

          {/* Getting Started Guide */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quick Guide
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                <div className="flex-shrink-0 w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <p className="text-sm text-gray-300 font-medium">Install the PhishGuard desktop app</p>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                <div className="flex-shrink-0 w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <p className="text-sm text-gray-300 font-medium">Scan suspicious URLs in real-time</p>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                <div className="flex-shrink-0 w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <p className="text-sm text-gray-300 font-medium">Monitor results in your dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
