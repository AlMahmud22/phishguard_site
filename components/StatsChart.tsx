"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { UserStats } from "@/types";

interface StatsChartProps {
  stats: UserStats;
  type?: "line" | "bar" | "pie";
}

/// StatsChart component displays visual analytics using Recharts
/// supports line, bar, and pie chart types for different data views
export default function StatsChart({ stats, type = "line" }: StatsChartProps) {
  /// color palette for charts
  const COLORS = {
    phishing: "#ef4444",
    safe: "#10b981",
    primary: "#3b82f6",
  };

  /// prepare data for pie chart (phishing vs safe distribution)
  const pieData = [
    { name: "Phishing", value: stats.phishingDetected, color: COLORS.phishing },
    { name: "Safe", value: stats.safeUrls, color: COLORS.safe },
  ];

  /// render line chart showing scan trends over time
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={stats.scansByDate}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="scans"
            stroke={COLORS.primary}
            strokeWidth={2}
            name="Total Scans"
            dot={{ fill: COLORS.primary }}
          />
          <Line
            type="monotone"
            dataKey="phishing"
            stroke={COLORS.phishing}
            strokeWidth={2}
            name="Phishing"
            dot={{ fill: COLORS.phishing }}
          />
          <Line
            type="monotone"
            dataKey="safe"
            stroke={COLORS.safe}
            strokeWidth={2}
            name="Safe"
            dot={{ fill: COLORS.safe }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  /// render bar chart for comparison view
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={stats.scansByDate}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
            }}
          />
          <Legend />
          <Bar dataKey="phishing" fill={COLORS.phishing} name="Phishing" />
          <Bar dataKey="safe" fill={COLORS.safe} name="Safe" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /// render pie chart for distribution overview
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) => {
              const { name, percent } = props;
              return `${name}: ${((percent as number) * 100).toFixed(0)}%`;
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

/// TopThreatsChart displays most frequently detected phishing URLs
export function TopThreatsChart({ threats }: { threats?: { url: string; count: number }[] }) {
  return (
    <div className="space-y-3">
      {!threats || threats.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No threats detected yet</p>
      ) : (
        threats.map((threat, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-semibold text-sm">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{threat.url}</p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(threat.count / Math.max(...threats.map(t => t.count))) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{threat.count} scans</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
