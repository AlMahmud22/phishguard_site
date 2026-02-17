'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Trash2, Eye, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import EngineAnalysisTabs from './EngineAnalysisTabs';

interface Scan {
  id: string;
  scanId: string;
  url: string;
  status: 'safe' | 'warning' | 'danger';
  score: number;
  confidence: number;
  verdict: {
    isSafe: boolean;
    isPhishing: boolean;
    isMalware: boolean;
    category: string;
  };
  timestamp: string;
  processingTime?: number;
  createdAt: string;
}

interface ScanHistoryTableProps {
  limit?: number;
  showSearch?: boolean;
 showFilters?: boolean;
  showPagination?: boolean;
}

export default function ScanHistoryTable({ 
  limit = 10,
  showSearch = true,
  showFilters = true,
  showPagination = true 
}: ScanHistoryTableProps) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [scanDetails, setScanDetails] = useState<any | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [page, search, statusFilter, verdictFilter, limit]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (verdictFilter !== 'all') params.append('verdict', verdictFilter);

      const response = await fetch(`/api/url/history?${params}`);
      const data = await response.json();

      if (data.success) {
        setScans(data.data.scans);
        setTotal(data.data.pagination.total);
        setPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewScanDetails = async (scanId: string) => {
    try {
      const response = await fetch(`/api/scan/${scanId}`);
      const data = await response.json();

      if (data.success) {
        setScanDetails(data.data);
        setSelectedScan(scanId);
      }
    } catch (error) {
      console.error('Failed to fetch scan details:', error);
    }
  };

  const deleteScan = async (scanId: string) => {
    if (!confirm('Are you sure you want to delete this scan?')) return;

    try {
      const response = await fetch(`/api/scan/${scanId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchHistory(); // Refresh list
      } else {
        alert('Failed to delete scan');
      }
    } catch (error) {
      console.error('Failed to delete scan:', error);
      alert('Failed to delete scan');
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusBadge = (scan: Scan) => {
    if (scan.verdict.isSafe || scan.score < 30) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
        <CheckCircle className="w-3 h-3" /> Safe
      </span>;
    }
    if (scan.score >= 60) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> Threat
      </span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> Suspicious
    </span>;
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Scan History</h2>
            <div className="flex gap-2">
              <button
                onClick={() => fetchHistory()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          {showSearch && (
            <div className="flex flex-col md:flex-row gap-2">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by URL..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filters */}
              {showFilters && (
                <>
                  <select
                    value={verdictFilter}
                    onChange={(e) => {
                      setVerdictFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Results</option>
                    <option value="safe">Safe Only</option>
                    <option value="threat">Threats Only</option>
                  </select>
                </>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No scans found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verdict
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium" title={scan.url}>
                        {truncateUrl(scan.url)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${
                          scan.score < 30 ? 'text-green-600' :
                          scan.score < 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {scan.score}
                        </div>
                        <span className="text-xs text-gray-500">/ 100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(scan)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(scan.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewScanDetails(scan.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteScan(scan.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {showPagination && pages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} scans
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    let pageNum;
                    if (pages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pages - 2) {
                      pageNum = pages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded-lg ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scan Details Modal */}
      {selectedScan && scanDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Scan Details</h2>
                <p className="text-sm text-gray-600 mt-1">{scanDetails.url}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedScan(null);
                  setScanDetails(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Eye className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {scanDetails.engines && (
                <EngineAnalysisTabs
                  engine2={scanDetails.engines.engine2 || scanDetails.analysis?.threat?.engineDetails?.engine2}
                  engine3={scanDetails.engines.engine3 || scanDetails.analysis?.threat?.engineDetails?.engine3}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
