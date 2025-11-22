"use client";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { authStateAtom } from '@/state/atoms';
import { getAllEAs } from '@/data/eas';


export default function Marketplace() {
  const router = useRouter();
  const [authState] = useAtom(authStateAtom);
  
  // EAs under development
  const underDevelopment = ["Apexflow", "Zenmatrix", "Tradeforge"];
  
  const handleBuyNow = (bot: {
    name: string;
    price: number;
    [key: string]: string | number | boolean;
  }, e?: React.MouseEvent) => {
    // Prevent card click from triggering when clicking Buy Now button
    if (e) {
      e.stopPropagation();
    }
    
    // Don't allow purchase if under development
    if (underDevelopment.includes(bot.name)) {
      return;
    }
    
    // Check if user is logged in
    if (!authState.isAuthed) {
      // Redirect to login with callback to checkout
      const checkoutUrl = `/marketplace/checkout?bot=${encodeURIComponent(bot.name)}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(checkoutUrl)}`);
      return;
    }
    
    // User is logged in, proceed to checkout
    router.push(`/marketplace/checkout?bot=${encodeURIComponent(bot.name)}`);
  };

  const handleEAClick = (botName: string) => {
    // Don't navigate if under development
    if (underDevelopment.includes(botName)) {
      return;
    }
    router.push(`/marketplace/${encodeURIComponent(botName)}`);
  };

  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
              EA Trading Bot Marketplace
            </h1>
            <p className="mt-4 text-base sm:text-lg text-black/70 dark:text-white/70 max-w-2xl mx-auto">
              Discover and purchase proven Expert Advisors for automated Forex trading. 
              Each bot comes with detailed backtests, risk controls, and setup guides.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">Available Bots <span className="text-sm text-black/60 dark:text-white/60">({getAllEAs().length})</span></h2>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {getAllEAs().map((bot) => {
            const isUnderDevelopment = underDevelopment.includes(bot.name);
            return (
              <div 
                key={bot.name} 
                className={`rounded-xl border border-black/[.08] dark:border-white/[.145] p-6 transition-shadow relative ${
                  isUnderDevelopment 
                    ? 'opacity-50 grayscale cursor-not-allowed' 
                    : 'hover:shadow-lg cursor-pointer'
                }`}
                onClick={() => !isUnderDevelopment && handleEAClick(bot.name)}
              >
                {isUnderDevelopment && (
                  <div className="absolute top-4 right-4 z-10 px-3 py-1 text-xs font-medium bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-full">
                    Under Development
                  </div>
                )}
                <div className="relative h-48 rounded-lg bg-black/[.04] dark:bg-white/[.06] overflow-hidden mb-4">
                  <Image 
                    src={bot.image} 
                    alt={bot.name} 
                    fill
                    className="object-cover rounded-lg" 
                  />
                </div>
                
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{bot.name}</h3>
                  <span className="px-2 py-1 text-xs bg-black/[.08] dark:bg-white/[.12] rounded-full">
                    {bot.category}
                  </span>
                </div>
                
                <p className="text-sm text-black/70 dark:text-white/70 mb-4 line-clamp-2">
                  {bot.desc}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">${bot.price.toFixed(2)}</div>
                  <div className="flex gap-2">
                    <button
                      className={`px-4 py-2 text-sm rounded-md ${
                        isUnderDevelopment
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-foreground text-background hover:opacity-90'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyNow(bot, e);
                      }}
                      disabled={isUnderDevelopment}
                    >
                      Buy now
                    </button>
                    <button
                      className={`px-4 py-2 text-sm border border-black/[.08] dark:border-white/[.145] rounded-md ${
                        isUnderDevelopment
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-black/[.04] dark:hover:bg-white/[.06]'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isUnderDevelopment) {
                          handleEAClick(bot.name);
                        }
                      }}
                      disabled={isUnderDevelopment}
                    >
                      View details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
