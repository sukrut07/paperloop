'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Loader2, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { firebaseConfigError } from '@/services/firebase';
import type { Role } from '@/lib/types';

const dashboardByRole: Record<Role, string> = {
  institution: '/dashboard',
  recycler: '/dashboard/recyclers',
  ngo: '/dashboard/ngo',
  admin: '/dashboard/admin',
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function orgLabel(role: Role) {
  if (role === 'ngo') return 'NGO name';
  if (role === 'recycler') return 'Recycler name';
  return 'Institution name';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [googleRole, setGoogleRole] = useState<Role>('institution');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      await login(email, password, remember);
      router.replace(searchParams.get('next') || dashboardByRole[user?.role || 'institution']);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    if (firebaseConfigError) {
      setError(firebaseConfigError);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      if (!organizationName.trim()) throw new Error(`${orgLabel(googleRole)} is required`);
      await loginWithGoogle(googleRole, remember, organizationName);
      router.replace(searchParams.get('next') || dashboardByRole[googleRole]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Google login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <form onSubmit={submit} className="neo-card space-y-5 bg-white p-5 sm:p-6">
        <div>
          <p className="font-black uppercase text-[var(--coral)]">Secure Access</p>
          <h1 className="mt-2 text-3xl font-black uppercase sm:text-4xl">Login</h1>
        </div>
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><Mail size={18} /> Email</span>
          <input className="neo-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><KeyRound size={18} /> Password</span>
          <input className="neo-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <label className="flex items-center gap-3 font-black uppercase">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          Remember session
        </label>
        {error ? <div className="break-words rounded-lg border-[3px] border-black bg-[var(--coral)] p-3 text-sm font-black sm:text-base">{error}</div> : null}
        <button className="neo-button w-full bg-[var(--yellow)]" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : null}
          Login
        </button>
        <div className="flex flex-wrap gap-3 text-sm font-black uppercase">
          <Link href="/forgot-password" className="underline">Forgot password</Link>
          <Link href="/signup" className="underline">Create account</Link>
        </div>
      </form>

      <aside className="neo-card space-y-5 bg-white p-5 sm:p-6">
        <div>
          <p className="font-black uppercase text-[var(--violet)]">One-click access</p>
          <h2 className="mt-2 text-2xl font-black uppercase">Google Login</h2>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-black uppercase">Role for first login</span>
          <select className="neo-input" value={googleRole} onChange={(event) => setGoogleRole(event.target.value as Role)}>
            <option value="institution">Institution</option>
            <option value="recycler">Recycler</option>
            <option value="ngo">NGO</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-black uppercase">{orgLabel(googleRole)}</span>
          <input className="neo-input" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder={orgLabel(googleRole)} />
        </label>
        <button className="neo-button w-full bg-[var(--yellow)]" onClick={google} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          Continue with Google
        </button>
        {firebaseConfigError ? (
          <p className="break-words text-sm font-black text-[var(--coral)]">{firebaseConfigError}</p>
        ) : null}
      </aside>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
