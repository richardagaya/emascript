"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { authStateAtom } from "@/state/atoms";

export default function EmailCapturePopup() {
  const [authState] = useAtom(authStateAtom);
  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only show popup for unauthenticated users
    if (authState.isAuthed === false) {
      // Check if user has already submitted
      const hasSubmitted = localStorage.getItem("newsletter_signup_submitted");
      
      // Show popup if user hasn't submitted (show on every page refresh)
      if (!hasSubmitted) {
        // Small delay to make it feel natural
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [authState.isAuthed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/newsletter-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        localStorage.setItem("newsletter_signup_submitted", "true");
        // Hide popup after 2 seconds
        setTimeout(() => {
          setShowPopup(false);
        }, 2000);
      } else {
        setError(data.error || "Failed to save email. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    // Just hide the popup for this page load - it will show again on refresh
    setShowPopup(false);
  };

  // Don't show if user is authenticated or popup is hidden
  if (!showPopup || authState.isAuthed === true) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-black/[.08] dark:border-white/[.145] p-8 max-w-md w-full animate-slide-up">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
          aria-label="Close popup"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Thank you!</h3>
            <p className="text-black/60 dark:text-white/60">
              We&apos;ll keep you updated with the latest news and updates.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold mb-2">
                Stay in the loop
              </h3>
              <p className="text-black/60 dark:text-white/60">
                Get the latest updates on our Expert Advisors and trading strategies.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-black/[.08] dark:border-white/[.145] bg-transparent px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Subscribing...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-4 py-3 rounded-xl border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.03] dark:hover:bg-white/[.06] transition-all text-black/70 dark:text-white/70"
                >
                  Maybe later
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

