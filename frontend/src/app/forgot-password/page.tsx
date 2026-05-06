'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not send reset email'));
    }
  }

  return (
    <form onSubmit={submit} className="neo-card mx-auto max-w-xl space-y-5 bg-white p-6">
      <h1 className="text-4xl font-black uppercase">Reset Password</h1>
      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-black uppercase"><Mail size={18} /> Email</span>
        <input className="neo-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      {sent ? <p className="font-black text-green-700">Password reset email sent.</p> : null}
      {error ? <p className="font-black text-[var(--coral)]">{error}</p> : null}
      <button className="neo-button w-full bg-[var(--yellow)]">Send Reset Link</button>
      <Link href="/login" className="text-sm font-black uppercase underline">Back to login</Link>
    </form>
  );
}
