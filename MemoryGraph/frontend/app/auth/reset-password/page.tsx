'use client';

import { AuthError, AuthLayout, authInputClass, authPrimaryButtonClass } from '@/app/components/AuthLayout';
import { API_URL } from '@/app/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, new_password: password }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Reset failed');
      router.push('/auth/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Enter the code from your email.">
      {error && <AuthError message={error} />}
      <form onSubmit={submit} className="space-y-4">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={authInputClass} />
        <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" className={authInputClass} />
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className={authInputClass} />
        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f0df] flex items-center justify-center">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
