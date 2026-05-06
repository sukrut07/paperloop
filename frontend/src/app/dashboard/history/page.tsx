'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { api } from '@/lib/api';
import type { ShipmentHistoryItem } from '@/lib/types';

export default function DashboardHistoryPage() {
  const [history, setHistory] = useState<ShipmentHistoryItem[]>([]);

  useEffect(() => {
    api.shipmentHistory().then(setHistory);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Completed Shipments</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Shipment History</h1>
      </header>
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="neo-card bg-white p-5">
            <p className="flex items-center gap-2 text-2xl font-black"><History size={22} /> {item.shipmentName}</p>
            <p className="mt-2 font-bold">{item.recyclerDetails}</p>
            <p className="font-bold">{item.ngoDetails}</p>
            <p className="mt-2 break-all font-bold opacity-70">{item.totalWeight} kg · {item.deliveryProof}</p>
            <p className="mt-1 text-sm font-bold opacity-60">{item.verificationSummary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
