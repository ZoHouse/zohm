'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PhoneLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (userId: string, userData: any) => void;
}

type Step = 'phone' | 'otp';

export default function PhoneLoginModal({ isOpen, onClose, onSuccess }: PhoneLoginModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [countryCode, setCountryCode] = useState('91'); // ZO API expects without + (India default)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setOtp(['', '', '', '', '', '']);
      setError(null);
      setResendCooldown(0);
    }
  }, [isOpen]);

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ZO API expects country code without + sign
      const cleanCountryCode = countryCode.replace(/^\+/, '');
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digits

      if (cleanPhoneNumber.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }

      const response = await fetch('/api/zo/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: cleanCountryCode,
          phoneNumber: cleanPhoneNumber,
        }),
      });

      // Check if response has a body before parsing
      let data: any = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('❌ Failed to parse JSON response:', parseError);
          const text = await response.text();
          console.error('❌ Response text:', text);
          throw new Error(`Invalid response from server (${response.status})`);
        }
      } else {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text);
        data = { error: text || `Server error (${response.status})` };
      }

      if (!response.ok) {
        // Only log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ API Error:', {
            status: response.status,
            error: data.error || data.message,
          });
        }

        // Show user-friendly error message
        const errorMessage = data.error || data.message || data.details || `Failed to send OTP (${response.status})`;
        throw new Error(errorMessage);
      }

      // Success - move to OTP step
      setStep('otp');
      setResendCooldown(60); // 60 second cooldown
    } catch (err: any) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ handleSendOTP error:', err?.message);
      }
      const errorMessage = err?.message || err?.error || 'Failed to send verification code. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otpArray?: string[]) => {
    // Use provided OTP array or fall back to state
    const otpToVerify = otpArray || otp;
    const otpString = otpToVerify.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ZO API expects country code without + sign
      const cleanCountryCode = countryCode.replace(/^\+/, '');
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

      const response = await fetch('/api/zo/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: cleanCountryCode,
          phoneNumber: cleanPhoneNumber,
          otp: otpString,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      // Success - user logged in
      // Store ZO user session in localStorage
      if (data.userId) {
        localStorage.setItem('zo_user_id', data.userId);
        if (data.tokens?.access) {
          // Store as zo_access_token to match AvatarStep expectations
          localStorage.setItem('zo_access_token', data.tokens.access);
          // Also store as zo_token for backward compatibility
          localStorage.setItem('zo_token', data.tokens.access);
        }
        // Store device credentials (required for all ZO API calls)
        if (data.deviceCredentials) {
          localStorage.setItem('zo_device_id', data.deviceCredentials.deviceId);
          localStorage.setItem('zo_device_secret', data.deviceCredentials.deviceSecret);
          console.log('✅ Device credentials stored');
        }
        console.log('✅ ZO session stored:', data.userId);

        // Dispatch login success event for other components to pick up
        if (typeof window !== 'undefined') {
          console.log('📢 Dispatching zoLoginSuccess event');
          window.dispatchEvent(new CustomEvent('zoLoginSuccess', {
            detail: { userId: data.userId }
          }));
        }
      }

      if (onSuccess) {
        onSuccess(data.userId, data.user);
      } else {
        // Default: refresh page to show dashboard
        // The unified auth hook will pick up the session from localStorage
        router.refresh();
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      if (otpInputRefs.current[0]) {
        otpInputRefs.current[0].focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    await handleSendOTP();
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    // Pass newOtp directly to avoid state update race condition
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerifyOTP(newOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace: move to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendOTP();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[90vw] md:max-w-[400px] bg-black/95 border border-white/20 rounded-[24px] p-6 md:p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Step 1: Phone Input */}
        {step === 'phone' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-white/10 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h2 className="font-['Syne'] text-2xl font-extrabold text-white mb-2">
                Enter Your Phone Number
              </h2>
              <p className="font-rubik text-sm text-white/60">
                We'll send you a verification code
              </p>
            </div>

            <div className="space-y-4">
              {/* Country Code + Phone Input */}
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 md:px-4 py-3 text-white font-rubik text-sm md:text-base focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20"
                >
                  <option value="1" className="bg-black">🇺🇸 +1</option>
                  <option value="91" className="bg-black">🇮🇳 +91</option>
                  <option value="44" className="bg-black">🇬🇧 +44</option>
                  <option value="86" className="bg-black">🇨🇳 +86</option>
                  <option value="81" className="bg-black">🇯🇵 +81</option>
                  <option value="82" className="bg-black">🇰🇷 +82</option>
                  <option value="33" className="bg-black">🇫🇷 +33</option>
                  <option value="49" className="bg-black">🇩🇪 +49</option>
                  <option value="7" className="bg-black">🇷🇺 +7</option>
                  <option value="55" className="bg-black">🇧🇷 +55</option>
                  {/* Add more countries as needed */}
                </select>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setPhoneNumber(digits);
                    setError(null);
                  }}
                  onKeyDown={handlePhoneKeyDown}
                  placeholder="555-123-4567"
                  className="flex-[2] bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white font-rubik placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm font-rubik">{error}</p>
              )}

              <button
                onClick={handleSendOTP}
                disabled={isLoading || phoneNumber.length < 10}
                className="w-full bg-black border-2 border-white/20 rounded-lg px-5 py-4 text-white font-rubik font-medium hover:bg-[#1a1a1a] hover:border-white/40 hover:shadow-[0_0_30px_rgba(207,255,80,0.2)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black"
                type="button"
              >
                {isLoading ? 'Sending Code...' : 'Send Code'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-white/10 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-['Syne'] text-2xl font-extrabold text-white mb-2">
                Enter Verification Code
              </h2>
              <p className="font-rubik text-sm text-white/60">
                We sent a code to +{countryCode} {phoneNumber}
              </p>
            </div>

            <div className="space-y-4">
              {/* OTP Inputs */}
              <div className="flex gap-1 md:gap-2 justify-center w-full">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-12 md:w-12 md:h-14 bg-white/10 border border-white/20 rounded-lg text-center text-white font-rubik text-lg md:text-xl font-semibold focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 p-0"
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-400 text-sm font-rubik text-center">{error}</p>
              )}

              <button
                onClick={() => handleVerifyOTP()}
                disabled={isLoading || otp.some(d => !d)}
                className="w-full bg-black border-2 border-white/20 rounded-lg px-5 py-4 text-white font-rubik font-medium hover:bg-[#1a1a1a] hover:border-white/40 hover:shadow-[0_0_30px_rgba(207,255,80,0.2)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black"
                type="button"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0}
                  className="text-white/60 hover:text-white text-sm font-rubik transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't receive? Resend code"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

