"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

function ResetPasswordConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function verifyCode() {
      if (!oobCode || mode !== "resetPassword") {
        setError("Invalid or missing reset link. Please request a new one.");
        setIsVerifying(false);
        return;
      }

      try {
        const auth = getFirebaseAuth();
        const emailForCode = await verifyPasswordResetCode(auth, oobCode);
        setEmail(emailForCode);
        setIsVerifying(false);
      } catch (err) {
        console.error("verifyPasswordResetCode error:", err);
        setError(
          "This reset link is invalid or has expired. Please request a new one."
        );
        setIsVerifying(false);
      }
    }

    verifyCode();
  }, [oobCode, mode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!oobCode) return;

    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      await confirmPasswordReset(auth, oobCode, password);
      setMessage("Your password has been updated successfully.");

      // Optionally redirect back to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err) {
      const errorObj = err as { code?: string; message?: string };
      console.error("confirmPasswordReset error:", errorObj);

      if (errorObj.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger one.");
      } else if (
        errorObj.code === "auth/expired-action-code" ||
        errorObj.code === "auth/invalid-action-code"
      ) {
        setError(
          "This reset link is no longer valid. Please request a new password reset email."
        );
      } else {
        setError("Failed to update password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-sm text-black/70 dark:text-white/70">
            Verifying your reset link...
          </p>
        </div>
      </div>
    );
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
            Choose a new password for your account
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-black/[.08] dark:border-white/[.145] p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Set a new password
            </h2>
            {email && (
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                For account: <span className="font-medium">{email}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300 mb-4">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300 mb-4">
              {message}
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                >
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-black/[.08] dark:border-white/[.145] bg-transparent px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium mb-2"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-black/[.08] dark:border-white/[.145] bg-transparent px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Updating password...
                  </>
                ) : (
                  "Update password"
                )}
              </button>
            </form>
          )}

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

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      }
    >
      <ResetPasswordConfirmContent />
    </Suspense>
  );
}


