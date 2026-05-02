'use client';

import { motion } from 'framer-motion';
import { User, Wallet, Settings, LogOut, ShieldCheck } from 'lucide-react';

export default function Profile() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex gap-8 items-center">
        <div className="w-32 h-32 neo-border bg-primary flex items-center justify-center text-5xl">
           🏫
        </div>
        <div>
           <h1 className="text-5xl font-black uppercase tracking-tighter">Green High School</h1>
           <p className="text-xl font-bold opacity-70">Educational Institution • Member since May 2024</p>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
           <section className="neo-card bg-white space-y-6">
              <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                 <User size={24}/> Account Settings
              </h2>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <p className="text-xs font-black uppercase opacity-50">Email</p>
                    <p className="font-bold">admin@greenhigh.edu</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-black uppercase opacity-50">Contact Person</p>
                    <p className="font-bold">Sarah Jenkins</p>
                 </div>
                 <div className="space-y-1 col-span-2">
                    <p className="text-xs font-black uppercase opacity-50">Address</p>
                    <p className="font-bold">123 Education Lane, Science City, SC 56789</p>
                 </div>
              </div>
              <button className="neo-button bg-accent text-sm">Update Profile</button>
           </section>

           <section className="neo-card bg-black text-white space-y-6">
              <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                 <Wallet size={24}/> Connected Wallet
              </h2>
              <div className="bg-white/10 p-4 neo-border border-white/20 font-mono text-sm break-all">
                 0x71C7656EC7ab88b098defB751B7401B5f6d8976F
              </div>
              <div className="flex justify-between items-center">
                 <span className="flex items-center gap-2 font-bold text-success">
                    <ShieldCheck size={18}/> Verified on Polygon
                 </span>
                 <button className="text-sm font-black uppercase underline">Change Wallet</button>
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <div className="neo-card bg-secondary text-white space-y-4">
              <h3 className="text-xl font-black uppercase">Impact Tokens</h3>
              <p className="text-5xl font-black">450 <span className="text-lg">PLP</span></p>
              <button className="neo-button bg-white text-black w-full text-sm">Redeem Rewards</button>
           </div>

           <div className="space-y-4 font-bold uppercase">
              <button className="flex items-center gap-4 w-full p-4 hover:bg-gray-100 transition-colors neo-border border-2">
                 <Settings size={20}/> Preferences
              </button>
              <button className="flex items-center gap-4 w-full p-4 hover:bg-red-50 text-red-600 transition-colors neo-border border-2 border-red-600">
                 <LogOut size={20}/> Sign Out
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
