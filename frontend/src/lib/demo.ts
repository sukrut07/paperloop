import type { AnalyticsSummary, Batch, TrackingLog } from './types';

export const demoBatches: Batch[] = [
  {
    batchId: 101,
    title: 'Semester answer sheets',
    institutionWallet: '0x0000000000000000000000000000000000000001',
    recyclerWallet: '0x0000000000000000000000000000000000000002',
    weight: 85,
    pagesEstimate: 17000,
    notebooksEstimate: 425,
    status: 'InTransit',
    ipfsHash: 'local-demo-ipfs-hash',
    roomCode: '482913',
    pickupLocation: { lat: 19.076, lng: 72.8777, address: 'Mumbai, Maharashtra' },
    txHashes: { created: '0xdemo101' },
    createdAt: new Date().toISOString(),
  },
  {
    batchId: 102,
    title: 'Unused assignment bundles',
    institutionWallet: '0x0000000000000000000000000000000000000003',
    weight: 120,
    pagesEstimate: 24000,
    notebooksEstimate: 600,
    status: 'Created',
    ipfsHash: 'local-created-ipfs-hash',
    pickupLocation: { lat: 19.11, lng: 72.9, address: 'Andheri East, Mumbai' },
    createdAt: new Date().toISOString(),
  },
  {
    batchId: 103,
    title: 'Library discard papers',
    institutionWallet: '0x0000000000000000000000000000000000000004',
    recyclerWallet: '0x0000000000000000000000000000000000000005',
    weight: 64,
    pagesEstimate: 12800,
    notebooksEstimate: 320,
    status: 'Recycled',
    ipfsHash: 'local-recycled-ipfs-hash',
    createdAt: new Date().toISOString(),
  },
];

export const demoLogs: TrackingLog[] = [
  {
    batchId: 101,
    status: 'Created',
    actorRole: 'institution_admin',
    message: 'Paper batch created by institution',
    txHash: '0xdemo101',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    batchId: 101,
    status: 'Accepted',
    actorRole: 'recycler',
    message: 'Pickup accepted by recycling plant',
    txHash: '0xdemo102',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    batchId: 101,
    status: 'PickedUp',
    actorRole: 'recycler',
    message: 'Paper collected from institution',
    txHash: '0xdemo103',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    batchId: 101,
    status: 'InTransit',
    actorRole: 'recycler',
    message: 'Batch is moving to the recycling plant',
    txHash: '0xdemo104',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
  },
];

export const demoAnalytics: AnalyticsSummary = {
  statusCounts: [
    { _id: 'Created', count: 5, weight: 390 },
    { _id: 'InTransit', count: 2, weight: 180 },
    { _id: 'Recycled', count: 4, weight: 460 },
    { _id: 'Delivered', count: 8, weight: 720 },
  ],
  impact: {
    paperKg: 1750,
    notebooksCreated: 8750,
    studentsImpacted: 2916,
    treesSavedEstimate: 29.17,
    waterSavedLitresEstimate: 45500,
    co2SavedKgEstimate: 2555,
  },
};
