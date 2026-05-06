'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, ShieldCheck, Sparkles, User } from 'lucide-react';
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

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('institution');
  const [organizationName, setOrganizationName] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!organizationName.trim()) {
      setError(`${orgLabel(role)} is required`);
      return;
    }
    setLoading(true);
    try {
      await signup({ name, email, password, role, remember, organizationName });
      router.replace(dashboardByRole[role]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Signup failed'));
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
      if (!organizationName.trim()) throw new Error(`${orgLabel(role)} is required`);
      await loginWithGoogle(role, remember, organizationName);
      router.replace(dashboardByRole[role]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Google signup failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <form onSubmit={submit} className="neo-card space-y-5 bg-white p-5 sm:p-6">
        <div>
          <p className="font-black uppercase text-[var(--coral)]">Paperloop Identity</p>
          <h1 className="mt-2 text-3xl font-black uppercase sm:text-4xl">Sign Up</h1>
        </div>
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><User size={18} /> Full name</span>
          <input className="neo-input" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><Mail size={18} /> Email</span>
          <input className="neo-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-black uppercase">Password</span>
            <input className="neo-input" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-black uppercase">Confirm password</span>
            <input className="neo-input" type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><ShieldCheck size={18} /> Role</span>
          <select className="neo-input" value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="institution">Institution</option>
            <option value="recycler">Recycler</option>
            <option value="ngo">NGO</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-black uppercase">{orgLabel(role)}</span>
          <input className="neo-input" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder={orgLabel(role)} required />
        </label>
        <label className="flex items-center gap-3 font-black uppercase">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          Remember session
        </label>
        {error ? <div className="break-words rounded-lg border-[3px] border-black bg-[var(--coral)] p-3 text-sm font-black sm:text-base">{error}</div> : null}
        <button className="neo-button w-full bg-[var(--yellow)]" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : null}
          Create Account
        </button>
        <Link href="/login" className="text-sm font-black uppercase underline">Already have an account?</Link>
      </form>

      <aside className="neo-card space-y-5 bg-white p-5 sm:p-6">
        <div>
          <p className="font-black uppercase text-[var(--violet)]">Fast signup</p>
          <h2 className="mt-2 text-2xl font-black uppercase">Use Google</h2>
        </div>
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><ShieldCheck size={18} /> Role</span>
          <select className="neo-input" value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="institution">Institution</option>
            <option value="recycler">Recycler</option>
            <option value="ngo">NGO</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-black uppercase">{orgLabel(role)}</span>
          <input className="neo-input" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder={orgLabel(role)} required />
        </label>
        <button className="neo-button w-full bg-[var(--yellow)]" type="button" onClick={google} disabled={loading}>
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
