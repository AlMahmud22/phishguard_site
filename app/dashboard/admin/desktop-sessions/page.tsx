"use client";

import RoleGuard from "@/components/RoleGuard";
import DesktopSessionsTable from "@/components/DesktopSessionsTable";

/// Admin Desktop Sessions page - displays connected desktop applications
export default function DesktopSessionsPage() {
  return (
    <RoleGuard allowedRoles={["admin", "tester"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Desktop App Monitoring</h1>
          <p className="mt-2 text-gray-300">
            Monitor all connected desktop applications, track active sessions, and manage device connections in real-time.
          </p>
        </div>

        <DesktopSessionsTable />
      </div>
    </RoleGuard>
  );
}
