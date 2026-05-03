import { ethers } from 'ethers';

const PAPERLOOP_ABI = [
  'function getBatch(uint256 batchId) view returns (tuple(uint256 batchId,address institutionWallet,address recyclerWallet,address ngoWallet,uint256 weight,string ipfsHash,uint8 status,uint256 createdAt))',
];

export function getPaperloopContract() {
  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL || process.env.AMOY_RPC_URL;
  const contractAddress = process.env.PAPERLOOP_CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    return null;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(contractAddress, PAPERLOOP_ABI, provider);
}

export async function readOnChainBatch(batchId: number) {
  const contract = getPaperloopContract();
  if (!contract) return null;

  const batch = await contract.getBatch(batchId);
  return {
    batchId: Number(batch.batchId),
    institutionWallet: String(batch.institutionWallet).toLowerCase(),
    recyclerWallet: String(batch.recyclerWallet).toLowerCase(),
    ngoWallet: String(batch.ngoWallet).toLowerCase(),
    weight: Number(batch.weight),
    ipfsHash: String(batch.ipfsHash),
    status: Number(batch.status),
    createdAt: Number(batch.createdAt),
  };
}
