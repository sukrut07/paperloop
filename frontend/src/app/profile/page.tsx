'use client';

import { Save, ShieldCheck, User } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';

function orgLabel(role: string) {
  if (role === 'ngo') return 'NGO Name';
  if (role === 'recycler') return 'Recycler Name';
  return 'Institution Name';
}

export default function Profile() {
  const { user } = useRequireAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Identity Layer</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Profile</h1>
        <p className="mt-2 text-lg font-bold">Paperloop keeps the account shape simple so each role lands straight into its room-first workflow.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="neo-card space-y-5 bg-white p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black uppercase">
            <User size={24} /> Account
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-black uppercase">Name</span>
              <input className="neo-input" defaultValue={user.name} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-black uppercase">Email</span>
              <input className="neo-input" defaultValue={user.email} disabled />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-black uppercase">Role</span>
              <select className="neo-input" value={user.role} disabled>
                <option value="institution">Institution</option>
                <option value="recycler">Recycler</option>
                <option value="ngo">NGO</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-black uppercase">{orgLabel(user.role)}</span>
              <input className="neo-input" defaultValue={user.organizationName || user.institutionName || ''} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-black uppercase">Phone</span>
              <input className="neo-input" defaultValue={user.phone || ''} placeholder="+91 90000 00000" />
            </label>
          </div>
          <button className="neo-button bg-[var(--yellow)]">
            <Save size={18} /> Save Profile
          </button>
        </section>

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
