'use client';

import { motion } from 'framer-motion';
import { BookOpenCheck, Boxes, Check, ClipboardCheck, Factory, Handshake, PackageCheck, PenSquare, Truck, type LucideIcon } from 'lucide-react';
import { normalizeTrackerStatus } from '@/lib/shipmentFlow';
import type { TrackingStatus } from '@/lib/types';

interface ProgressTrackerProps {
  currentStatus: TrackingStatus;
}

export const statusSteps: Array<{ id: TrackingStatus; label: string; icon: LucideIcon }> = [
  { id: 'Created', label: 'Created', icon: Boxes },
  { id: 'Accepted', label: 'Accepted', icon: Handshake },
  { id: 'PickedUp', label: 'Picked Up', icon: ClipboardCheck },
  { id: 'InTransit', label: 'In Transit', icon: Truck },
  { id: 'ReceivedAtPlant', label: 'Received at Plant', icon: PackageCheck },
  { id: 'Recycled', label: 'Recycled', icon: Factory },
  { id: 'BooksProduced', label: 'Books Produced', icon: PenSquare },
  { id: 'SentToNGO', label: 'Sent to NGO', icon: BookOpenCheck },
  { id: 'Delivered', label: 'Delivered', icon: Check },
];

export default function ProgressTracker({ currentStatus }: ProgressTrackerProps) {
  const currentIndex = Math.max(0, statusSteps.findIndex((step) => step.id === normalizeTrackerStatus(currentStatus)));
  const progress = (currentIndex / (statusSteps.length - 1)) * 100;

  return (
    <div className="w-full overflow-x-auto py-3">
      <div className="relative min-w-[860px] px-3 py-8">
        <div className="absolute left-8 right-8 top-[58px] h-[6px] rounded-full border-2 border-black bg-white" />
        <motion.div
          className="absolute left-8 top-[58px] h-[6px] rounded-full border-2 border-black bg-[var(--green)]"
          initial={{ width: 0 }}
          animate={{ width: `calc((100% - 64px) * ${progress / 100})` }}
        />

        <div className="relative z-10 grid grid-cols-9 gap-3">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isDone = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.id} className="flex flex-col items-center gap-3 text-center">
                <motion.div
                  animate={{ scale: isCurrent ? 1.08 : 1 }}
                  className={`grid h-14 w-14 place-items-center rounded-lg border-[3px] border-black ${
                    isDone ? 'bg-[var(--green)] shadow-[5px_5px_0_#111]' : 'bg-white shadow-[3px_3px_0_#111]'
                  }`}
                >
                  <Icon size={24} strokeWidth={3} />
                </motion.div>
                <div>
                  <p className="text-xs font-black uppercase leading-tight">{step.label}</p>
                  {isCurrent ? <p className="mt-1 text-[10px] font-black uppercase text-[var(--coral)]">Live</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
