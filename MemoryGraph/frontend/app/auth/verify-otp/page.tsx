'use client';

import { AuthError, AuthLayout, AuthNotice, authPrimaryButtonClass } from '@/app/components/AuthLayout';
import { API_URL } from '@/app/lib/api';
import { sanitizeNextPath } from '@/app/lib/authRedirect';
import { LOADING_APP } from '@/app/lib/productCopy';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const email = searchParams.get('email') || '';
  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [timer, setTimer] = useState(300);

  const parseApiError = (data: { detail?: unknown }) => {
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail[0] && typeof data.detail[0] === 'object' && 'msg' in data.detail[0]) {
      return String((data.detail[0] as { msg: string }).msg);
    }
    return 'Something went wrong';
  };

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code: otp.join('') }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(parseApiError(data));
      }
      const data = await response.json();
      login(data.user, data.access_token);
      router.push(nextPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || resendCooldown > 0) return;
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(parseApiError(data));
      setTimer(300);
      setResendCooldown(30);
      setOtp(['', '', '', '', '', '']);
      setNotice(
        data.dev_mode ? 'New code sent — check the server console in dev mode.' : 'A new code was sent to your email.',
      );
      document.getElementById('otp-0')?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AuthLayout title="Check your email" subtitle={`Enter the 6-digit code we sent to ${email || 'your email'}.`}>
      {error && <AuthError message={error} />}
      {notice && <AuthNotice message={notice} />}
      <form onSubmit={handleVerifyOtp} className="space-y-6">
        <div className="flex justify-center gap-2" role="group" aria-label="Verification code">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-12 w-11 rounded-xl border-2 border-slate-300 text-center text-xl font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              aria-label={`Digit ${index + 1}`}
              disabled={loading}
            />
          ))}
        </div>
        <p className="text-center text-sm text-slate-600">
          {timer > 0 ? (
            <>
              Code expires in <span className="font-semibold text-amber-800">{formatTime(timer)}</span>
            </>
          ) : (
            <span className="text-red-700">Code expired — request a new one</span>
          )}
        </p>
        <button type="submit" disabled={loading || otp.join('').length !== 6 || timer === 0} className={authPrimaryButtonClass}>
          {loading ? 'Verifying…' : 'Continue'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => void handleResendOtp()}
          disabled={loading || resendCooldown > 0 || !email}
          className="text-sm font-semibold text-amber-800 hover:text-amber-900 disabled:text-slate-400"
        >
          {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
        </button>
      </div>
    </AuthLayout>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f0df] text-sm text-slate-600">{LOADING_APP}</div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
