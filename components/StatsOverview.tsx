'use client';

import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Stats {
  totalScans: number;
  threatsBlocked: number;
  safeUrls: number;
  lastScanAt: string | null;
  threatRate: number;
}

export default function StatsOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastScan = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Scans',
      value: stats.totalScans,
      icon: Shield,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Threats Blocked',
      value: stats.threatsBlocked,
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Safe URLs',
      value: stats.safeUrls,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Last Scan',
      value: formatLastScan(stats.lastScanAt),
      icon: Clock,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50',
      valueClass: 'text-2xl',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className={`${stat.bgColor} rounded-lg shadow-md border-2 border-gray-300 p-6 hover:shadow-lg transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className={`text-4xl font-extrabold text-gray-900 ${stat.valueClass || ''}`}>
              {stat.value}
            </div>
            {stat.label === 'Threats Blocked' && stats.totalScans > 0 && (
              <div className="mt-2 text-sm font-semibold text-gray-800">
                {stats.threatRate}% of total scans
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
