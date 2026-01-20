"use client";

import { useEffect, useState } from "react";
import { ApiStatusResponse, ApiEndpointStatus, ConfigCheck } from "@/app/api/admin/api-status/route";

const statusColors = {
  operational: "bg-green-100 text-green-800 border-green-200",
  degraded: "bg-yellow-100 text-yellow-800 border-yellow-200",
  down: "bg-red-100 text-red-800 border-red-200",
  unknown: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusIcons = {
  operational: "✓",
  degraded: "⚠",
  down: "✕",
  unknown: "?",
};

const statusLabels = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
  unknown: "Unknown",
};

const configStatusColors = {
  valid: "text-green-600",
  missing: "text-red-600",
  invalid: "text-yellow-600",
};

const configStatusIcons = {
  valid: "✓",
  missing: "✕",
  invalid: "⚠",
};

/// StatusBadge component
function StatusBadge({ status }: { status: ApiEndpointStatus["status"] }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[status]}`}
    >
      <span className="mr-1">{statusIcons[status]}</span>
      {statusLabels[status]}
    </span>
  );
}

/// ServiceCard component
function ServiceCard({ service }: { service: ApiEndpointStatus }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
            <StatusBadge status={service.status} />
          </div>
          <p className="text-sm text-gray-600 mt-1">{service.endpoint}</p>
          {service.message && (
            <p className="text-sm text-gray-500 mt-2">{service.message}</p>
          )}
          {service.responseTime !== undefined && (
            <p className="text-xs text-gray-400 mt-1">
              Response time: {service.responseTime}ms
            </p>
          )}
        </div>
        {service.details && Object.keys(service.details).length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            {isExpanded ? "Hide" : "Details"}
          </button>
        )}
      </div>

      {isExpanded && service.details && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <dl className="grid grid-cols-1 gap-2">
            {Object.entries(service.details).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <dt className="text-gray-600 font-medium">{key}:</dt>
                <dd className="text-gray-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Last checked: {new Date(service.lastChecked).toLocaleString()}
      </p>
    </div>
  );
}

/// ConfigSection component
function ConfigSection({ title, configs }: { title: string; configs: ConfigCheck[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const configuredCount = configs.filter(c => c.configured).length;
  const totalCount = configs.length;
  const allConfigured = configuredCount === totalCount;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className={`text-sm font-medium ${allConfigured ? "text-green-600" : "text-yellow-600"}`}>
            {configuredCount}/{totalCount} configured
          </span>
        </div>
        <button className="text-gray-500">
          {isExpanded ? "▼" : "▶"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {configs.map((config, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${configStatusColors[config.status]}`}>
                  {configStatusIcons[config.status]}
                </span>
                <span className="text-sm text-gray-700">{config.name}</span>
              </div>
              <div className="text-right">
                {config.configured && config.value && (
                  <span className="text-xs text-gray-500 font-mono">{config.value}</span>
                )}
                {!config.configured && (
                  <span className="text-xs text-red-600">Not configured</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/// ApiStatusDashboard component
export default function ApiStatusDashboard() {
  const [statusData, setStatusData] = useState<ApiStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/api-status");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch API status");
      }

      setStatusData(data.data);
    } catch (err: any) {
      console.error("Error fetching API status:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchStatus, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (isLoading && !statusData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading API status...</p>
        </div>
      </div>
    );
  }

  if (error && !statusData) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchStatus}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!statusData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overall Status Header */}
      <div
        className={`rounded-lg p-6 border-2 ${
          statusData.overall === "operational"
            ? "bg-green-50 border-green-300"
            : statusData.overall === "degraded"
            ? "bg-yellow-50 border-yellow-300"
            : "bg-red-50 border-red-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              System Status:{" "}
              <span
                className={
                  statusData.overall === "operational"
                    ? "text-green-600"
                    : statusData.overall === "degraded"
                    ? "text-yellow-600"
                    : "text-red-600"
                }
              >
                {statusLabels[statusData.overall]}
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Last updated: {new Date(statusData.lastUpdate).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {statusData.uptime.percentage}%
            </div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Auto-refresh (30s)</span>
          </label>
        </div>
        <button
          onClick={fetchStatus}
          disabled={isLoading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Refreshing..." : "Refresh Now"}
        </button>
      </div>

      {/* Statistics */}
      {statusData.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-2xl font-bold text-gray-900">{statusData.statistics.totalUsers}</div>
            <div className="text-sm text-gray-600 mt-1">Total Users</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-2xl font-bold text-gray-900">{statusData.statistics.activeDesktopKeys}</div>
            <div className="text-sm text-gray-600 mt-1">Active Desktop Keys</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-600">{statusData.statistics.activeDesktopSessions}</div>
            <div className="text-sm text-gray-600 mt-1">Active Desktop Sessions</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-2xl font-bold text-gray-900">{statusData.statistics.totalScans}</div>
            <div className="text-sm text-gray-600 mt-1">Total Scans</div>
          </div>
        </div>
      )}

      {/* Configuration Status */}
      {statusData.configuration && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Environment Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ConfigSection title="Database" configs={statusData.configuration.database} />
            <ConfigSection title="Email Service" configs={statusData.configuration.email} />
            <ConfigSection title="OAuth Providers" configs={statusData.configuration.oauth} />
            <ConfigSection title="External APIs" configs={statusData.configuration.externalApis} />
            <ConfigSection title="JWT & Security" configs={statusData.configuration.jwt} />
          </div>
        </div>
      )}

      {/* Core Services */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Core Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statusData.services.core.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>
      </div>

      {/* Authentication Services */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Authentication Services
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statusData.services.authentication.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>
      </div>

      {/* External APIs */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">External APIs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statusData.services.external.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            ⚠ Warning: {error}
          </p>
        </div>
      )}
    </div>
  );
}
