'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, AlertCircle, CheckCircle, X } from 'lucide-react';

interface Engine2Data {
  available: boolean;
  score?: number;
  engines?: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
    total: number;
  };
  vendorResults?: Array<{
    vendor: string;
    category: string;
    result: string;
    method: string;
  }>;
  metadata?: {
    httpResponseCode?: number;
    title?: string;
    reputation?: number;
    categories?: Array<{ vendor: string; category: string }>;
    trackers?: string[];
  };
}

interface Engine3Data {
  available: boolean;
  score?: number;
  task?: {
    uuid: string;
    reportURL: string;
    screenshotURL: string;
  };
  verdict?: {
    malicious: boolean;
    score: number;
    categories: string[];
    brands: string[];
    tags: string[];
  };
  page?: {
    domain: string;
    ip: string;
    country: string;
    server: string;
    title: string;
  };
  stats?: {
    requests: number;
    ips: number;
    countries: number;
    domains: number;
    dataLength: number;
  };
  network?: {
    ips: string[];
    domains: string[];
    urls: string[];
  };
}

interface EngineAnalysisTabsProps {
  engine2: Engine2Data;
  engine3: Engine3Data;
}

export default function EngineAnalysisTabs({ engine2, engine3 }: EngineAnalysisTabsProps) {
  const [activeTab, setActiveTab] = useState<'vendors' | 'behavioral'>('vendors');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    features: true,
    factors: true,
    vendors: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getFeatureIcon = (value: boolean | number, threshold?: number) => {
    if (typeof value === 'boolean') {
      return value ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (threshold && value > threshold) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const tabs = [
    { id: 'vendors' as const, name: 'Security Analysis', icon: '🛡️', subtitle: 'Threat detection results' },
    { id: 'behavioral' as const, name: 'Behavioral Analysis', icon: '🔬', subtitle: 'Page behavior inspection' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-left transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{tab.icon}</span>
                <span className={`font-semibold ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-900'
                }`}>{tab.name}</span>
              </div>
              <div className="text-xs text-gray-600 ml-7">{tab.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            {!engine2.available ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Security analysis data not available</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Security Assessment</h3>
                    <p className="text-sm text-gray-600">Comprehensive threat detection analysis</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{engine2.score}/100</div>
                    <div className="text-sm text-gray-600">Risk Score</div>
                  </div>
                </div>

                {/* Detection Summary */}
                {engine2.engines && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{engine2.engines.malicious}</div>
                      <div className="text-sm text-gray-600">Malicious</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{engine2.engines.suspicious}</div>
                      <div className="text-sm text-gray-600">Suspicious</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{engine2.engines.harmless}</div>
                      <div className="text-sm text-gray-600">Clean</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-600">{engine2.engines.undetected}</div>
                      <div className="text-sm text-gray-600">Undetected</div>
                    </div>
                  </div>
                )}

                {/* Vendor Results */}
                {engine2.vendorResults && engine2.vendorResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('vendors')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <h4 className="font-semibold text-gray-900">
                        Detection Sources ({engine2.vendorResults.length} sources)
                      </h4>
                      {expandedSections.vendors ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {expandedSections.vendors && (
                      <div className="p-4 border-t border-gray-200">
                        <div className="max-h-96 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">Source</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">Classification</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {engine2.vendorResults.map((vendor, index) => (
                                <tr key={index} className="border-t border-gray-100">
                                  <td className="px-3 py-2 text-gray-700">Source #{index + 1}</td>
                                  <td className="px-3 py-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      vendor.category === 'malicious' ? 'bg-red-100 text-red-700' :
                                      vendor.category === 'suspicious' ? 'bg-yellow-100 text-yellow-700' :
                                      vendor.category === 'harmless' ? 'bg-green-100 text-green-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {vendor.category}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">{vendor.result}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                {engine2.metadata && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {engine2.metadata.httpResponseCode && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">HTTP Response</div>
                        <div className="text-lg font-semibold">{engine2.metadata.httpResponseCode}</div>
                      </div>
                    )}
                    {engine2.metadata.reputation !== undefined && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Reputation</div>
                        <div className="text-lg font-semibold">{engine2.metadata.reputation}/100</div>
                      </div>
                    )}
                    {engine2.metadata.title && (
                      <div className="md:col-span-2">
                        <div className="text-sm font-medium text-gray-600">Page Title</div>
                        <div className="text-sm">{engine2.metadata.title}</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'behavioral' && (
          <div className="space-y-6">
            {!engine3.available ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Behavioral analysis data not available</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Behavioral Analysis</h3>
                    <p className="text-sm text-gray-600">Page interaction and network activity</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{engine3.score}/100</div>
                    <div className="text-sm text-gray-600">Risk Score</div>
                  </div>
                </div>

                {/* Page Info */}
                {engine3.page && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Domain</div>
                      <div className="font-semibold">{engine3.page.domain}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">IP Address</div>
                      <div className="font-semibold">{engine3.page.ip}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Country</div>
                      <div className="font-semibold">{engine3.page.country}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Server</div>
                      <div className="font-semibold">{engine3.page.server}</div>
                    </div>
                  </div>
                )}

                {/* Verdict */}
                {engine3.verdict && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Verdict</h4>
                    <div className="space-y-2">
                      {engine3.verdict.categories.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Categories: </span>
                          <span className="text-sm font-medium">{engine3.verdict.categories.join(', ')}</span>
                        </div>
                      )}
                      {engine3.verdict.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {engine3.verdict.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Network Stats */}
                {engine3.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{engine3.stats.requests}</div>
                      <div className="text-sm text-gray-600">Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{engine3.stats.ips}</div>
                      <div className="text-sm text-gray-600">IPs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{engine3.stats.domains}</div>
                      <div className="text-sm text-gray-600">Domains</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{engine3.stats.countries}</div>
                      <div className="text-sm text-gray-600">Countries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {(engine3.stats.dataLength / 1024 / 1024).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">MB</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
