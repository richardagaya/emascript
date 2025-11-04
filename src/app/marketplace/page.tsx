"use client";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { authStateAtom } from '@/state/atoms';
import { getAllEAs } from '@/data/eas';


export default function Marketplace() {
  const router = useRouter();
  const [authState] = useAtom(authStateAtom);
  
  const handleBuyNow = (bot: {
    name: string;
    price: number;
    [key: string]: any;
  }, e?: React.MouseEvent) => {
    // Prevent card click from triggering when clicking Buy Now button
    if (e) {
      e.stopPropagation();
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Available Bots</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-black/[.08] dark:border-white/[.145] rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.06]">
              All
            </button>
            <button className="px-3 py-1 text-sm border border-black/[.08] dark:border-white/[.145] rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.06]">
              Trending
            </button>
            <button className="px-3 py-1 text-sm border border-black/[.08] dark:border-white/[.145] rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.06]">
              Scalping
            </button>
            <button className="px-3 py-1 text-sm border border-black/[.08] dark:border-white/[.145] rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.06]">
              Swing
            </button>
          </div>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {getAllEAs().map((bot) => (
            <div 
              key={bot.name} 
              className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleEAClick(bot.name)}
            >
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
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < Math.floor(bot.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-black/60 dark:text-white/60">
                  {bot.rating} ({bot.reviews} reviews)
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">${bot.price}</div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 text-sm bg-foreground text-background rounded-full hover:opacity-90"
                    onClick={(e) => handleBuyNow(bot, e)}
                  >
                    Buy now
                  </button>
                  <button
                    className="px-4 py-2 text-sm border border-black/[.08] dark:border-white/[.145] rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEAClick(bot.name);
                    }}
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
