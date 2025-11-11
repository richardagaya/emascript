"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { authStateAtom } from '@/state/atoms';
import { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './checkout.css';
import { getEAByName } from '@/data/eas';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const botName = searchParams.get('bot');
  const [authState] = useAtom(authStateAtom);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Get email from authenticated user
  let defaultEmail = '';
  if (authState?.isAuthed && authState.displayName?.includes('@')) {
    defaultEmail = authState.displayName;
  }
  
  const [email, setEmail] = useState<string>(defaultEmail);
  const [phone, setPhone] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [eaData, setEaData] = useState<{ name: string; price: number } | null>(null);
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          // Not authenticated, redirect to login
          const currentUrl = window.location.pathname + window.location.search;
          router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
        } else {
          setIsCheckingAuth(false);
        }
      } catch {
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }
    };
    checkAuth();
  }, [router]);
  
  // Update email when auth state changes
  useEffect(() => {
    if (authState?.isAuthed && authState.displayName?.includes('@')) {
      setEmail(authState.displayName);
    }
  }, [authState]);

  // Load EA data to get price
  useEffect(() => {
    if (botName) {
      const ea = getEAByName(botName);
      if (ea) {
        setEaData({ name: ea.name, price: ea.price });
      }
    }
  }, [botName]);

  const emailValid = Boolean(email.match(/^\S+@\S+\.\S+$/));
  // react-phone-input-2 always outputs in international format
  const phoneValid = phone.replace(/\D/g, '').length >= 10;
  const canProceed = emailValid && phoneValid && !isProcessing;

  const handlePay = async (method: 'mpesa'|'pesapal'|'paypal') => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botName,
          email,
          phone,
          paymentMethod: method,
          userId: authState.displayName, // You can also use Firebase UID if available
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // M-Pesa STK Push - no redirect URL, show instructions
        if (method === 'mpesa') {
          alert(
            `✅ Payment Request Sent!\n\n` +
            `Order ID: ${data.orderId}\n` +
            `Transaction ID: ${data.transactionId}\n\n` +
            `Please check your phone and enter your M-Pesa PIN to complete the payment.\n` +
            `You will receive a confirmation email once the payment is processed.`
          );
          // Redirect to dashboard or order status page
          router.push('/dashboard');
        } 
        // Pesapal and PayPal - redirect to payment gateway
        else if (data.paymentUrl) {
          // Redirect to payment gateway
          window.location.href = data.paymentUrl;
        } else {
          alert(`Order submitted successfully!\nOrder ID: ${data.orderId}\n\nYou will receive a confirmation email shortly.`);
          router.push('/dashboard');
        }
      } else {
        // Error
        alert(`Payment Error: ${data.error || 'Failed to process order. Please try again.'}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black/[.90]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-black/70 dark:text-white/70">Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (!botName) {
    return <div className="p-8 text-center text-lg bg-gray-100 min-h-screen">No bot selected.</div>;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900 py-12 px-4">
      <div className="max-w-lg w-full">
        {/* Order Summary Card */}
        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Order Summary</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Product</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">{botName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {eaData ? `KES ${eaData.price.toFixed(2)}` : 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {eaData ? `KES ${eaData.price.toFixed(2)}` : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Form Card */}
        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Payment Information</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enter your details to complete the purchase</p>
          </div>
          
          <div className="p-6">
            <form className="flex flex-col gap-5 mb-8">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-gray-100 transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  title="Email address for order confirmation"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <PhoneInput
                  country={"ke"}
                  value={phone}
                  onChange={setPhone}
                  inputClass="premium-phone-input"
                  buttonClass="premium-phone-button"
                  dropdownClass="premium-phone-dropdown"
                  searchClass="premium-phone-search"
                  containerClass="premium-phone-container"
                  specialLabel=""
                  inputProps={{ required: true, name: 'phone', autoComplete: 'tel', placeholder: 'Phone number', id: 'phone' }}
                  enableSearch
                  searchPlaceholder="Search countries..."
                />
              </div>
            </form>

            {/* Payment Methods */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Select Payment Method</h4>
              
              {/* M-PESA Button */}
              <button
                onClick={() => {}}
                className="w-full py-3.5 px-6 flex items-center justify-center gap-3 rounded-xl bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium cursor-not-allowed opacity-60 transition-all shadow-sm"
                disabled={true}
                title="Coming Soon"
              >
                <svg className="w-6 h-6 opacity-50" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="512" height="512" rx="100" fill="white"/>
                  <path d="M156 180h86c28 0 42 14 42 42 0 28-14 42-42 42h-56v56h56c28 0 42 14 42 42s-14 42-42 42h-86V180z" fill="#62B843"/>
                  <path d="M284 180h28v184h-28V180z" fill="#62B843"/>
                  <circle cx="298" cy="150" r="18" fill="#62B843"/>
                </svg>
                <span>Pay with M-PESA</span>
                <span className="text-xs ml-auto px-2 py-1 bg-gray-400 dark:bg-gray-600 rounded-full">Coming Soon</span>
              </button>

              {/* Pesapal Button */}
              <button
                onClick={() => handlePay('pesapal')}
                className="w-full py-3.5 px-6 flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600"
                disabled={!canProceed || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <img 
                      src="/pesapal-logo.png" 
                      alt="Pesapal" 
                      className="h-6 w-auto object-contain"
                    />
                    <span>Pay with Pesapal</span>
                  </>
                )}
              </button>

              {/* PayPal Button - Greyed Out */}
              <button
                onClick={() => {}}
                className="w-full py-3.5 px-6 flex items-center justify-center gap-3 rounded-xl bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 font-medium cursor-not-allowed opacity-60 transition-all shadow-sm grayscale"
                disabled={true}
                title="Currently Unavailable"
              >
                <svg className="w-6 h-6 opacity-50" viewBox="0 0 124 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47.26 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.468 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" fill="currentColor"/>
                  <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm1.048 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.467 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317z" fill="currentColor"/>
                  <path d="M119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z" fill="currentColor"/>
                  <path d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z" fill="currentColor"/>
                  <path d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z" fill="currentColor"/>
                  <path d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z" fill="currentColor"/>
                  <path d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z" fill="currentColor"/>
                </svg>
                <span>Pay with PayPal</span>
                <span className="text-xs ml-auto px-2 py-1 bg-gray-400 dark:bg-gray-600 rounded-full">Unavailable</span>
              </button>
            </div>

            {/* Security Notice */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your payment information is secure and encrypted. We never store your payment details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
