"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTiktok, faXTwitter, faFacebookF, faInstagram } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-black/70 dark:text-white/70 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Akavanta. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/support" className="hover:underline">Support</a>
          </div>
        </div>
        <div className="flex items-center gap-5 justify-center sm:justify-end">
          <a href="https://www.tiktok.com/@akavanta_" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="opacity-80 hover:opacity-100 transition-opacity">
            <FontAwesomeIcon icon={faTiktok} className="h-4 w-4" />
          </a>
          <a href="https://x.com/yourhandle" target="_blank" rel="noopener noreferrer" aria-label="X" className="opacity-80 hover:opacity-100 transition-opacity">
            <FontAwesomeIcon icon={faXTwitter} className="h-4 w-4" />
          </a>
          <a href="https://facebook.com/yourpage" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="opacity-80 hover:opacity-100 transition-opacity">
            <FontAwesomeIcon icon={faFacebookF} className="h-4 w-4" />
          </a>
          <a href="https://www.instagram.com/akavanta/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="opacity-80 hover:opacity-100 transition-opacity">
            <FontAwesomeIcon icon={faInstagram} className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}


