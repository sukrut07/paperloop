import type { TrackingStatus } from '@/lib/types';

const colorByStatus: Record<TrackingStatus, string> = {
  Created: 'bg-[var(--yellow)]',
  Accepted: 'bg-[var(--cyan)]',
  PickedUp: 'bg-[var(--violet)]',
  InTransit: 'bg-[var(--coral)]',
  Received: 'bg-white',
  Recycled: 'bg-[var(--green)]',
  SentToNGO: 'bg-[var(--cyan)]',
  Delivered: 'bg-black text-white',
};

export function StatusBadge({ status }: { status: TrackingStatus }) {
  return (
    <span className={`inline-flex rounded-md border-2 border-black px-2 py-1 text-xs font-black uppercase ${colorByStatus[status]}`}>
      {status.replace('PickedUp', 'Picked Up').replace('SentToNGO', 'Sent to NGO')}
    </span>
  );
}
