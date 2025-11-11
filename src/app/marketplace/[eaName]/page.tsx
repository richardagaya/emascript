"use client";
import Image from "next/image";
import { useRouter, useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { authStateAtom } from '@/state/atoms';
import { useState, useEffect } from 'react';
import { getEAByName } from '@/data/eas';

// Import EA data from centralized data file
// Edit src/data/eas.ts to update EA information

export default function EADetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [authState] = useAtom(authStateAtom);
  const eaName = params?.eaName as string;
  const decodedEAName = eaName ? decodeURIComponent(eaName) : '';
  
  // Get EA details from centralized data file
  const eaDetails = getEAByName(decodedEAName);
  
  const handleBuyNow = () => {
    // Check if user is logged in
    if (!authState.isAuthed) {
      // Redirect to login with callback to checkout
      const checkoutUrl = `/marketplace/checkout?bot=${encodeURIComponent(decodedEAName)}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(checkoutUrl)}`);
      return;
    }
    
    // User is logged in, proceed to checkout
    router.push(`/marketplace/checkout?bot=${encodeURIComponent(decodedEAName)}`);
  };

  if (!eaDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black/[.90]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">EA Not Found</h2>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-4 py-2 bg-foreground text-background rounded-full hover:opacity-90"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-50 dark:bg-black/[.90]">
      {/* Header */}
      <div className="border-b border-black/[.08] dark:border-white/[.145] bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <button
            onClick={() => router.push('/marketplace')}
            className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Marketplace
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
              <div className="mb-4">
                <h1 className="text-3xl font-bold mb-2">{eaDetails.name}</h1>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 text-sm bg-black/[.08] dark:bg-white/[.12] rounded-full">
                    {eaDetails.category}
                  </span>
                </div>
              </div>
              <p className="text-lg text-black/70 dark:text-white/70 mb-4">
                {eaDetails.desc}
              </p>
              <div className="flex items-center gap-4 text-sm text-black/60 dark:text-white/60">
                <span>Version {eaDetails.version}</span>
                <span>•</span>
                <span>Updated {new Date(eaDetails.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
              <h2 className="text-2xl font-bold mb-4">Key Features</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {eaDetails.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-black/70 dark:text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Specifications */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
              <h2 className="text-2xl font-bold mb-4">Specifications</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                {Object.entries(eaDetails.specifications).map(([key, value]) => (
                  <div key={key} className="border-b border-black/[.08] dark:border-white/[.145] pb-2">
                    <dt className="text-sm font-medium text-black/60 dark:text-white/60">{key}</dt>
                    <dd className="text-base font-semibold text-black dark:text-white mt-1">{value as string}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Backtest Results */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
              <h2 className="text-2xl font-bold mb-4">Backtest Results</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(eaDetails.backtest).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-black/[.04] dark:bg-white/[.06] rounded-lg">
                    <dt className="text-sm text-black/60 dark:text-white/60 mb-1">{key}</dt>
                    <dd className="text-xl font-bold text-black dark:text-white">{value as string}</dd>
                  </div>
                ))}
              </div>
              <p className="text-xs text-black/50 dark:text-white/50 mt-4">
                * Past performance does not guarantee future results. Backtest results are for informational purposes only.
              </p>
            </div>

            {/* Requirements */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
              <h2 className="text-2xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-2">
                {eaDetails.requirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-black/70 dark:text-white/70">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-black/[.08] dark:border-white/[.145] p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-2">KES {eaDetails.price.toFixed(2)}</div>
                <p className="text-sm text-black/60 dark:text-white/60">One-time purchase</p>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full px-6 py-3 bg-foreground text-background rounded-full hover:opacity-90 font-medium mb-4"
              >
                Buy Now
              </button>

              <div className="space-y-3 text-sm text-black/70 dark:text-white/70">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Lifetime license</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Installation guide included</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Email support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

