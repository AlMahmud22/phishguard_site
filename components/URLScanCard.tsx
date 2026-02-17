'use client';

import { useState } from 'react';
import { Search, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ScanResult {
  score: number;
  verdict: { isSafe: boolean; category: string };
  recommendation: string;
  confidence: number;
}

export default function URLScanCard() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ step1: 0, step2: 0, step3: 0 });
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    setProgress({ step1: 0, step2: 0, step3: 0 });
    setCurrentStep('Initiating scan...');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Scan failed');

      const scanId = data.data.scanId;
      
      // Simulate natural processing steps
      const steps = [
        'Analyzing URL structure...',
        'Checking security databases...',
        'Inspecting page content...',
        'Evaluating threat indicators...',
        'Generating report...'
      ];
      let stepIndex = 0;
      
      const progressInterval = setInterval(() => {
        setProgress(p => ({
          step1: Math.min(p.step1 + Math.random() * 18, 100),
          step2: Math.min(p.step2 + Math.random() * 15, 100),
          step3: Math.min(p.step3 + Math.random() * 12, 100),
        }));
        
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex]);
          stepIndex++;
        }
      }, 1200);

      // Poll for results
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        const scanRes = await fetch(`/api/scan/${scanId}`);
        const scanData = await scanRes.json();

        if (scanData.success && scanData.data.status !== 'pending') {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          setProgress({ step1: 100, step2: 100, step3: 100 });
          setCurrentStep('Scan complete!');
          setResult(scanData.data);
          setLoading(false);
        }

        if (++attempts > 30) {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          setError('Scan timeout');
          setLoading(false);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to scan URL');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Shield className="w-6 h-6 text-blue-600" />
        URL Security Scanner
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter URL to scan..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          onKeyDown={e => e.key === 'Enter' && handleScan()}
        />
        <button
          onClick={handleScan}
          disabled={loading || !url.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Scan'}
        </button>
      </div>

      {loading && (
        <div className="space-y-4 mb-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{currentStep}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(progress.step1 + progress.step2 + progress.step3) / 3}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {result && (
        <div className={`rounded-lg p-4 border-2 ${
          result.verdict.isSafe
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {result.verdict.isSafe ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <div className="text-2xl font-bold">{result.score}/100</div>
                <div className="text-sm text-gray-600">Risk Score</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{result.confidence}%</div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
          </div>
          <p className="text-sm text-gray-700">{result.recommendation}</p>
        </div>
      )}
    </div>
  );
}
