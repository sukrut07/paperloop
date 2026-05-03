'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileImage, Hash, Info, Loader2, Upload, Weight } from 'lucide-react';
import { TxStatus } from '@/components/TxStatus';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/lib/api';

const demoInstitutionId = process.env.NEXT_PUBLIC_DEMO_INSTITUTION_ID || '000000000000000000000001';

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreateBatch() {
  const [title, setTitle] = useState('Unused assignment sheets');
  const [weight, setWeight] = useState(50);
  const [roomCode, setRoomCode] = useState('');
  const [addressText, setAddressText] = useState('Mumbai, Maharashtra');
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [createdBatchId, setCreatedBatchId] = useState<number>();
  const [error, setError] = useState<string>();
  const { address, signerContract, connectWallet } = useWallet();

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const encoded = await Promise.all(Array.from(files).slice(0, 4).map(readFileAsDataUrl));
    setProofImages(encoded);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    setTxHash(undefined);
    setCreatedBatchId(undefined);

    try {
      let institutionWallet = address;
      if (!institutionWallet) {
        const connectedProvider = await connectWallet();
        institutionWallet = connectedProvider ? await (await connectedProvider.getSigner()).getAddress() : null;
      }
      if (!institutionWallet) throw new Error('Connect MetaMask before creating a blockchain batch.');

      const ipfs = await api.prepareBatchIPFS({
        title,
        institutionId: demoInstitutionId,
        institutionWallet,
        weight,
        roomCode: roomCode || undefined,
        pickupLocation: { lat: 19.076, lng: 72.8777, address: addressText },
        proofImages,
      });

      const contract = await signerContract();
      let batchId = Date.now();
      let receiptHash = `local-${batchId}`;

      if (contract) {
        const tx = await contract.createBatch(weight, ipfs.ipfsHash);
        const receipt = await tx.wait();
        receiptHash = receipt.hash;
        const parsed = receipt.logs
          .map((log: any) => {
            try {
              return contract.interface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find((eventLog: any) => eventLog?.name === 'BatchCreated');
        batchId = parsed ? Number(parsed.args.batchId) : batchId;
      }

      await api.createBatch({
        batchId,
        institutionId: demoInstitutionId,
        institutionWallet,
        title,
        weight,
        roomCode: roomCode || undefined,
        pickupLocation: { lat: 19.076, lng: 72.8777, address: addressText },
        proofImages,
        ipfsHash: ipfs.ipfsHash,
        txHash: receiptHash,
      });

      setCreatedBatchId(batchId);
      setTxHash(receiptHash);
    } catch (err: any) {
      setError(err.message || 'Could not create batch');
    } finally {
      setLoading(false);
    }
  }

  if (createdBatchId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="neo-card bg-[var(--green)] p-8 text-center">
          <CheckCircle2 className="mx-auto" size={72} strokeWidth={3} />
          <h1 className="mt-5 text-4xl font-black uppercase">Batch Created</h1>
          <p className="mt-2 text-lg font-bold">Batch #{createdBatchId} is now ready for recycler pickup.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/tracking/${createdBatchId}`} className="neo-button bg-white">
              Track Batch
            </Link>
            <button className="neo-button bg-[var(--yellow)]" onClick={() => setCreatedBatchId(undefined)}>
              Create Another
            </button>
          </div>
        </div>
        <TxStatus hash={txHash} label="Transaction confirmed" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Institution Layer</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Create Batch</h1>
        <p className="mt-2 text-lg font-bold">Upload proofs to Pinata IPFS, then create the immutable batch on Polygon.</p>
      </header>

      <form onSubmit={submit} className="neo-card space-y-6 bg-white p-6">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><Hash size={18} /> Batch Title</span>
          <input className="neo-input" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><Weight size={18} /> Total Weight in KG</span>
          <input className="neo-input" type="number" min={1} value={weight} onChange={(event) => setWeight(Number(event.target.value))} required />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-black uppercase"><Info size={18} /> Room Code</span>
            <input className="neo-input" value={roomCode} onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 digits" />
          </label>
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-black uppercase">Pickup Location</span>
            <input className="neo-input" value={addressText} onChange={(event) => setAddressText(event.target.value)} required />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><FileImage size={18} /> Proof Images</span>
          <div className="rounded-lg border-[3px] border-dashed border-black bg-[var(--paper)] p-8 text-center">
            <Upload className="mx-auto" size={42} strokeWidth={3} />
            <p className="mt-3 font-black uppercase">{proofImages.length ? `${proofImages.length} file(s) ready` : 'Upload paper proof images'}</p>
            <input className="mt-4 w-full font-bold" type="file" accept="image/*" multiple onChange={(event) => handleFiles(event.target.files)} />
          </div>
        </label>

        {error ? <div className="rounded-lg border-[3px] border-black bg-[var(--coral)] p-3 font-black">{error}</div> : null}

        <button className="neo-button w-full bg-[var(--yellow)] py-4 text-lg" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          {loading ? 'Creating on IPFS and Polygon' : 'Generate Batch ID'}
        </button>
      </form>

      <TxStatus hash={txHash} loading={loading} label="Blockchain transaction in progress" />
    </div>
  );
}
