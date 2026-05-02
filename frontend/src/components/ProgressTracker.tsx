'use client';

import { motion } from 'framer-motion';
import { Check, Truck, Recycle, Gift, School, Package, ClipboardCheck, UserCheck } from 'lucide-react';

interface ProgressTrackerProps {
  currentStatus: string;
}

const statuses = [
  { id: 'Created', label: 'Created', icon: School },
  { id: 'Accepted', label: 'Accepted', icon: UserCheck },
  { id: 'PickedUp', label: 'Picked Up', icon: ClipboardCheck },
  { id: 'InTransit', label: 'In Transit', icon: Truck },
  { id: 'Received', label: 'Received', icon: Package },
  { id: 'Recycled', label: 'Recycled', icon: Recycle },
  { id: 'SentToNGO', label: 'Sent to NGO', icon: Gift },
  { id: 'Delivered', label: 'Delivered', icon: Check },
];

const ProgressTracker = ({ currentStatus }: ProgressTrackerProps) => {
  const currentIndex = statuses.findIndex(s => s.id === currentStatus);

  return (
    <div className="w-full py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-8 md:gap-0">
        {/* Connection Line */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-black -translate-y-1/2 z-0" />
        
        {statuses.map((status, index) => {
          const Icon = status.icon;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={status.id} className="flex md:flex-col items-center gap-4 md:gap-2 z-10 relative">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? '#00FF41' : '#FFFFFF',
                  scale: isCurrent ? 1.2 : 1,
                }}
                className={`w-12 h-12 neo-border flex items-center justify-center ${
                  isCurrent ? 'neo-shadow' : 'neo-shadow-sm'
                }`}
              >
                <Icon size={24} color="black" strokeWidth={3} />
              </motion.div>
              
              <div className="flex flex-col md:items-center">
                <span className={`text-sm font-black uppercase tracking-tighter ${
                  isCurrent ? 'text-secondary' : 'text-black'
                }`}>
                  {status.label}
                </span>
                {isCurrent && (
                  <span className="text-[10px] font-bold text-black opacity-50 uppercase">
                    Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;
