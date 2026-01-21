"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminUsersTable from "@/components/AdminUsersTable";
import AdminLogsTable from "@/components/AdminLogsTable";
import EmailTestPanel from "@/components/EmailTestPanel";
import SetupFileManager from "@/components/SetupFileManager";
import { motion } from "framer-motion";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  if (session.user.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "logs", label: "Activity Logs", icon: "📝" },
    { id: "setup", label: "Setup Files", icon: "💿" },
    { id: "email", label: "Email", icon: "📧" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage users, monitor system activity, upload setup files, and configure settings
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

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

              {/* System Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                  <h3 className="font-semibold mb-2">📊 System Analytics</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    View detailed reports and statistics
                  </p>
                  <button className="btn-primary text-sm">View Analytics</button>
                </div>

                <div className="card">
                  <h3 className="font-semibold mb-2">⚙️ Configuration</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage system settings and API keys
                  </p>
                  <button className="btn-primary text-sm">Configure System</button>
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
          )}

          {activeTab === "users" && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">User Management</h2>
                <p className="text-sm text-gray-600">
                  View and manage all registered users, modify roles, and monitor account status
                </p>
              </div>
              <AdminUsersTable />
            </div>
          )}

          {activeTab === "logs" && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Recent Activity</h2>
                <p className="text-sm text-gray-600">
                  Monitor system-wide activity and user actions
                </p>
              </div>
              <AdminLogsTable />
            </div>
          )}

          {activeTab === "setup" && (
            <SetupFileManager />
          )}

          {activeTab === "email" && (
            <EmailTestPanel />
          )}
        </motion.div>
      </div>
    </div>
  );
}
