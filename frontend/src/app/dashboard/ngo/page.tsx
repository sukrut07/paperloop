'use client';

import { motion } from 'framer-motion';
import { Gift, BookOpen, Users, Truck } from 'lucide-react';

export default function NGODashboard() {
  const stockRequests = [
    { id: '#B002', weight: '120kg', source: 'EcoProcess Plants', status: 'In Transit' },
  ];

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-5xl font-black uppercase tracking-tighter">NGO Dashboard</h1>
        <p className="text-xl font-bold opacity-70">Manage Notebook Distribution</p>
      </header>

      {/* Impact Stats */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="neo-card bg-accent flex items-center justify-between">
           <div>
              <p className="font-black uppercase text-sm opacity-70">Notebooks Distributed</p>
              <p className="text-5xl font-black">2,450</p>
           </div>
           <BookOpen size={64} />
        </div>
        <div className="neo-card bg-primary flex items-center justify-between">
           <div>
              <p className="font-black uppercase text-sm opacity-70">Students Impacted</p>
              <p className="text-5xl font-black">1,200</p>
           </div>
           <Users size={64} />
        </div>
      </div>

      {/* Incoming Stock */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Incoming Stock</h2>
        {stockRequests.map((req, i) => (
          <div key={i} className="neo-card flex justify-between items-center bg-white">
             <div className="flex gap-8 items-center">
                <Gift size={32} className="text-secondary" />
                <div>
                   <p className="text-2xl font-black">Batch {req.id}</p>
                   <p className="font-bold opacity-50">From: {req.source}</p>
                </div>
             </div>
             <div className="flex gap-6 items-center">
                <div className="flex items-center gap-2 font-bold bg-gray-100 px-3 py-1 neo-border border-2">
                   <Truck size={18} /> {req.status}
                </div>
                <button className="neo-button bg-success text-sm">
                   Confirm Distribution
                </button>
             </div>
          </div>
        ))}
      </section>

      {/* Impact Report Section */}
      <section className="neo-card bg-black text-white p-12 space-y-6">
         <h2 className="text-4xl font-black uppercase tracking-tighter">Generate Impact Report</h2>
         <p className="text-xl font-bold opacity-80">
           Download a verifiable blockchain report of your NGO's recycling impact to share with donors and partners.
         </p>
         <button className="neo-button bg-white text-black text-lg">
           Download PDF Report
         </button>
      </section>
    </div>
  );
}
