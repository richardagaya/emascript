"use client";

import { useState } from "react";

interface OrderCompletionResult {
  success?: boolean;
  message?: string;
  warning?: string;
  emailError?: string;
  error?: string;
  details?: string;
  email?: string;
  botName?: string;
  orderId?: string;
}

export default function CompleteOrderPage() {
  const [orderId, setOrderId] = useState("ORD-1763537215290-2SS88GO");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderCompletionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/complete-order-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to complete order");
        setResult(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Manual Order Completion</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Order ID
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="ORD-xxx"
            />
          </div>

          <button
            onClick={handleComplete}
            disabled={loading || !orderId}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              "Complete Order"
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <h3 className="text-red-900 dark:text-red-100 font-semibold mb-2">
              ❌ Error
            </h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {result && !error && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <h3 className="text-green-900 dark:text-green-100 font-semibold mb-2">
              ✅ Success
            </h3>
            <div className="text-sm text-green-700 dark:text-green-300">
              {result.message && <p className="mb-2">{result.message}</p>}
              {result.warning && (
                <p className="mb-2 text-yellow-600 dark:text-yellow-400">
                  ⚠️ {result.warning}
                </p>
              )}
              {result.email && (
                <p className="mb-1">
                  <strong>Email:</strong> {result.email}
                </p>
              )}
              {result.botName && (
                <p className="mb-1">
                  <strong>EA:</strong> {result.botName}
                </p>
              )}
              {result.orderId && (
                <p className="mb-1">
                  <strong>Order ID:</strong> {result.orderId}
                </p>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Full Response:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2"><strong>What this does:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Updates order status to &ldquo;completed&rdquo;</li>
            <li>Adds the EA to the user&apos;s account</li>
            <li>Sends confirmation email</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

