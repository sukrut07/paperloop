'use client';

import { motion } from 'framer-motion';
import { Plus, Users, ClipboardList, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function InstitutionDashboard() {
  const stats = [
    { label: 'Total Batches', value: '12', icon: ClipboardList, color: 'bg-primary' },
    { label: 'Active Rooms', value: '3', icon: Users, color: 'bg-accent' },
    { label: 'KG Recycled', value: '450', icon: TrendingUp, color: 'bg-success' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">Institution Dashboard</h1>
          <p className="text-xl font-bold opacity-70">Welcome back, Green High School</p>
        </div>
        <div className="flex gap-4">
          <Link href="/room/create" className="neo-button bg-accent">
            <Plus className="inline mr-2" /> Create Room
          </Link>
          <Link href="/batch/create" className="neo-button">
            <Plus className="inline mr-2" /> New Batch
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className={`neo-card ${stat.color} flex items-center justify-between`}
          >
            <div>
              <p className="font-black uppercase text-sm opacity-70">{stat.label}</p>
              <p className="text-4xl font-black">{stat.value}</p>
            </div>
            <stat.icon size={40} />
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Recent Batches</h2>
        <div className="space-y-4">
          {[
            { id: '#B001', weight: '50kg', status: 'InTransit', date: '2024-05-01' },
            { id: '#B002', weight: '120kg', status: 'Recycled', date: '2024-04-28' },
            { id: '#B003', weight: '30kg', status: 'Created', date: '2024-05-02' },
          ].map((batch, i) => (
            <div key={i} className="neo-card flex justify-between items-center bg-white hover:bg-gray-50 cursor-pointer">
              <div className="flex gap-8 items-center">
                <span className="font-black text-2xl">{batch.id}</span>
                <span className="neo-button bg-primary py-1 px-3 text-xs">{batch.weight}</span>
              </div>
              <div className="flex gap-8 items-center">
                <span className={`font-black uppercase px-2 py-1 ${
                  batch.status === 'Recycled' ? 'bg-success' : 'bg-accent'
                }`}>
                  {batch.status}
                </span>
                <span className="font-bold opacity-50">{batch.date}</span>
                <Link href={`/tracking/${batch.id}`} className="neo-button bg-black text-white text-xs">
                  Track
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
