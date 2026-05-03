'use client';

import { useState } from 'react';
import { Save, ShieldCheck, User, WalletCards } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

export default function Profile() {
  const { address, connectWallet } = useWallet();
  const [role, setRole] = useState('institution_admin');

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Identity Layer</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Profile</h1>
        <p className="mt-2 text-lg font-bold">Firebase identity maps to a Paperloop role and a Polygon wallet.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="neo-card space-y-5 bg-white p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black uppercase"><User size={24} /> Account</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-black uppercase">Name</span>
              <input className="neo-input" defaultValue="Paperloop Public School" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-black uppercase">Email</span>
              <input className="neo-input" defaultValue="admin@paperloop.edu" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-black uppercase">Role</span>
              <select className="neo-input" value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="teacher">Teacher</option>
                <option value="institution_admin">Institution Admin</option>
                <option value="recycler">Recycler</option>
                <option value="ngo_admin">NGO Admin</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-black uppercase">Location</span>
              <input className="neo-input" defaultValue="Mumbai, Maharashtra" />
            </label>
          </div>
          <button className="neo-button bg-[var(--yellow)]"><Save size={18} /> Save Profile</button>
        </section>

        <aside className="neo-card space-y-5 bg-black p-6 text-white">
          <h2 className="flex items-center gap-2 text-2xl font-black uppercase"><WalletCards size={24} /> Wallet</h2>
          <div className="break-all rounded-lg border-2 border-white/40 bg-white/10 p-4 font-mono text-sm">
            {address || 'No wallet connected'}
          </div>
          <button className="neo-button w-full bg-white text-black" onClick={connectWallet}>
            Connect MetaMask
          </button>
          <p className="flex items-center gap-2 text-sm font-black uppercase text-[var(--green)]">
            <ShieldCheck size={18} />
            Used for immutable status updates
          </p>
        </aside>
      </div>
    </div>
  );
}
