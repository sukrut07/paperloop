import type { TrackingStatus } from '@/lib/types';
import { formatTrackingStatus, normalizeTrackerStatus } from '@/lib/shipmentFlow';

const colorByStatus: Record<TrackingStatus, string> = {
  Created: 'bg-[var(--yellow)]',
  Accepted: 'bg-[var(--cyan)]',
  PickupStarted: 'bg-[var(--cyan)]',
  PickedUp: 'bg-[var(--violet)]',
  InTransit: 'bg-[var(--coral)]',
  ReceivedAtPlant: 'bg-white',
  Processing: 'bg-white',
  Recycled: 'bg-[var(--green)]',
  BooksProduced: 'bg-[var(--green)]',
  SentToNGO: 'bg-[var(--cyan)]',
  ReceivedByNGO: 'bg-[var(--yellow)]',
  DistributionStarted: 'bg-[var(--yellow)]',
  Delivered: 'bg-black text-white',
  Rejected: 'bg-[var(--coral)]',
};

export function StatusBadge({ status }: { status: TrackingStatus }) {
  const displayStatus = normalizeTrackerStatus(status);
  return (
    <span className={`inline-flex rounded-md border-2 border-black px-2 py-1 text-xs font-black uppercase ${colorByStatus[status] || colorByStatus[displayStatus]}`}>
      {formatTrackingStatus(displayStatus)}
    </span>
  );
}
