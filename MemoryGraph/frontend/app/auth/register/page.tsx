'use client';

import {
  AuthError,
  AuthLayout,
  authInputClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from '@/app/components/AuthLayout';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL } from '@/app/lib/api';
import { sanitizeNextPath } from '@/app/lib/authRedirect';
import { useGoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

interface GoogleCodeResponse {
  code?: string;
}

interface GoogleAuthResponse {
  requires_otp?: boolean;
  email?: string;
  access_token?: string;
  user?: Parameters<ReturnType<typeof useAuth>['login']>[0];
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f0df] flex items-center justify-center text-slate-600">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const referralCode = searchParams.get('ref') || '';
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'verify-otp'>('register');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          referral_code: referralCode || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Registration failed');
      }
      setStep('verify-otp');
      const otpResponse = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!otpResponse.ok) throw new Error('Could not send verification code');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const googleRegister = useGoogleLogin({
    onSuccess: async (codeResponse: GoogleCodeResponse) => {
      setError('');
      setLoading(true);
      try {
        if (!codeResponse.code) throw new Error('Google sign-up did not complete');
        const response = await fetch(`${API_URL}/auth/google/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code: codeResponse.code }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({ detail: 'Google sign-up failed' }));
          throw new Error(data.detail || 'Google sign-up failed');
        }
        const data = (await response.json()) as GoogleAuthResponse;
        if (data.requires_otp && data.email) {
          router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}&next=${encodeURIComponent(nextPath)}`);
          return;
        }
        if (data.user) {
          login(data.user, data.access_token);
          router.push(nextPath);
          return;
        }
        throw new Error('Google sign-up failed');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Google sign-up failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-up failed'),
    flow: 'auth-code',
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free to start. Open Studio with a sample family loaded automatically."
      footer={
        step === 'register' ? (
          <>
            Already have an account?{' '}
            <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-amber-800 hover:text-amber-900">
              Sign in
            </Link>
          </>
        ) : null
      }
    >
      {error && <AuthError message={error} />}
      {step === 'register' ? (
        <>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Your name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={authInputClass}
                placeholder="How should we greet you?"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authInputClass}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
              {loading ? 'Creating account…' : 'Continue to Studio'}
            </button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-500">or</span>
            </div>
          </div>
          <button type="button" onClick={() => googleRegister()} disabled={loading} className={authSecondaryButtonClass}>
            Continue with Google
          </button>
        </>
      ) : (
        <div className="text-center">
          <p className="text-sm text-slate-600">We sent a 6-digit code to your email.</p>
          <Link
            href={`/auth/verify-otp?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextPath)}`}
            className="mt-4 inline-flex font-semibold text-amber-800 hover:text-amber-900"
          >
            Enter verification code →
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
