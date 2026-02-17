"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import AdminUsersTable from "@/components/AdminUsersTable";
import AdminLogsTable from "@/components/AdminLogsTable";
import EmailTestPanel from "@/components/EmailTestPanel";
import SetupFileManager from "@/components/SetupFileManager";

const FloatingShapes = dynamic(() => import("@/components/three/FloatingShapes"), { ssr: false });

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "logs", label: "Activity Logs" },
    { id: "setup", label: "Setup Files" },
    { id: "email", label: "Email" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight">
              Admin <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-xl text-gray-600">
              Manage users, monitor system activity, and configure settings
            </p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">Welcome, Admin</h2>
                <p className="text-gray-600">
                  Manage your PhishGuard system from this dashboard
                </p>
              </div>
            </div>
          </motion.div>

          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-md p-2 border border-gray-200">
              <nav className="flex space-x-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-200
                      ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && (
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Users", value: "Loading...", subtext: "Registered accounts", color: "blue",  icon: "👥" },
                  { label: "Total Scans", value: "Loading...", subtext: "Performed today", color: "green", icon: "🔍" },
                  { label: "Threats Blocked", value: "Loading...", subtext: "Malicious URLs detected", color: "red", icon: "🛡️" },
                  { label: "System Health", value: "Healthy", subtext: "All systems operational", color: "purple", icon: "✅" }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                    <p className={`text-4xl font-black mb-2 ${
                      stat.color === 'blue' ? 'text-blue-600' :
                      stat.color === 'green' ? 'text-green-600' :
                      stat.color === 'red' ? 'text-red-600' : 'text-purple-600'
                    }`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">{stat.subtext}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "System Analytics", desc: "View detailed reports and statistics", action: "View Analytics", color: "blue" },
                  { title: "Configuration", desc: "Manage system settings and API keys", action: "Configure System", color: "purple" },
                  { title: "Email Reports", desc: "Send weekly reports manually", action: "Trigger Reports", color: "green" }
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    className="bg-white rounded-xl shadow-md p-8 border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  >
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{card.title}</h3>
                    <p className="text-gray-600 mb-6">{card.desc}</p>
                    <button className={`w-full px-6 py-3 ${
                      card.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                      card.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'
                    } text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200`}>{card.action}</button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div 
              className="bg-white rounded-2xl shadow-md p-8 border border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">User Management</h2>
                <p className="text-gray-600">
                  View and manage all registered users, modify roles, and monitor account status
                </p>
              </div>
              <AdminUsersTable />
            </motion.div>
          )}

          {activeTab === "logs" && (
            <motion.div 
              className="bg-white rounded-2xl shadow-md p-8 border border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Activity Logs</h2>
                <p className="text-gray-600">
                  Monitor system activity and user actions
                </p>
              </div>
              <AdminLogsTable />
            </motion.div>
          )}

          {activeTab === "setup" && (
            <motion.div 
              className="bg-white rounded-2xl shadow-md p-8 border border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <SetupFileManager />
            </motion.div>
          )}

          {activeTab === "email" && (
            <motion.div
              className="bg-white rounded-2xl shadow-md p-8 border border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <EmailTestPanel />
            </motion.div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
