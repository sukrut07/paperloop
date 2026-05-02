'use client';

import ProgressTracker from '@/components/ProgressTracker';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { Shield, Clock, Hash, ExternalLink } from 'lucide-react';

export default function TrackingPage() {
  const { batchId } = useParams();

  // Mock data - in real app, fetch from backend/blockchain
  const batchData = {
    id: batchId,
    status: 'InTransit',
    institution: 'Green High School',
    recycler: 'EcoProcess Plants',
    ngo: 'Books For All',
    weight: '150kg',
    txHash: '0x123...abc',
    ipfsHash: 'QmXoy...123',
    logs: [
      { status: 'Created', time: '2024-05-01 10:00 AM', msg: 'Batch created at Green High School' },
      { status: 'Accepted', time: '2024-05-01 02:00 PM', msg: 'Pickup accepted by EcoProcess Plants' },
      { status: 'PickedUp', time: '2024-05-02 09:00 AM', msg: 'Batch collected from institution' },
      { status: 'InTransit', time: '2024-05-02 11:30 AM', msg: 'On the way to recycling plant' },
    ]
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">Track Batch {batchId}</h1>
          <p className="text-xl font-bold opacity-70">Real-time Blockchain Status</p>
        </div>
        <div className="neo-card bg-success py-2 px-4 font-black uppercase text-sm">
          Secured by Polygon
        </div>
      </header>

      {/* Main Tracker */}
      <section className="neo-card bg-white overflow-x-auto">
        <ProgressTracker currentStatus={batchData.status} />
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Batch Info */}
        <div className="space-y-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Details</h2>
          <div className="neo-card bg-primary space-y-4">
             <div className="flex justify-between border-b-2 border-black pb-2">
                <span className="font-black uppercase flex items-center gap-2"><Shield size={18}/> TX Hash</span>
                <span className="font-mono font-bold truncate w-40">{batchData.txHash}</span>
             </div>
             <div className="flex justify-between border-b-2 border-black pb-2">
                <span className="font-black uppercase flex items-center gap-2"><Hash size={18}/> IPFS Hash</span>
                <span className="font-mono font-bold truncate w-40">{batchData.ipfsHash} <ExternalLink size={14} className="inline"/></span>
             </div>
             <div className="flex justify-between">
                <span className="font-black uppercase flex items-center gap-2"><Clock size={18}/> Current Weight</span>
                <span className="font-black text-2xl">{batchData.weight}</span>
             </div>
          </div>
        </div>

        {/* Live Logs */}
        <div className="space-y-6">
           <h2 className="text-3xl font-black uppercase tracking-tighter">Tracking Logs</h2>
           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
              {batchData.logs.reverse().map((log, i) => (
                <div key={i} className="neo-card p-4 flex gap-4 bg-white">
                   <div className={`w-2 h-full ${i === 0 ? 'bg-secondary' : 'bg-gray-200'}`} />
                   <div className="space-y-1">
                      <p className="font-black uppercase text-sm">{log.status}</p>
                      <p className="font-bold text-lg">{log.msg}</p>
                      <p className="text-xs font-bold opacity-50">{log.time}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
