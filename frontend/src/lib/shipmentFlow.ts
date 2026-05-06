import type { TrackingStatus } from './types';

export const trackerStatuses: TrackingStatus[] = [
  'Created',
  'Accepted',
  'PickedUp',
  'InTransit',
  'ReceivedAtPlant',
  'Recycled',
  'BooksProduced',
  'SentToNGO',
  'Delivered',
];

export const trackingStatusLabels: Record<TrackingStatus, string> = {
  Created: 'Created',
  Accepted: 'Accepted',
  PickupStarted: 'Pickup Started',
  PickedUp: 'Picked Up',
  InTransit: 'In Transit',
  ReceivedAtPlant: 'Received at Plant',
  Processing: 'Processing',
  Recycled: 'Recycled',
  BooksProduced: 'Books Produced',
  SentToNGO: 'Sent to NGO',
  ReceivedByNGO: 'Received',
  DistributionStarted: 'Distribution Started',
  Delivered: 'Delivered',
  Rejected: 'Rejected',
};

export function formatTrackingStatus(status: TrackingStatus) {
  return trackingStatusLabels[status] || status;
}

export function statusRank(status: TrackingStatus) {
  const trackerIndex = trackerStatuses.indexOf(normalizeTrackerStatus(status));
  return trackerIndex === -1 ? 0 : trackerIndex;
}

export function normalizeTrackerStatus(status: TrackingStatus): TrackingStatus {
  if (status === 'PickupStarted') return 'Accepted';
  if (status === 'Processing') return 'ReceivedAtPlant';
  if (status === 'ReceivedByNGO' || status === 'DistributionStarted') return 'SentToNGO';
  if (status === 'Rejected') return 'Created';
  return status;
}

export function isRoomDelivered(status?: TrackingStatus) {
  return Boolean(status && normalizeTrackerStatus(status) === 'Delivered');
}
