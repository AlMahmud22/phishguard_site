'use client';

import { useState } from 'react';

export default function EmailTestPanel() {
  const [email, setEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-email');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      setConfig({ success: false, message: 'Failed to check configuration' });
    }
    setLoading(false);
  };

  const sendTestEmail = async () => {
    if (!email || !email.includes('@')) {
      setResult({ success: false, message: 'Please enter a valid email address' });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false, 
        message: 'Network error. Please try again.' 
      });
    }

    setTesting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Email System Test</h2>
          <p className="text-gray-600 text-sm">Verify SMTP configuration and send test emails</p>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="mb-6">
        <button
          onClick={checkConfig}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Checking...' : 'Check Configuration'}
        </button>

        {config && (
          <div className={`mt-4 p-4 rounded-lg border-l-4 ${
            config.configured 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              {config.configured ? '✅' : '❌'} Email Configuration
            </h3>
            {config.configured ? (
              <div className="text-sm space-y-1">
                <p><strong>Host:</strong> {config.host}</p>
                <p><strong>Port:</strong> {config.port}</p>
                <p><strong>User:</strong> {config.user}</p>
                <p><strong>Password:</strong> {config.password}</p>
                <p><strong>From:</strong> {config.from}</p>
              </div>
            ) : (
              <p className="text-sm text-red-600">
                {config.message || 'Email service not configured. Check EMAIL_USER and EMAIL_PASSWORD in .env'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-3">Send Test Email</h3>
        <div className="flex gap-3 mb-4">
          <input
            type="email"
            placeholder="recipient@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={testing}
          />
          <button
            onClick={sendTestEmail}
            disabled={testing || !email}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition-colors font-medium"
          >
            {testing ? 'Sending...' : 'Send Test'}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border-l-4 ${
            result.success 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <p className="font-medium flex items-center gap-2">
              {result.success ? '✅ Success' : '❌ Failed'}
            </p>
            <p className="text-sm mt-1">{result.message}</p>
          </div>
        )}
      </div>

      {/* Email Types Reference */}
      <div className="mt-6 border-t pt-6">
        <h3 className="font-semibold mb-3">Email Types Configured:</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Verification Email</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Welcome Email</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Password Reset</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Account Updates</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Weekly Reports</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Desktop Key Alerts</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Admin Alerts</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Account Deletion</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong className="inline-flex items-center gap-1"><svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 016 6v3.586l.707.707A1 1 0 0116 14H4a1 1 0 01-.707-1.707L4 11.586V8a6 6 0 016-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg> Tip:</strong> For production, consider using SendGrid, AWS SES, or Mailgun for better deliverability and higher sending limits.
        </p>
      </div>
    </div>
  );
}
