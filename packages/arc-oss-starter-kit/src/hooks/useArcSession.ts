import { useState, useEffect, useCallback } from 'react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Address, Hex, toHex, stringify } from 'viem';
import { SessionState, SessionDelegationMessage } from '../types';

const STORAGE_KEY = 'arc_session_state';
const ARC_CHAIN_ID = 5042002;

export function useArcSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Re-construct the session with BigInt parsing
        setSession({
          privateKey: parsed.privateKey,
          publicKey: parsed.publicKey,
          delegationSignature: parsed.delegationSignature,
          delegationMessage: parsed.delegationMessage,
          remainingAllowance: BigInt(parsed.remainingAllowance),
          isAuthorized: parsed.isAuthorized,
        });
      }
    } catch (err) {
      console.error('Failed to load session from local storage:', err);
    }
  }, []);

  // Save session to localStorage when it changes
  const saveSession = (newSession: SessionState | null) => {
    setSession(newSession);
    if (newSession) {
      const serializable = {
        privateKey: newSession.privateKey,
        publicKey: newSession.publicKey,
        delegationSignature: newSession.delegationSignature,
        delegationMessage: newSession.delegationMessage,
        remainingAllowance: newSession.remainingAllowance.toString(),
        isAuthorized: newSession.isAuthorized,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  /**
   * Initializes a new session key and prompts the user to sign the delegation message.
   * @param walletClient The primary user's viem WalletClient (e.g. from wagmi useWalletClient)
   * @param primaryAddress The primary user's wallet address
   * @param maxUSDCAllowance The maximum amount of USDC the session can spend (e.g., 5.00)
   * @param durationSeconds Expiration duration in seconds (defaults to 2 hours)
   */
  const createSession = useCallback(
    async (
      walletClient: any,
      primaryAddress: Address,
      maxUSDCAllowance: number,
      durationSeconds = 7200
    ) => {
      if (!walletClient) {
        throw new Error('Wallet client is required to sign delegation');
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Generate ephemeral session key
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        const sessionPublicKey = account.address;

        // 2. Prepare delegation parameters
        const allowanceWei = BigInt(Math.round(maxUSDCAllowance * 1000000)); // 6 decimals for USDC
        const expiry = Math.floor(Date.now() / 1000) + durationSeconds;
        const nonce = toHex(Math.floor(Math.random() * 1000000000));

        const delegationMessage: SessionDelegationMessage = {
          primaryOwner: primaryAddress,
          sessionPublicKey,
          allowance: allowanceWei.toString(),
          expiry,
          allowedTarget: '*', // Can be scoped to specific contracts in production
          nonce,
        };

        // 3. EIP-712 Domain and Types
        const domain = {
          name: 'ArcSessionKeyManager',
          version: '1',
          chainId: ARC_CHAIN_ID,
        } as const;

        const types = {
          SessionDelegation: [
            { name: 'primaryOwner', type: 'address' },
            { name: 'sessionPublicKey', type: 'address' },
            { name: 'allowance', type: 'string' },
            { name: 'expiry', type: 'uint256' },
            { name: 'allowedTarget', type: 'string' },
            { name: 'nonce', type: 'string' },
          ],
        } as const;

        // 4. Request signature from primary wallet
        const signature = await walletClient.signTypedData({
          account: primaryAddress,
          domain,
          types,
          primaryType: 'SessionDelegation',
          message: delegationMessage,
        });

        // 5. Initialize session state
        const newSession: SessionState = {
          privateKey,
          publicKey: sessionPublicKey,
          delegationMessage,
          delegationSignature: signature,
          remainingAllowance: allowanceWei,
          isAuthorized: true,
        };

        saveSession(newSession);
        return newSession;
      } catch (err: any) {
        setError(err.message || 'Failed to authorize session key');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Revoke the current session key
   */
  const revokeSession = useCallback(() => {
    saveSession(null);
  }, []);

  /**
   * Deduct an amount from the remaining allowance
   */
  const spendAllowance = useCallback(
    (amount: bigint) => {
      if (!session) return false;
      if (session.remainingAllowance < amount) return false;

      const updated = {
        ...session,
        remainingAllowance: session.remainingAllowance - amount,
      };
      saveSession(updated);
      return true;
    },
    [session]
  );

  /**
   * Helper to check if the session is currently valid
   */
  const isSessionValid = useCallback(() => {
    if (!session || !session.isAuthorized) return false;
    const now = Math.floor(Date.now() / 1000);
    return now < session.delegationMessage.expiry && session.remainingAllowance > 0n;
  }, [session]);

  return {
    session,
    isLoading,
    error,
    createSession,
    revokeSession,
    spendAllowance,
    isSessionValid: isSessionValid(),
  };
}
