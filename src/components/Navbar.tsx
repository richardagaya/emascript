"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { useAtom } from "jotai";
import { authStateAtom, mobileMenuOpenAtom } from "@/state/atoms";

export default function Navbar() {
  const [isOpen, setIsOpen] = useAtom(mobileMenuOpenAtom);
  const [authState, setAuthState] = useAtom(authStateAtom);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      if (user) {
        setAuthState({
          isAuthed: true,
          displayName: user.displayName || user.email || null,
          photoURL: user.photoURL || null,
        });
        setImageError(false); // Reset image error on new user
        // Ensure cookie is present if page loaded directly while logged in
        try {
          await fetch("/api/session", { method: "GET" });
        } catch {}
      } else {
        setAuthState({ isAuthed: false, displayName: null, photoURL: null });
      }
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, [setAuthState]);

  const firstName = useMemo(() => {
    if (!authState.displayName) return null;
    const namePart = authState.displayName.includes("@") ? authState.displayName.split("@")[0] : authState.displayName;
    const first = namePart.split(" ")[0];
    return first;
  }, [authState.displayName]);

  function toggleMenu() {
    setIsOpen((prev) => !prev);
  }

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/[.08] dark:border-white/[.145] bg-white/80 dark:bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <a href="/" className="font-semibold text-base sm:text-lg tracking-tight">
          Akavanta
        </a>
        <button
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          className="sm:hidden inline-flex items-center justify-center rounded-md border border-black/[.08] dark:border-white/[.145] p-2 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
          onClick={toggleMenu}
        >
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <a href="/marketplace" className="hover:underline">Marketplace</a>
          <a href="#faq" className="hover:underline">FAQ</a>
          {authState.isAuthed ? (
            <>
              <a href="/dashboard" className="hover:underline">Dashboard</a>
              <div className="flex items-center gap-2">
                {authState.photoURL && !imageError ? (
                  <img 
                    src={authState.photoURL} 
                    alt="avatar" 
                    className="h-6 w-6 rounded-full object-cover"
                    onError={() => setImageError(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-black/10 dark:bg-white/20" />
                )}
                <span className="text-sm opacity-80">{firstName || "Account"}</span>
              </div>
              <button
                onClick={async () => {
                  try { await fbSignOut(getFirebaseAuth()); } catch {}
                  await fetch("/api/session", { method: "DELETE" });
                  location.href = "/";
                }}
                className="rounded-full border border-black/[.08] dark:border-white/[.145] px-4 py-2 font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <a href="#buy" className="rounded-full bg-foreground text-background px-4 py-2 font-medium hover:opacity-90">Buy now</a>
              <a
                href="/login"
                className="rounded-full border border-black/[.08] dark:border-white/[.145] px-4 py-2 font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              >
                Sign in
              </a>
            </>
          )}
        </nav>
      </div>

      {/* Mobile Menu with slide animation */}
      <div
        className={`sm:hidden border-t border-black/[.08] dark:border-white/[.145] overflow-hidden transition-all duration-200 ease-out ${
          isOpen ? "[max-height:320px] opacity-100" : "[max-height:0] opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-col gap-3 text-sm">
          <a href="/marketplace" className="hover:underline" onClick={closeMenu}>Marketplace</a>
          <a href="#faq" className="hover:underline" onClick={closeMenu}>FAQ</a>
          {authState.isAuthed ? (
            <>
              <a href="/dashboard" className="hover:underline" onClick={closeMenu}>Dashboard</a>
              <div className="flex items-center gap-2">
                {authState.photoURL && !imageError ? (
                  <img 
                    src={authState.photoURL} 
                    alt="avatar" 
                    className="h-6 w-6 rounded-full object-cover"
                    onError={() => setImageError(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-black/10 dark:bg-white/20" />
                )}
                <span className="text-sm opacity-80">{firstName || "Account"}</span>
              </div>
              <button
                onClick={async () => {
                  try { await fbSignOut(getFirebaseAuth()); } catch {}
                  await fetch("/api/session", { method: "DELETE" });
                  closeMenu();
                  location.href = "/";
                }}
                className="rounded-full border border-black/[.08] dark:border-white/[.145] px-4 py-2 font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] text-center"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <a
                href="#buy"
                className="rounded-full bg-foreground text-background px-4 py-2 font-medium hover:opacity-90 text-center"
                onClick={closeMenu}
              >
                Buy now
              </a>
              <a
                href="/login"
                className="rounded-full border border-black/[.08] dark:border-white/[.145] px-4 py-2 font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] text-center"
                onClick={closeMenu}
              >
                Sign in
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


