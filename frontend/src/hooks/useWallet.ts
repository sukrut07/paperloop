'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { PAPERLOOP_ABI, PAPERLOOP_ADDRESS, POLYGON_AMOY } from '@/contracts/paperloop';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setError(null);

    if (!window.ethereum) {
      setError('MetaMask is required to write Paperloop transactions.');
      return null;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      setProvider(browserProvider);
      setAddress(accounts[0] || null);
      setChainId(`0x${network.chainId.toString(16)}`);
      return browserProvider;
    } catch (err: any) {
      setError(err.message || 'Wallet connection failed');
      return null;
    }
  }, []);

  const switchToAmoy = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request?.({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_AMOY.chainId }],
      });
      setChainId(POLYGON_AMOY.chainId);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request?.({
          method: 'wallet_addEthereumChain',
          params: [POLYGON_AMOY],
        });
        setChainId(POLYGON_AMOY.chainId);
      } else {
        setError(switchError.message || 'Unable to switch network');
      }
    }
  }, []);

  const contract = useMemo(() => {
    if (!provider || !PAPERLOOP_ADDRESS) return null;
    return new Contract(PAPERLOOP_ADDRESS, PAPERLOOP_ABI, provider) as Contract;
  }, [provider]);

  const signerContract = useCallback(async () => {
    const activeProvider = provider || (await connectWallet());
    if (!activeProvider || !PAPERLOOP_ADDRESS) return null;
    const signer = await activeProvider.getSigner();
    return new Contract(PAPERLOOP_ADDRESS, PAPERLOOP_ABI, signer);
  }, [connectWallet, provider]);

  useEffect(() => {
    if (!window.ethereum?.on) return;

    const handleAccounts = (accounts: unknown) => {
      const nextAccounts = Array.isArray(accounts) ? accounts : [];
      setAddress((nextAccounts[0] as string) || null);
    };
    const handleChain = (nextChainId: unknown) => setChainId(String(nextChainId));

    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChain);

    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccounts);
      window.ethereum?.removeListener?.('chainChanged', handleChain);
    };
  }, []);

  return {
    address,
    provider,
    contract,
    chainId,
    error,
    isAmoy: chainId?.toLowerCase() === POLYGON_AMOY.chainId,
    connectWallet,
    switchToAmoy,
    signerContract,
  };
}
