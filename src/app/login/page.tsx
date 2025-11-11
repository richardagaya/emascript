"use client";

import { useState, FormEvent, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  // Handle redirect result from Google sign-in
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const auth = getFirebaseAuth();
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setLoading(true);
          const idToken = await result.user.getIdToken();
          await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          router.push(callbackUrl);
        }
      } catch (err) {
        const error = err as { code?: string; message?: string };
        console.error('Redirect sign-in error:', error);
        if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
          setError("Google sign-in failed. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    handleRedirectResult();
  }, [router, callbackUrl]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred = isSignUp
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      router.push(callbackUrl);
    } catch (err) {
      const error = err as { code?: string };
      // Provide better error messages
      if (error?.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error?.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error?.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (error?.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (error?.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(isSignUp ? 'Failed to create account. Please try again.' : 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    
    // Prepare auth and provider first
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Call signInWithPopup IMMEDIATELY to preserve user activation
    // Don't set loading state before this, as it might cause a re-render
    const popupPromise = signInWithPopup(auth, provider);
    
    // Now set loading state after initiating the popup
    setLoading(true);
    
    try {
      const cred = await popupPromise;
      const idToken = await cred.user.getIdToken();
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      router.push(callbackUrl);
    } catch (err: any) {
      const error = err as { code?: string; message?: string };
      console.error('Google sign-in error:', error);
      
      // If popup is blocked, fallback to redirect
      if (
        error?.code === 'auth/popup-blocked' ||
        error?.message?.toLowerCase().includes('popup') ||
        error?.message?.toLowerCase().includes('user activation') ||
        error?.message?.toLowerCase().includes('multiple popups')
      ) {
        try {
          // Use redirect method as fallback
          await signInWithRedirect(auth, provider);
          // Don't set loading to false - we're redirecting
          return;
        } catch (redirectError) {
          console.error('Redirect sign-in error:', redirectError);
          setError('Sign-in failed. Please try again or allow popups for this site.');
        }
      } else if (error?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError("Google sign-in failed. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Akavanta
            </h1>
          </Link>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            Automated Trading Solutions
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-black/[.08] dark:border-white/[.145] p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {isSignUp 
                ? "Get started with your EA trading journey" 
                : "Sign in to access your Expert Advisors"}
            </p>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full mb-6 flex items-center justify-center gap-3 rounded-xl border-2 border-black/[.08] dark:border-white/[.145] px-4 py-3 font-medium hover:bg-black/[.03] dark:hover:bg-white/[.06] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? "Please wait..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/[.08] dark:border-white/[.145]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-black/60 dark:text-white/60">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="w-full rounded-xl border border-black/[.08] dark:border-white/[.145] bg-transparent px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              />
              {isSignUp && (
                <p className="mt-1 text-xs text-black/60 dark:text-white/60">
                  Minimum 6 characters
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>{isSignUp ? "Create account" : "Sign in"}</>
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp((v) => !v);
                setError(null);
              }}
              className="text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
            >
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Sign in</span>
                </>
              ) : (
                <>
                  New to Akavanta?{" "}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Create an account</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-xs text-black/60 dark:text-white/60">
          <p>
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline hover:text-black dark:hover:text-white">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="underline hover:text-black dark:hover:text-white">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
