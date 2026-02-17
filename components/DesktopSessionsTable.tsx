"use client";

import { useEffect, useState } from "react";
import { DesktopSession, SessionsResponse } from "@/app/api/admin/desktop-sessions/route";

const PlatformIcon = ({ platform }: { platform: string }) => {
  if (platform === 'darwin') return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>;
  if (platform === 'linux') return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.84-.41 1.738-.348 2.642.125 1.828 1.324 3.474 3.279 4.545 1.05.574 2.28.921 3.681.921 1.409 0 2.64-.347 3.689-.921 1.955-1.071 3.154-2.717 3.279-4.545.062-.904-.07-1.802-.348-2.642-.589-1.771-1.831-3.47-2.716-4.521-.75-1.067-.974-1.928-1.05-3.02-.065-1.491 1.056-5.965-3.17-6.298-.165-.013-.325-.021-.48-.021zm-.005 5.326c.119 0 .235.042.328.126.093.084.146.197.146.315 0 .245-.199.443-.474.443-.275 0-.474-.198-.474-.443 0-.118.053-.231.146-.315.093-.084.209-.126.328-.126z"/></svg>;
  if (platform === 'win32') return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>;
  return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-7 14H6v-2h7v2zm4-4H3V8h14v6z"/></svg>;
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
            aria-label="Retry loading desktop sessions"
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
          aria-label="Refresh desktop sessions list"
          aria-busy={isLoading}
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
                      <PlatformIcon platform={session.deviceInfo.platform} />
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
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${session.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                        {session.isActive ? "Active" : "Inactive"}
                      </span>
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
