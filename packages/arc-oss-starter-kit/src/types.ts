import { Address, Hex } from 'viem';

/**
 * The EIP-712 session key delegation message format.
 * This is signed by the user's primary wallet.
 */
export interface SessionDelegationMessage {
  primaryOwner: Address;       // User's main wallet address
  sessionPublicKey: Address;   // Ephemeral key's public address
  allowance: string;           // Max spendable amount (e.g. in USDC, 6 decimals)
  expiry: number;              // Expiration timestamp (seconds)
  allowedTarget: string;       // Target contract address, API path, or '*'
  nonce: string;               // Unique session nonce
}

/**
 * State object representing an active session.
 */
export interface SessionState {
  privateKey: Hex;                     // Session private key (stored securely client-side)
  publicKey: Address;                 // Session public key
  delegationMessage: SessionDelegationMessage;
  delegationSignature: Hex;           // Signature from the primary wallet approving this session key
  remainingAllowance: bigint;         // Allowance remaining in decimals (e.g. 6 decimals for USDC)
  isAuthorized: boolean;
}

/**
 * Decoded payment instructions returned by the server on an HTTP 402 response.
 */
export interface PaymentRequiredHeader {
  x402Version: number;
  accepts: Array<{
    scheme: 'exact' | 'allowance';
    network: string;                  // e.g. "eip155:5042002" (Arc Chain ID)
    asset: Address;                   // USDC / payment token contract address
    payTo: Address;                   // Recipient address
    amount: string;                   // Amount required (in decimals)
  }>;
  error?: string;
}

/**
 * Structure of the proof attached to the PAYMENT-SIGNATURE header.
 */
export interface PaymentSignaturePayload {
  transactionHash?: Hex;              // If paid directly on-chain
  sessionSignature?: Hex;             // If paid via session key message signature
  sessionPublicKey?: Address;
  delegation?: SessionDelegationMessage;
  delegationSignature?: Hex;
}
