"use client";

import { useAtom } from "jotai";
import { authStateAtom } from "@/state/atoms";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface PurchasedEA {
  id: string;
  eaId: string;
  eaName: string;
  name: string;
  orderId?: string;
  purchaseDate: string;
  version: string;
  license: string;
  thumbnail: string;
  description: string;
  downloadCount?: number;
  lastDownloaded?: string | null;
}

function DashboardContent() {
  const [authState] = useAtom(authStateAtom);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [purchasedEAs, setPurchasedEAs] = useState<PurchasedEA[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const handleDownload = async (eaId: string) => {
    setDownloading(eaId);
    try {
      const response = await fetch(`/api/download?eaId=${eaId}`);
      const data = await response.json();

      if (response.ok && data.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Refresh the EA list to update download count
        const updatedData = await fetch("/api/user/purchased-eas").then(r => r.json());
        if (updatedData.purchasedEAs) {
          setPurchasedEAs(updatedData.purchasedEAs);
        }
      } else {
        alert(`Download failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download EA. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadGuide = async () => {
    try {
      const response = await fetch('/api/download-guide');
      const data = await response.json();

      if (response.ok && data.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.fileName || 'mt5-installation-guide.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(`Download failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Download guide error:', error);
      alert('Failed to download installation guide. Please try again.');
    }
  };

  const handleViewDetails = (eaName: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    router.push(`/marketplace/${encodeURIComponent(eaName)}`);
  };

  useEffect(() => {
    // Check for payment success in URL
    const paymentStatus = searchParams.get('payment');
    const orderId = searchParams.get('orderId');
    if (paymentStatus === 'success' && orderId) {
      setPaymentSuccess(orderId);
      // Clear the URL parameters
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Check authentication and load user's purchased EAs
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          router.push("/login?callbackUrl=/dashboard");
        } else {
          // Fetch user's purchased EAs from Firestore
          const loadEAs = async () => {
            const data = await fetch("/api/user/purchased-eas").then(r => r.json());
            if (data.purchasedEAs) {
              setPurchasedEAs(data.purchasedEAs);
            }
          };
          await loadEAs();
          
          // If payment was successful, try to complete the order in case webhook failed
          if (paymentSuccess) {
            const orderId = searchParams.get('orderId');
            if (orderId) {
              console.log('🔄 Payment success detected, completing order:', orderId);
              try {
                const completeRes = await fetch('/api/complete-order-manual', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId }),
                });
                const completeData = await completeRes.json();
                console.log('✅ Order completion result:', completeData);
                
                // Reload EAs after completion
                setTimeout(() => {
                  loadEAs();
                }, 1000);
              } catch (error) {
                console.error('❌ Failed to complete order:', error);
                // Still reload EAs in case webhook worked
                setTimeout(() => {
                  loadEAs();
                }, 2000);
              }
            } else {
              // No orderId, just reload after delay
              setTimeout(() => {
                loadEAs();
              }, 2000);
            }
          }
          
          setIsLoading(false);
        }
      } catch {
        router.push("/login?callbackUrl=/dashboard");
      }
    };
    checkAuth();
  }, [router, paymentSuccess, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  const firstName = authState.displayName?.includes("@") 
    ? authState.displayName.split("@")[0].split(" ")[0]
    : authState.displayName?.split(" ")[0] || "User";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* Payment Success Message */}
      {paymentSuccess && (
        <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">Payment Successful!</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your order {paymentSuccess} has been processed. Your EA should appear below shortly. 
                A confirmation email has been sent to your email address.
              </p>
            </div>
            <button
              onClick={() => setPaymentSuccess(null)}
              className="ml-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-2 text-black/70 dark:text-white/70">
          Manage your Expert Advisors and stay updated with the latest features.
        </p>
      </div>

      {/* Quick Actions */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/marketplace"
            className="group rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg"
          >
            <div className="text-2xl mb-2">🛒</div>
            <h3 className="font-semibold mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Browse Marketplace
            </h3>
            <p className="text-xs text-black/60 dark:text-white/60">
              Discover new trading bots
            </p>
          </Link>

          <button className="group text-left rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 hover:border-green-500 dark:hover:border-green-400 transition-all hover:shadow-lg">
            <div className="text-2xl mb-2">📥</div>
            <h3 className="font-semibold mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              Download All EAs
            </h3>
            <p className="text-xs text-black/60 dark:text-white/60">
              Get the latest versions
            </p>
          </button>

          <Link
            href="/support"
            className="group rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 hover:border-purple-500 dark:hover:border-purple-400 transition-all hover:shadow-lg"
          >
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-semibold mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Get Support
            </h3>
            <p className="text-xs text-black/60 dark:text-white/60">
              We&apos;re here to help
            </p>
          </Link>

          <Link
            href="/installation-guide"
            className="group rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 hover:border-orange-500 dark:hover:border-orange-400 transition-all hover:shadow-lg"
          >
            <div className="text-2xl mb-2">📚</div>
            <h3 className="font-semibold mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              Installation Guide
            </h3>
            <p className="text-xs text-black/60 dark:text-white/60">
              Step-by-step tutorials
            </p>
          </Link>
        </div>
      </section>

      {/* My Bots Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Expert Advisors</h2>
          <span className="text-sm text-black/60 dark:text-white/60">
            {purchasedEAs.length} {purchasedEAs.length === 1 ? "EA" : "EAs"}
          </span>
        </div>
        
        {purchasedEAs.length === 0 ? (
          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-12 text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">No EAs Yet</h3>
            <p className="text-black/70 dark:text-white/70 mb-6">
              Start building your automated trading portfolio
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center rounded-full bg-foreground text-background px-6 py-3 font-medium hover:opacity-90"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {purchasedEAs.map((ea) => {
              const purchaseDate = new Date(ea.purchaseDate);
              
              return (
                <div
                  key={ea.id}
                  className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{ea.thumbnail}</div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {ea.license}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1">{ea.name}</h3>
                  <p className="text-xs text-black/60 dark:text-white/60 mb-3 line-clamp-2">
                    {ea.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4 text-xs text-black/60 dark:text-white/60">
                    <span>v{ea.version}</span>
                    <span>•</span>
                    <span>Purchased {purchaseDate.toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDownload(ea.eaId)}
                      disabled={downloading === ea.eaId}
                      className="flex-1 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {downloading === ea.eaId ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
                          Downloading...
                        </>
                      ) : (
                        'Download'
                      )}
                    </button>
                    <button 
                      onClick={handleDownloadGuide}
                      className="rounded-lg border border-black/[.08] dark:border-white/[.145] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] transition text-center flex items-center gap-1"
                      title="Download MT5 Installation Guide (PDF)"
                    >
                      <span>📄</span>
                      PDF Guide
                    </button>
                  </div>
                  <button 
                    onClick={(e) => handleViewDetails(ea.name, e)}
                    className="w-full mt-2 rounded-lg border border-black/[.08] dark:border-white/[.145] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                  >
                    View details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
