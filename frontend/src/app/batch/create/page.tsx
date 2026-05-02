'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Weight, Info, CheckCircle } from 'lucide-react';

export default function CreateBatch() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto neo-card bg-success text-center space-y-8 py-16">
        <CheckCircle size={80} className="mx-auto" />
        <h1 className="text-5xl font-black uppercase tracking-tighter">Batch Created!</h1>
        <p className="text-xl font-bold">Transaction submitted to Polygon. IPFS hash generated.</p>
        <button onClick={() => setSuccess(false)} className="neo-button bg-white">
          Create Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header>
        <h1 className="text-5xl font-black uppercase tracking-tighter">Create New Batch</h1>
        <p className="text-xl font-bold opacity-70">Register your paper waste for recycling</p>
      </header>

      <form onSubmit={handleSubmit} className="neo-card bg-white space-y-8">
        {/* Weight Input */}
        <div className="space-y-2">
          <label className="text-xl font-black uppercase flex items-center gap-2">
            <Weight size={24}/> Total Weight (KG)
          </label>
          <input 
            type="number" 
            placeholder="e.g. 50" 
            className="neo-input text-2xl font-black h-16"
            required
          />
        </div>

        {/* Room Code */}
        <div className="space-y-2">
          <label className="text-xl font-black uppercase flex items-center gap-2">
            <Info size={24}/> Room Code (Optional)
          </label>
          <input 
            type="text" 
            placeholder="6-digit code" 
            className="neo-input font-bold"
            maxLength={6}
          />
        </div>

        {/* Proof Upload */}
        <div className="space-y-2">
          <label className="text-xl font-black uppercase">Upload Proof Images</label>
          <div className="border-4 border-dashed border-black p-12 text-center space-y-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload size={48} className="mx-auto text-secondary" />
            <p className="font-bold uppercase tracking-tighter">Click or drag images of the paper batch</p>
            <p className="text-xs opacity-50 font-bold">PNG, JPG up to 10MB</p>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`neo-button w-full text-2xl py-6 bg-primary ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Processing...' : 'GENERATE BATCH ID'}
        </button>
      </form>

      <div className="neo-card bg-accent/20 flex gap-4 items-start">
         <Info className="text-accent shrink-0" />
         <p className="text-sm font-bold">
           By submitting, you confirm the weight is accurate. This data will be immutably stored on the blockchain and IPFS.
         </p>
      </div>
    </div>
  );
}
