"use client";

import { useState } from "react";

export type FAQItem = { q: string; a: string };

export default function AccordionFAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-black/[.08] dark:divide-white/[.145] rounded-xl border border-black/[.08] dark:border-white/[.145] overflow-hidden">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={item.q}>
            <button
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-black/[.03] dark:hover:bg-white/[.04]"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${idx}`}
            >
              <span className="font-medium">{item.q}</span>
              <span className="shrink-0 rounded-full border border-black/[.08] dark:border-white/[.145] w-6 h-6 inline-flex items-center justify-center text-xs">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <div
              id={`faq-panel-${idx}`}
              className={`px-5 transition-[max-height,opacity] duration-200 ease-out ${
                isOpen ? "max-h-40 opacity-100 pb-4" : "max-h-0 opacity-0"
              } overflow-hidden text-sm text-black/70 dark:text-white/70`}
            >
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}


