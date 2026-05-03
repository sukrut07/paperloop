import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export function StatCard({ label, value, icon: Icon, color = 'bg-white' }: StatCardProps) {
  return (
    <div className={`neo-card ${color} flex min-h-32 items-center justify-between p-5`}>
      <div>
        <p className="text-sm font-black uppercase opacity-70">{label}</p>
        <p className="mt-1 text-4xl font-black">{value}</p>
      </div>
      <Icon size={42} strokeWidth={3} />
    </div>
  );
}
