"use client";

import { useAtom } from "jotai";
import { authStateAtom } from "@/state/atoms";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [authState] = useAtom(authStateAtom);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [purchasedEAs, setPurchasedEAs] = useState<any[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (eaId: string, eaName: string) => {
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

  useEffect(() => {
    // Check authentication and load user's purchased EAs
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          router.push("/login?callbackUrl=/dashboard");
        } else {
          // Fetch user's purchased EAs from Firestore
          const data = await fetch("/api/user/purchased-eas").then(r => r.json());
          if (data.purchasedEAs) {
            setPurchasedEAs(data.purchasedEAs);
          }
          setIsLoading(false);
        }
      } catch {
        router.push("/login?callbackUrl=/dashboard");
      }
    };
    checkAuth();
  }, [router]);

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
          <a
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
          </a>

          <button className="group text-left rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 hover:border-green-500 dark:hover:border-green-400 transition-all hover:shadow-lg">
            <div className="text-2xl mb-2">📥</div>
            <h3 className="font-semibold mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              Download All EAs
            </h3>
            <p className="text-xs text-black/60 dark:text-white/60">
              Get the latest versions
            </p>
          </button>

          <a
            href="/support"
            className="group rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 hover:border-purple-500 dark:hover:border-purple-400 transition-all hover:shadow-lg"
          >
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-semibold mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Get Support
            </h3>
            <p className="text-xs text-black/60 dark:text-white/60">
              We're here to help
            </p>
          </a>

          <a
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
          </a>
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
            <a
              href="/marketplace"
              className="inline-flex items-center rounded-full bg-foreground text-background px-6 py-3 font-medium hover:opacity-90"
            >
              Browse Marketplace
            </a>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {purchasedEAs.map((ea) => (
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
                <p className="text-xs text-black/60 dark:text-white/60 mb-3">
                  {ea.description}
                </p>
                
                <div className="flex items-center gap-2 mb-4 text-xs text-black/60 dark:text-white/60">
                  <span>v{ea.version}</span>
                  <span>•</span>
                  <span>Purchased {new Date(ea.purchaseDate).toLocaleDateString()}</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownload(ea.eaId, ea.eaName)}
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
                  <a 
                    href="/installation-guide"
                    className="rounded-lg border border-black/[.08] dark:border-white/[.145] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] transition text-center"
                  >
                    Guide
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


