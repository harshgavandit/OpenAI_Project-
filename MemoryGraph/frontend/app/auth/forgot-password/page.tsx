'use client';

import { AuthError, AuthLayout, authInputClass, authPrimaryButtonClass } from '@/app/components/AuthLayout';
import { API_URL } from '@/app/lib/api';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || 'Request failed');
      setMessage(data.message || 'If an account exists, a code was sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We will email you a verification code."
      footer={
        <>
          Remembered it? <Link href="/auth/login" className="font-semibold text-amber-800">Sign in</Link>
        </>
      }
    >
      {error && <AuthError message={error} />}
      {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} />
        </label>
        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          {loading ? 'Sending…' : 'Send reset code'}
        </button>
      </form>
      {message && (
        <Link href={`/auth/reset-password?email=${encodeURIComponent(email)}`} className="mt-4 block text-center text-sm font-semibold text-amber-800">
          Enter code →
        </Link>
      )}
    </AuthLayout>
  );
}
