"use client";

import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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
          EA Bots
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
          <a href="#products" className="hover:underline">Products</a>
          <a href="#pricing" className="hover:underline">Pricing</a>
          <a href="#faq" className="hover:underline">FAQ</a>
          <a href="#buy" className="rounded-full bg-foreground text-background px-4 py-2 font-medium hover:opacity-90">Buy now</a>
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
          <a href="#products" className="hover:underline" onClick={closeMenu}>Products</a>
          <a href="#pricing" className="hover:underline" onClick={closeMenu}>Pricing</a>
          <a href="#faq" className="hover:underline" onClick={closeMenu}>FAQ</a>
          <a
            href="#buy"
            className="rounded-full bg-foreground text-background px-4 py-2 font-medium hover:opacity-90 text-center"
            onClick={closeMenu}
          >
            Buy now
          </a>
        </nav>
      </div>
    </header>
  );
}


