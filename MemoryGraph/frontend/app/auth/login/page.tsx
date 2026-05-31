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
import { useGoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { sanitizeNextPath } from '@/app/lib/authRedirect';

interface GoogleCodeResponse {
  code?: string;
}

interface GoogleAuthResponse {
  requires_otp?: boolean;
  email?: string;
  access_token?: string;
  user?: Parameters<ReturnType<typeof useAuth>['login']>[0];
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f0df] flex items-center justify-center text-slate-600">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Sign in failed');
      }
      const data = await response.json();
      login(data.user, data.access_token);
      router.push(nextPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse: GoogleCodeResponse) => {
      setError('');
      setLoading(true);
      try {
        if (!codeResponse.code) throw new Error('Google sign-in did not complete');
        const response = await fetch(`${API_URL}/auth/google/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code: codeResponse.code }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Google sign-in failed' }));
          throw new Error(errorData.detail || 'Google sign-in failed');
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
        throw new Error('Google sign-in did not complete');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in failed'),
    flow: 'auth-code',
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to explore, ask, and share your family memories."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href={`/auth/register?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-amber-800 hover:text-amber-900">
            Create one free
          </Link>
        </>
      }
    >
      {error && <AuthError message={error} />}
      <form onSubmit={handleEmailLogin} className="space-y-4">
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
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-xs font-semibold text-amber-800 hover:text-amber-900">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            required
          />
        </div>
        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          {loading ? 'Signing in…' : 'Sign in'}
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
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
        <button type="button" onClick={() => googleLogin()} disabled={loading} className={authSecondaryButtonClass}>
          Continue with Google
        </button>
      ) : (
        <p className="text-center text-xs text-slate-500">Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
      )}
    </AuthLayout>
  );
}
