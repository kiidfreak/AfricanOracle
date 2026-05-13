import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export interface WalletState {
  address: string | null;
  balance: string;
  isDemo: boolean;
  network: string;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0.00',
    isDemo: true,
    network: 'Arc Testnet [Demo]'
  });

  useEffect(() => {
    // Generate or retrieve ephemeral wallet
    const storedKey = localStorage.getItem('africast_demo_key');
    let privateKey: string;

    if (storedKey) {
      privateKey = storedKey;
    } else {
      const newWallet = ethers.Wallet.createRandom();
      privateKey = newWallet.privateKey;
      localStorage.setItem('africast_demo_key', privateKey);
    }

    const ethersWallet = new ethers.Wallet(privateKey);
    
    // In a real demo, we'd fetch balance from Arc RPC
    // For now, we simulate a small balance
    setWallet({
      address: ethersWallet.address,
      balance: '125.50',
      isDemo: true,
      network: 'Arc Testnet [Demo]'
    });
  }, []);

  return wallet;
};
