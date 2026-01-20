"use client";

import RoleGuard from "@/components/RoleGuard";
import ApiStatusDashboard from "@/components/ApiStatusDashboard";

/// Admin API Status page - displays real-time status of all APIs
export default function ApiStatusPage() {
  return (
    <RoleGuard allowedRoles={["admin", "tester"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Status Monitor</h1>
          <p className="mt-2 text-gray-600">
            Real-time monitoring of all system APIs, services, and external integrations.
          </p>
        </div>

        <ApiStatusDashboard />
      </div>
    </RoleGuard>
  );
}
