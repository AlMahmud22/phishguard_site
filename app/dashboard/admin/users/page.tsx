"use client";

import RoleGuard from "@/components/RoleGuard";
import AdminUsersTable from "@/components/AdminUsersTable";

/// Admin Users page - displays and manages all users
export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={["admin", "tester"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="mt-2 text-gray-300">
            View and manage all registered users, update roles, and monitor activity.
          </p>
        </div>

        <AdminUsersTable />
      </div>
    </RoleGuard>
  );
}
