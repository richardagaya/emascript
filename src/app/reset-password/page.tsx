"use client";

import { FormEvent, useState, Suspense } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";

function ResetPasswordContent() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "If an account exists for this email, a password reset link has been sent."
      );
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error("Password reset error:", error);

      if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/user-not-found") {
        // Don't leak which emails exist – show generic message
        setMessage(
          "If an account exists for this email, a password reset link has been sent."
        );
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Akavanta
            </h1>
          </Link>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            Reset your account password
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-black/[.08] dark:border-white/[.145] p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Enter the email associated with your account and we&apos;ll send
              you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-black/[.08] dark:border-white/[.145] bg-transparent px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {message && !error && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-black/70 dark:text-white/70">
            <Link
              href="/login"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}


