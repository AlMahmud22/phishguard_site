import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import AdminUsersTable from "@/components/AdminUsersTable";
import AdminLogsTable from "@/components/AdminLogsTable";
import EmailTestPanel from "@/components/EmailTestPanel";

export default async function AdminPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage users, monitor system activity, and configure settings
          </p>
        </div>

        {/* Admin Info Card */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Welcome, Admin!</h2>
              <p className="text-sm text-gray-600">
                You have full administrative access to the PhishGuard system.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Role:</strong> {session.user.role}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> {session.user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">Loading...</p>
            <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Scans</h3>
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">Loading...</p>
            <p className="text-xs text-gray-500 mt-1">Performed today</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Threats Blocked</h3>
              <span className="text-2xl">🛡️</span>
            </div>
            <p className="text-3xl font-bold text-red-600">Loading...</p>
            <p className="text-xs text-gray-500 mt-1">Malicious URLs detected</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">System Health</h3>
              <span className="text-2xl">💚</span>
            </div>
            <p className="text-3xl font-bold text-green-600">Healthy</p>
            <p className="text-xs text-gray-500 mt-1">All systems operational</p>
          </div>
        </div>

        {/* User Management Section */}
        <div className="card mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">User Management</h2>
            <p className="text-sm text-gray-600">
              View and manage all registered users, modify roles, and monitor account status
            </p>
          </div>
          <AdminUsersTable />
        </div>

        {/* Activity Logs Section */}
        <div className="card mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Recent Activity</h2>
            <p className="text-sm text-gray-600">
              Monitor system-wide activity and user actions
            </p>
          </div>
          <AdminLogsTable />
        </div>

        {/* Email System Test */}
        <div className="mb-8">
          <EmailTestPanel />
        </div>

        {/* System Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-2">📊 System Analytics</h3>
            <p className="text-sm text-gray-600 mb-4">
              View detailed reports and statistics
            </p>
            <a href="/admin/analytics" className="btn-primary text-sm inline-block">
              View Analytics
            </a>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">⚙️ Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage system settings and API keys
            </p>
            <a href="/admin/settings" className="btn-primary text-sm inline-block">
              Configure System
            </a>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">📧 Email Reports</h3>
            <p className="text-sm text-gray-600 mb-4">
              Send weekly reports manually
            </p>
            <button className="btn-primary text-sm">Trigger Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
}
