"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

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
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      router.push(callbackUrl);
    } catch (err) {
      setError("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{isSignUp ? "Create account" : "Sign in"}</h1>
      <p className="mt-2 text-sm text-black/70 dark:text-white/70">
        {isSignUp ? "Register with email and password." : "Use your Firebase email and password."}
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/[.08] dark:border-white/[.145] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/[.08] dark:border-white/[.145] bg-transparent px-3 py-2"
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-foreground text-background px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (isSignUp ? "Creating..." : "Signing in...") : isSignUp ? "Sign up" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full rounded-full border border-black/[.08] dark:border-white/[.145] px-4 py-2 font-medium hover:bg-black/[.03] dark:hover:bg-white/[.06] disabled:opacity-60"
        >
          {loading ? "Please wait..." : "Continue with Google"}
        </button>
        <button
          type="button"
          onClick={() => setIsSignUp((v) => !v)}
          className="w-full text-sm text-black/70 dark:text-white/70 hover:underline"
        >
          {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </form>
    </div>
  );
}


