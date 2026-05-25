# 🥚 Arc OSS Starter Kit: x402 + Session Keys

> **React/Next.js + wagmi/viem starter kit demonstrating client-side x402 (HTTP 402 Payment Required) micropayments and ephemeral session keys on the Arc Network.**

This package is designed as a standalone, production-ready starting point for Arc builders. It exposes reusable primitives to solve the biggest UX hurdle in agentic commerce: **bypassing wallet signature popups for micro-transactions while maintaining complete security.**

---

## 🧠 Architecture from First Principles

In standard web3 architectures, every state change or transaction requires the user to interactively approve a popup in MetaMask or RainbowKit. In machine-to-machine commerce or high-frequency agent actions (e.g. prediction markets, automated escrows, or real-time dataset ingestion), this synchronous human approval is a blocker.

We solve this using two main cryptographic components: **x402 Micropayments** and **Client-Side Session Keys**.

```
                           EIP-712 Sign (Once)
  [User Primary Wallet] ─────────────────────────┐
                                                 │ Authorizes Ephemeral Key
                                                 ▼
[React App / Agent Client] ─── (Signs Payments) ───▶ [Ephemeral Session Key]
        │                                                     │
        │ 1. GET /api/paid-resource                           │ 3. Sign message/tx
        ├─────────────────────────────────────────────────────┤
        ▼                                                     ▼
 [Resource Server] ◀──────────────────────────────────────────┘
                      4. RETRY + PAYMENT-SIGNATURE
```

### 1. Ephemeral Session Keys (The Trust Delegation)
1. **Key Generation**: When a session is initiated, the client generates a temporary ECDSA private key in-memory or in the browser's `localStorage` (`viem/accounts/generatePrivateKey`).
2. **Delegation Message**: The user is prompted to sign an EIP-712 typed message using their primary wallet. This message authorizes the ephemeral key to act on their behalf under strict limits:
   * **Allowance**: The maximum spending allowance (e.g., up to `5.00 USDC` in 6 decimals).
   * **Expiry**: The timestamp after which the session key is invalidated (e.g., 2 hours).
   * **Target**: The specific contracts or endpoints the session key is authorized to interact with.
3. **Execution**: For all subsequent transactions, the client signs payloads silently using the ephemeral private key. No popups are required.

### 2. x402 HTTP Protocol (micropayment lifecycle)
The protocol coordinates payments over standardized HTTP headers:
1. **Initial Request**: The client requests a protected resource (e.g. `/api/v1/premium-predict-trace`).
2. **Payment Required**: The server responds with an **HTTP 402 Payment Required** status code. The response contains a Base64-encoded JSON object in the `payment-required` header detailing:
   * Token address (e.g. USDC contract on Arc Testnet).
   * Recipient address.
   * Exact amount required (e.g. 0.50 USDC = `500000` wei).
3. **Client-Side Interception**: Our fetch wrapper interceptor parses the 402, decodes the requirements, checks if a valid session key is present with remaining allowance, and:
   * Cryptographically signs the payment details using the session key.
   * Deducts the amount from the local remaining allowance.
   * Attaches the `PAYMENT-SIGNATURE` header containing the signature and the original primary wallet delegation proof.
4. **Validation & Unlock**: The server verifies the signatures on-chain or off-chain. If valid, the payment is cleared, and the requested resource is returned.

---

## 📦 What's Inside

1. **`src/types.ts`**: TypeScript interfaces defining EIP-712 session structures and x402 headers.
2. **`src/hooks/useArcSession.ts`**: React Hook to generate session keys, request EIP-712 signatures, track remaining allowances, and persist session states in browser storage.
3. **`src/utils/x402Client.ts`**: A drop-in wrapper around `fetch` that automatically intercepts `402 Payment Required` responses, validates local session states, signs payment payloads, and retries requests with authorization headers.
4. **`src/components/ArcOSSShowcase.tsx`**: A premium glassmorphism dashboard UI showing the session key status, a live streaming terminal, and simulated widgets for the 4 core Arc OSS primitives:
   * **Yield Routing**: Redirect prediction yields to a specified wallet.
   * **Escrow**: Lock and unlock USDC for market contract settlement.
   * **Prediction Markets**: Buy YES/NO shares silently using the session key.
   * **Identity/Reputation**: Verify published agent reasoning traces on-chain.

---

## 🚀 Quick Start

### Installation

Install the package alongside `viem` and `wagmi`:

```bash
npm install @arc-oss/starter-kit viem wagmi
```

### 1. Initialize Session Keys in React

```tsx
import { useAccount, useWalletClient } from 'wagmi';
import { useArcSession } from '@arc-oss/starter-kit';

function App() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { session, createSession, revokeSession, isSessionValid } = useArcSession();

  const handleStartSession = async () => {
    if (walletClient && address) {
      // Authorize a session key with a limit of 10.00 USDC for 2 hours
      await createSession(walletClient, address, 10.00, 7200);
    }
  };

  return (
    <div>
      {isSessionValid ? (
        <p>Session Active: {session.publicKey}</p>
      ) : (
        <button onClick={handleStartSession}>Authorize Session</button>
      )}
    </div>
  );
}
```

### 2. Wrap Fetch for Automatic x402 Micropayments

Simply swap standard `fetch` with `fetchWithX402` to automatically handle paid API routes:

```tsx
import { fetchWithX402 } from '@arc-oss/starter-kit';

async function fetchReport(sessionState) {
  try {
    const response = await fetchWithX402(
      '/api/v1/premium-report',
      { method: 'GET' },
      {
        session: sessionState,
        onSessionSpend: (amountSpent) => {
          // Callback to update UI / context state
          console.log(`Paid ${Number(amountSpent) / 1000000} USDC`);
        }
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'PaymentRequiredError') {
      // Prompt user to authorize more funds
      console.log('Insufficient session balance or session expired.');
    }
  }
}
```

---

## 🥚 Applying to Arc OSS

This starter kit implements the composable primitives described in the **Arc Open Source Showcase (Arc OSS)** initiative. By spinning this package out as a standalone repository, other Arc builders can easily integrate silent micro-transactions and x402 payments into their agent frontends.

**Link to Arc OSS Repo**: `https://github.com/imaina/arc-oss-starter-kit` *(Fork and deploy this package)*
