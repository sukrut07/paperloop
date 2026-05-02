'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(accounts[0]);
        const tempProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(tempProvider);
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      setError('Please install MetaMask');
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAddress(accounts[0] || null);
      });
    }
  }, []);

  return { address, provider, error, connectWallet };
};
