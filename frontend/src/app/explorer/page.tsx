'use client';

import { motion } from 'framer-motion';
import { Search, ExternalLink, Box, Activity } from 'lucide-react';

export default function Explorer() {
  const transactions = [
    { hash: '0x3a4b...2d1', batch: '#B003', type: 'Create', time: '2 mins ago', status: 'Success' },
    { hash: '0x1f2e...9c8', batch: '#B001', type: 'Recycle', time: '1 hour ago', status: 'Success' },
    { hash: '0x7d6a...5b4', batch: '#B002', type: 'Pickup', time: '3 hours ago', status: 'Success' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">Chain Explorer</h1>
          <p className="text-xl font-bold opacity-70">Verifiable Paperloop Ledger</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
          <input 
            type="text" 
            placeholder="Search Batch ID / TX Hash" 
            className="neo-input pl-12 h-14"
          />
        </div>
      </header>

      {/* Network Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'Total Batches', value: '1,245', icon: Box },
          { label: 'Active Transactions', value: '42', icon: Activity },
          { label: 'Avg Process Time', value: '4.2 Days', icon: Activity },
          { label: 'Impact Score', value: '98.5', icon: Activity },
        ].map((stat, i) => (
          <div key={i} className="neo-card p-4 flex gap-4 items-center bg-white">
             <div className="bg-primary p-2 neo-border">
                <stat.icon size={20} />
             </div>
             <div>
                <p className="text-xs font-black uppercase opacity-50">{stat.label}</p>
                <p className="text-xl font-black">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="neo-card bg-white overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b-4 border-black">
            <tr className="font-black uppercase text-sm">
              <th className="p-4">TX Hash</th>
              <th className="p-4">Type</th>
              <th className="p-4">Batch</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {transactions.map((tx, i) => (
              <tr key={i} className="border-b-2 border-black hover:bg-gray-50 transition-colors">
                <td className="p-4 text-secondary font-mono text-xs">{tx.hash}</td>
                <td className="p-4 uppercase">{tx.type}</td>
                <td className="p-4">{tx.batch}</td>
                <td className="p-4">
                   <span className="bg-success px-2 py-1 text-xs uppercase">{tx.status}</span>
                </td>
                <td className="p-4 text-right opacity-50">{tx.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
