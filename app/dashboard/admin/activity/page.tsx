"use client";

import RoleGuard from "@/components/RoleGuard";
import ActivityDashboard from "@/components/ActivityDashboard";

/// Admin Activity page - displays real-time activity metrics
export const dynamic = 'force-dynamic'

export default function AdminActivityPage() {
  return (
    <RoleGuard allowedRoles={["admin", "tester"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Monitoring</h1>
          <p className="mt-2 text-gray-600">
            Real-time activity metrics, system health, and threat monitoring dashboard.
          </p>
        </div>

        <ActivityDashboard />
      </div>
    </RoleGuard>
  );
}
