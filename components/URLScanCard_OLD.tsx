'use client';

import { useState } from 'react';
import { AlertCircle, Shield, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ScanProgress {
  engine1: 'pending' | 'running' | 'completed' | 'failed';
  engine2: 'pending' | 'running' | 'completed' | 'failed';
  engine3: 'pending' | 'running' | 'completed' | 'failed';
  overallProgress: number;
}

interface ScanResult {
  id: string;
  url: string;
  score: number;
  confidence: number;
  verdict: {
    isSafe: boolean;
    isPhishing: boolean;
    isMalware: boolean;
    category: string;
  };
  recommendation: string;
}

const ENGINE_INFO = {
  engine1: {
    name: 'Statistical Analysis',
    icon: '⚡',
    description: 'ML-based pattern detection',
  },
  engine2: {
    name: 'Multi-Vendor Consensus',
    icon: '🛡️',
    description: '70+ security vendors',
  },
  engine3: {
    name: 'Behavioral Analysis',
    icon: '🔬',
    description: 'DOM and network inspection',
  },
};

export default function URLScanCard() {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);

  const handleScan = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setError(null);
    setIsScanning(true);
    setResult(null);
    setProgress({
      engine1: 'pending',
      engine2: 'pending',
      engine3: 'pending',
      overallProgress: 0,
    });

    try {
      // Submit scan
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, source: 'manual' }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Scan failed');
      }

      const newScanId = data.data.scanId;
      setScanId(newScanId);

      // Simulate progress (since actual progress tracking would require WebSockets)
      simulateProgress();

      // Poll for results
      pollForResults(newScanId);

    } catch (err: any) {
      setError(err.message || 'Failed to scan URL');
      setIsScanning(false);
      setProgress(null);
    }
  };

  const simulateProgress = () => {
    // Engine 1 (fast)
    setTimeout(() => {
      setProgress(p => p ? { ...p, engine1: 'running', overallProgress: 10 } : null);
    }, 500);
    
    setTimeout(() => {
      setProgress(p => p ? { ...p, engine1: 'completed', overallProgress: 33 } : null);
    }, 2000);

    // Engine 2
    setTimeout(() => {
      setProgress(p => p ? { ...p, engine2: 'running' } : null);
    }, 2500);
    
    setTimeout(() => {
      setProgress(p => p ? { ...p, engine2: 'completed', overallProgress: 66 } : null);
    }, 6000);

    // Engine 3
    setTimeout(() => {
      setProgress(p => p ? { ...p, engine3: 'running' } : null);
    }, 6500);
  };

  const pollForResults = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Scan timeout - please try again');
        setIsScanning(false);
        return;
      }

      try {
        const response = await fetch(`/api/scan/${id}`);
        const data = await response.json();

        if (data.success && data.data) {
          const scanData = data.data;
          
          // Check if scan is complete (has a score > 0)
          if (scanData.score > 0) {
            setResult({
              id: scanData.id,
              url: scanData.url,
              score: scanData.score,
              confidence: scanData.confidence * 100,
              verdict: scanData.verdict,
              recommendation: scanData.recommendation,
            });
            
            setProgress(p => p ? { ...p, engine3: 'completed', overallProgress: 100 } : null);
            setIsScanning(false);
            return;
          }
        }

        // Continue polling
        attempts++;
        setTimeout(poll, 1000);

      } catch (err) {
        attempts++;
        setTimeout(poll, 1000);
      }
    };

    setTimeout(poll, 2000); // Start polling after 2 seconds
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getProgressBarColor = (engine: keyof typeof ENGINE_INFO) => {
    if (!progress) return 'bg-gray-200';
    const status = progress[engine];
    if (status === 'completed') return 'bg-green-500';
    if (status === 'running') return 'bg-blue-500';
    if (status === 'failed') return 'bg-red-500';
    return 'bg-gray-200';
  };

  const getProgressWidth = (engine: keyof typeof ENGINE_INFO) => {
    if (!progress) return '0%';
    const status = progress[engine];
    if (status === 'completed') return '100%';
    if (status === 'running') return '50%';
    return '0%';
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low Risk', color: 'text-green-600', bg: 'bg-green-50' };
    if (score < 60) return { level: 'Medium Risk', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'High Risk', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Search className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Scan URL for Threats</h2>
          <p className="text-sm text-gray-600">Analyze any URL with our 3-engine detection system</p>
        </div>
      </div>

      {/* URL Input */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleScan()}
            placeholder="https://example.com/suspicious-link"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isScanning}
          />
          <button
            onClick={handleScan}
            disabled={isScanning || !url.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isScanning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Scan'
            )}
          </button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Progress Indicators */}
      {progress && (
        <div className="space-y-4 mb-6">
          {(Object.keys(ENGINE_INFO) as Array<keyof typeof ENGINE_INFO>).map((engine) => (
            <div key={engine}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(progress[engine])}
                  <span className="text-sm font-medium">
                    {ENGINE_INFO[engine].icon} {ENGINE_INFO[engine].name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {ENGINE_INFO[engine].description}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressBarColor(engine)} transition-all duration-500`}
                  style={{ width: getProgressWidth(engine) }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`p-6 rounded-lg border-2 ${
          result.verdict.isSafe ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              {result.verdict.isSafe ? (
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-lg font-bold">SAFE</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertCircle className="w-6 h-6" />
                  <span className="text-lg font-bold">THREAT DETECTED</span>
                </div>
              )}
              <div className="text-sm text-gray-700">
                <div className="font-semibold">Risk Score: {result.score}/100</div>
                <div>Confidence: {Math.round(result.confidence)}%</div>
                <div>Category: {result.verdict.category}</div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg ${getRiskLevel(result.score).bg}`}>
              <span className={`font-bold ${getRiskLevel(result.score).color}`}>
                {getRiskLevel(result.score).level}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">📋 Recommendation:</h3>
            <p className="text-sm text-gray-800">{result.recommendation}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = `/dashboard/history?scan=${result.id}`}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Full Analysis
            </button>
            <button
              onClick={() => {
                setResult(null);
                setProgress(null);
                setUrl('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              New Scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
