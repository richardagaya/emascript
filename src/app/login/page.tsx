"use client";

import { useState, FormEvent, Suspense, useEffect, useRef } from "react";
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
  const googleSignInInProgress = useRef(false);

  // Handle redirect result from Google sign-in
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const auth = getFirebaseAuth();
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setLoading(true);
          try {
            const idToken = await result.user.getIdToken();
            const sessionResponse = await fetch("/api/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });
            
            if (!sessionResponse.ok) {
              throw new Error('Failed to create session');
            }
            
            router.push(callbackUrl);
          } catch (sessionError) {
            console.error('Session creation error:', sessionError);
            setError('Failed to create session. Please try again.');
            setLoading(false);
          }
        }
      } catch (err) {
        const error = err as { code?: string; message?: string };
        console.error('Redirect sign-in error:', error);
        
        // Only show error for non-user-cancellation errors
        if (error?.code !== 'auth/popup-closed-by-user' && 
            error?.code !== 'auth/cancelled-popup-request' &&
            error?.code !== 'auth/user-cancelled') {
          let errorMessage = 'Google sign-in failed. ';
          
          if (error?.code === 'auth/unauthorized-domain') {
            errorMessage += 'Domain not authorized. Please check Firebase Console settings.';
          } else if (error?.code === 'auth/operation-not-allowed') {
            errorMessage += 'Google sign-in is not enabled. Please enable it in Firebase Console.';
          } else if (error?.message?.includes('redirect_uri_mismatch')) {
            errorMessage += 'OAuth configuration error. Please check Google Cloud Console.';
          }
          
          setError(errorMessage || 'Please try again.');
        }
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
    // Prevent multiple simultaneous popup attempts
    if (googleSignInInProgress.current || loading) {
      return;
    }
    
    setError(null);
    setLoading(true);
    googleSignInInProgress.current = true;
    
    try {
      // Validate Firebase configuration before attempting sign-in
      let auth;
      try {
        auth = getFirebaseAuth();
      } catch (configError: unknown) {
        const configErr = configError as Error;
        console.error('Firebase configuration error:', configErr);
        setError(
          configErr.message || 
          'Firebase is not properly configured. Please check your environment variables.'
        );
        setLoading(false);
        googleSignInInProgress.current = false;
        return;
      }

      const provider = new GoogleAuthProvider();
      
      // Set custom parameters to ensure proper OAuth flow
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      
      // Check if we're in a browser environment that supports popups
      // If API key validation fails, use redirect method directly
      // Always try popup first for better UX, but fallback to redirect on errors
      try {
        // Open popup synchronously within the user gesture handler
        // This must be called directly in response to user interaction
        const popupPromise = signInWithPopup(auth, provider);
        const cred = await popupPromise;
        const idToken = await cred.user.getIdToken();
        
        const sessionResponse = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        
        if (!sessionResponse.ok) {
          throw new Error('Failed to create session');
        }
        
        router.push(callbackUrl);
        setLoading(false);
        googleSignInInProgress.current = false;
      } catch (popupError: unknown) {
        const error = popupError as { code?: string; message?: string };
        console.error('Popup sign-in error:', error);
        
        // Check for API key errors specifically
        // If API key is invalid, try redirect method as fallback
        if (error?.code === 'auth/api-key-not-valid' || 
            error?.message?.toLowerCase().includes('api-key-not-valid') ||
            error?.message?.toLowerCase().includes('api key')) {
          console.warn('API key validation failed, attempting redirect method...');
          // Try redirect method as fallback for API key issues
          try {
            await signInWithRedirect(auth, provider);
            googleSignInInProgress.current = false;
            return;
          } catch (redirectError) {
            console.error('Redirect also failed:', redirectError);
            setError(
              'Firebase API key is invalid. Please verify your NEXT_PUBLIC_FIREBASE_API_KEY environment variable matches your Firebase project settings. ' +
              'Make sure you\'ve restarted your development server after updating environment variables.'
            );
            setLoading(false);
            googleSignInInProgress.current = false;
            return;
          }
        }
        
        // Check for specific error codes that indicate popup issues
        const popupErrorCodes = [
          'auth/popup-blocked',
          'auth/popup-closed-by-user',
          'auth/cancelled-popup-request',
          'auth/unauthorized-domain',
          'auth/operation-not-allowed',
        ];
        
        const isPopupError = popupErrorCodes.includes(error?.code || '') ||
          error?.message?.toLowerCase().includes('popup') ||
          error?.message?.toLowerCase().includes('redirect_uri_mismatch') ||
          error?.message?.toLowerCase().includes('unauthorized') ||
          error?.message?.toLowerCase().includes('user activation');
        
        if (isPopupError && error?.code !== 'auth/popup-closed-by-user') {
          // Fallback to redirect method
          console.log('Falling back to redirect method...');
          try {
            await signInWithRedirect(auth, provider);
            // Don't set loading to false - we're redirecting
            googleSignInInProgress.current = false;
            return;
          } catch (redirectError) {
            console.error('Redirect sign-in error:', redirectError);
            const redirectErr = redirectError as { code?: string; message?: string };
            
            // Provide specific error messages
            if (redirectErr?.code === 'auth/unauthorized-domain') {
              setError('Domain not authorized. Please check Firebase and Google Cloud Console settings.');
            } else if (redirectErr?.message?.includes('redirect_uri_mismatch')) {
              setError('OAuth configuration error. Please verify redirect URIs in Google Cloud Console.');
            } else if (redirectErr?.code === 'auth/api-key-not-valid') {
              setError('Firebase API key is invalid. Please check your environment variables.');
            } else {
              setError('Sign-in failed. Please try again or check your browser console for details.');
            }
            setLoading(false);
            googleSignInInProgress.current = false;
          }
        } else if (error?.code === 'auth/popup-closed-by-user') {
          // User closed the popup intentionally
          setError(null); // Don't show error for user cancellation
          setLoading(false);
          googleSignInInProgress.current = false;
        } else {
          // Other errors
          let errorMessage = 'Google sign-in failed. ';
          
          if (error?.code === 'auth/unauthorized-domain') {
            errorMessage += 'Domain not authorized. Please check Firebase Console settings.';
          } else if (error?.code === 'auth/operation-not-allowed') {
            errorMessage += 'Google sign-in is not enabled. Please enable it in Firebase Console.';
          } else if (error?.code === 'auth/api-key-not-valid') {
            errorMessage += 'Firebase API key is invalid. Please check your environment variables.';
          } else if (error?.message?.toLowerCase().includes('redirect_uri_mismatch')) {
            errorMessage += 'OAuth configuration error. Please check Google Cloud Console.';
          } else {
            errorMessage += 'Please try again or use redirect method.';
          }
          
          setError(errorMessage);
          setLoading(false);
          googleSignInInProgress.current = false;
        }
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Unexpected Google sign-in error:', error);
      
      // Check if it's a configuration error
      if (error?.message?.toLowerCase().includes('firebase configuration') ||
          error?.message?.toLowerCase().includes('environment variable')) {
        setError(error.message || 'Firebase is not properly configured.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
      googleSignInInProgress.current = false;
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
