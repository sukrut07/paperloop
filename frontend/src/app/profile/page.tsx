'use client';

import { FormEvent, useState } from 'react';
import { Loader2, Save, ShieldCheck, User } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

function orgLabel(role: string) {
  if (role === 'ngo') return 'NGO Name';
  if (role === 'recycler') return 'Recycler Name';
  return 'Institution Name';
}

export default function Profile() {
  const { user, updateProfile } = useRequireAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Identity Layer</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Profile</h1>
        <p className="mt-2 text-lg font-bold">Paperloop keeps the account shape simple so each role lands straight into its room-first workflow.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ProfileForm key={user.uid} user={user} onSave={updateProfile} />

        <aside className="neo-card space-y-5 bg-black p-6 text-white">
          <h2 className="flex items-center gap-2 text-2xl font-black uppercase">
            <ShieldCheck size={24} /> Access
          </h2>
          <div className="rounded-lg border-2 border-white/40 bg-white/10 p-4">
            <p className="text-sm font-black uppercase">Verification</p>
            <p className="mt-2 text-lg font-black">{user.isVerified ? 'Email verified' : 'Verification pending'}</p>
          </div>
          <div className="rounded-lg border-2 border-white/40 bg-white/10 p-4">
            <p className="text-sm font-black uppercase">Workflow</p>
            <p className="mt-2 font-bold">Shipment rooms, proofs, tracking, and collaboration all run natively inside the web app.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProfileForm({
  user,
  onSave,
}: {
  user: NonNullable<ReturnType<typeof useRequireAuth>['user']>;
  onSave: (input: { name: string; role: Role; organizationName?: string; phone?: string }) => Promise<unknown>;
}) {
  const [name, setName] = useState(user.name || '');
  const [role, setRole] = useState<Role>(user.role);
  const [organizationName, setOrganizationName] = useState(user.organizationName || user.institutionName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(undefined);
    setError(undefined);
    try {
      await onSave({ name, role, organizationName, phone });
      setMessage('Profile saved. Your dashboard access now follows this role.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="neo-card space-y-5 bg-white p-6">
      <h2 className="flex items-center gap-2 text-2xl font-black uppercase">
        <User size={24} /> Account
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-black uppercase">Name</span>
          <input className="neo-input" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-black uppercase">Email</span>
          <input className="neo-input" value={user.email} disabled />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-black uppercase">Role</span>
          <select className="neo-input" value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="institution">Institution</option>
            <option value="recycler">Recycler</option>
            <option value="ngo">NGO</option>
            {user.role === 'admin' ? <option value="admin">Admin</option> : null}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-black uppercase">{orgLabel(role)}</span>
          <input className="neo-input" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-black uppercase">Phone</span>
          <input className="neo-input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 90000 00000" />
        </label>
      </div>
      {message ? <div className="rounded-lg border-[3px] border-black bg-[var(--green)] p-3 font-black">{message}</div> : null}
      {error ? <div className="rounded-lg border-[3px] border-black bg-[var(--coral)] p-3 font-black">{error}</div> : null}
      <button className="neo-button bg-[var(--yellow)]" disabled={saving}>
        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
        Save Profile
      </button>
    </form>
  );
}
