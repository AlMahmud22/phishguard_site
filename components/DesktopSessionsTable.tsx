"use client";

import { useEffect, useState } from "react";
import { DesktopSession, SessionsResponse } from "@/app/api/admin/desktop-sessions/route";

const platformIcons: Record<string, string> = {
  win32: "🪟",
  darwin: "🍎",
  linux: "🐧",
  unknown: "💻",
};

const platformNames: Record<string, string> = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux",
  unknown: "Unknown",
};

/// DesktopSessionsTable component - displays active desktop app connections
export default function DesktopSessionsTable() {
  const [sessions, setSessions] = useState<DesktopSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [stats, setStats] = useState({ total: 0, activeSessions: 0, totalUsers: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSessions = async () => {
    try {
      setError(null);

      const params = new URLSearchParams({
        activeOnly: activeOnly.toString(),
      });

      const response = await fetch(`/api/admin/desktop-sessions?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sessions");
      }

      const sessionsData: SessionsResponse = data.data;
      setSessions(sessionsData.sessions);
      setStats({
        total: sessionsData.total,
        activeSessions: sessionsData.activeSessions,
        totalUsers: sessionsData.totalUsers,
      });
    } catch (err: any) {
      console.error("Error fetching sessions:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Auto-refresh every 10 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchSessions, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeOnly, autoRefresh]);

  const handleDeactivate = async (sessionId: string) => {
    if (!confirm("Are you sure you want to deactivate this session?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/desktop-sessions?id=${sessionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to deactivate session");
      }

      alert("Session deactivated successfully");
      fetchSessions();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleString();
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchSessions}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">{stats.activeSessions}</div>
          <div className="text-sm opacity-90 mt-1">Active Sessions</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">{stats.totalUsers}</div>
          <div className="text-sm opacity-90 mt-1">Connected Users</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-sm opacity-90 mt-1">Total Sessions</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Active only</span>
          </label>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Auto-refresh (10s)</span>
          </label>
        </div>
        <button
          onClick={fetchSessions}
          disabled={isLoading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Sessions Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                App Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Seen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No desktop sessions found
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {session.userName}
                      </div>
                      <div className="text-xs text-gray-500">{session.userEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {platformIcons[session.deviceInfo.platform]}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {platformNames[session.deviceInfo.platform]}
                        </div>
                        <div className="text-xs text-gray-500">
                          {session.deviceInfo.hostname}
                        </div>
                        <div className="text-xs text-gray-400">
                          {session.deviceInfo.osVersion}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    v{session.deviceInfo.appVersion}
                    {session.deviceInfo.electronVersion && (
                      <div className="text-xs text-gray-500">
                        Electron {session.deviceInfo.electronVersion}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {session.ipAddress || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(session.lastSeen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        session.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {session.isActive ? "🟢 Active" : "⚫ Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {session.isActive && (
                      <button
                        onClick={() => handleDeactivate(session.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Disconnect
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">⚠ Warning: {error}</p>
        </div>
      )}
    </div>
  );
}
