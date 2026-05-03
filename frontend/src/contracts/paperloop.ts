export const PAPERLOOP_ADDRESS = process.env.NEXT_PUBLIC_PAPERLOOP_CONTRACT_ADDRESS || '';

export const POLYGON_AMOY = {
  chainId: '0x13882',
  chainName: 'Polygon Amoy',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: [process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
};

export const PAPERLOOP_ABI = [
  'event BatchCreated(uint256 indexed batchId,address indexed institutionWallet,uint256 weight,string ipfsHash)',
  'function createBatch(uint256 weight,string ipfsHash) returns (uint256)',
  'function acceptBatch(uint256 batchId)',
  'function pickupBatch(uint256 batchId)',
  'function markInTransit(uint256 batchId)',
  'function confirmReceived(uint256 batchId)',
  'function markRecycled(uint256 batchId)',
  'function acceptDonation(uint256 batchId)',
  'function confirmDistribution(uint256 batchId)',
  'function getBatch(uint256 batchId) view returns (tuple(uint256 batchId,address institutionWallet,address recyclerWallet,address ngoWallet,uint256 weight,string ipfsHash,uint8 status,uint256 createdAt))',
] as const;
