'use client';

import { useState } from 'react';

export default function AdminFulfillmentPage() {
  const [orderId, setOrderId] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    orderId?: string;
    email?: string;
    botName?: string;
    status?: string;
    eaDelivered?: boolean;
    eaDeliveryError?: string;
    emailSent?: boolean;
    emailError?: string;
    userHasEA?: boolean;
    results?: {
      eaDelivered: boolean;
      emailSent: boolean;
      eaError: string | null;
      emailError: string | null;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    if (!orderId || !adminSecret) {
      setError('Please enter both Order ID and Admin Secret');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/admin/retry-fulfillment?orderId=${encodeURIComponent(orderId)}&adminSecret=${encodeURIComponent(adminSecret)}`
      );
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to check status');
      }
    } catch (err) {
      setError('Network error: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const retryFulfillment = async () => {
    if (!orderId || !adminSecret) {
      setError('Please enter both Order ID and Admin Secret');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/retry-fulfillment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, adminSecret }),
      });
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to retry fulfillment');
      }
    } catch (err) {
      setError('Network error: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Admin: Order Fulfillment Manager
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Check or Retry Order Fulfillment
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="ORD-1234567890-ABCDEF"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Secret
              </label>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Your admin secret key"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={checkStatus}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isLoading ? 'Loading...' : 'Check Status'}
              </button>

              <button
                onClick={retryFulfillment}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isLoading ? 'Loading...' : 'Retry Fulfillment'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            <strong>Error: </strong>{error}
          </div>
        )}

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Result
            </h3>
            
            <div className="space-y-3">
              {result.orderId && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Order ID:</span>
                  <span className="text-gray-900 dark:text-white font-mono">{result.orderId}</span>
                </div>
              )}

              {result.email && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                  <span className="text-gray-900 dark:text-white">{result.email}</span>
                </div>
              )}

              {result.botName && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Bot Name:</span>
                  <span className="text-gray-900 dark:text-white">{result.botName}</span>
                </div>
              )}

              {result.status && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Payment Status:</span>
                  <span className={`font-semibold ${
                    result.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {result.status}
                  </span>
                </div>
              )}

              {result.eaDelivered !== undefined && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">EA Delivered:</span>
                  <span className={`font-semibold ${
                    result.eaDelivered ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {result.eaDelivered ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              )}

              {result.userHasEA !== undefined && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">User Has EA:</span>
                  <span className={`font-semibold ${
                    result.userHasEA ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {result.userHasEA ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              )}

              {result.emailSent !== undefined && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email Sent:</span>
                  <span className={`font-semibold ${
                    result.emailSent ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {result.emailSent ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              )}

              {result.eaDeliveryError && (
                <div className="py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">EA Delivery Error:</span>
                  <pre className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-x-auto">
                    {result.eaDeliveryError}
                  </pre>
                </div>
              )}

              {result.emailError && (
                <div className="py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email Error:</span>
                  <pre className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-x-auto">
                    {result.emailError}
                  </pre>
                </div>
              )}

              {result.results && (
                <div className="py-2 mt-4">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Full Results:</span>
                  <pre className="mt-2 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
                    {JSON.stringify(result.results, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-200">
            📋 Usage Instructions
          </h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800 dark:text-blue-300">
            <li><strong>Check Status:</strong> View current fulfillment status for an order</li>
            <li><strong>Retry Fulfillment:</strong> Manually retry EA delivery and email sending for failed orders</li>
            <li>Only works for orders with <strong>completed</strong> payment status</li>
            <li>Admin secret must be set in environment variable <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">ADMIN_SECRET</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

