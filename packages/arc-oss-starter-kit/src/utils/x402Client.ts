import { privateKeyToAccount } from 'viem/accounts';
import { Address, Hex, toHex, stringify } from 'viem';
import { 
  SessionState, 
  PaymentRequiredHeader, 
  PaymentSignaturePayload 
} from '../types';

export class PaymentRequiredError extends Error {
  public requirements: PaymentRequiredHeader;
  public response: Response;

  constructor(message: string, requirements: PaymentRequiredHeader, response: Response) {
    super(message);
    this.name = 'PaymentRequiredError';
    this.requirements = requirements;
    this.response = response;
  }
}

/**
 * Standard EIP-712 helper to sign the x402 payment details using the session key.
 */
async function signX402PaymentMessage(
  sessionPrivateKey: Hex,
  recipient: Address,
  amount: bigint,
  asset: Address,
  network: string
): Promise<Hex> {
  const sessionAccount = privateKeyToAccount(sessionPrivateKey);
  
  // Format domain (EIP-712)
  const domain = {
    name: 'x402PaymentProtocol',
    version: '1',
    chainId: 5042002, // Arc Testnet
  } as const;

  // Format types
  const types = {
    PaymentToken: [
      { name: 'payTo', type: 'address' },
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'network', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
    ],
  } as const;

  // Format message
  const message = {
    payTo: recipient,
    asset,
    amount,
    network,
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
  };

  // Sign message using session key
  return await sessionAccount.signTypedData({
    domain,
    types,
    primaryType: 'PaymentToken',
    message,
  });
}

/**
 * Custom fetch wrapper that automates the x402 + session key payment flow.
 * 
 * If a 402 is encountered and a valid session is provided with enough allowance,
 * it will pay silently and retry. Otherwise, it will throw a PaymentRequiredError.
 */
export async function fetchWithX402(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: {
    session: SessionState | null;
    onSessionSpend?: (amount: bigint) => void;
    onPaymentLogged?: (log: string) => void;
  }
): Promise<Response> {
  const log = options?.onPaymentLogged || console.log;
  
  // 1. Execute initial request
  log(`[x402Client] Fetching: ${input.toString()}`);
  let response = await fetch(input, init);

  // 2. Intercept HTTP 402 Payment Required
  if (response.status === 402) {
    log(`[x402Client] Received HTTP 402: Payment Required`);
    const paymentHeader = response.headers.get('payment-required');

    if (!paymentHeader) {
      throw new Error('[x402Client] Received 402 but no payment-required header was found.');
    }

    // 3. Decode requirements
    let requirements: PaymentRequiredHeader;
    try {
      // Decode Base64 header
      const decodedJSON = atob(paymentHeader);
      requirements = JSON.parse(decodedJSON);
      log(`[x402Client] Decoded payment details: ${JSON.stringify(requirements)}`);
    } catch (err) {
      throw new Error('[x402Client] Failed to parse payment-required header: ' + (err as Error).message);
    }

    // 4. Extract EVM scheme matching Arc or fallback
    const requirement = requirements.accepts.find(
      (r) => r.network === 'eip155:5042002' || r.network.startsWith('eip155:')
    );

    if (!requirement) {
      throw new PaymentRequiredError(
        'No supported EVM payment networks found in requirements',
        requirements,
        response
      );
    }

    const requiredAmount = BigInt(requirement.amount);

    // 5. Check if session key is valid and has sufficient allowance
    const session = options?.session;
    const now = Math.floor(Date.now() / 1000);
    const sessionIsValid =
      session &&
      session.isAuthorized &&
      now < session.delegationMessage.expiry &&
      session.remainingAllowance >= requiredAmount;

    if (!sessionIsValid) {
      log(`[x402Client] No valid session key or insufficient allowance. Throwing payment prompt.`);
      throw new PaymentRequiredError(
        'Payment is required and no active session key is authorized to cover it.',
        requirements,
        response
      );
    }

    // 6. Sign payment proof using session key
    log(`[x402Client] Session key found. Signing payment signature silently...`);
    try {
      const sessionSignature = await signX402PaymentMessage(
        session.privateKey,
        requirement.payTo,
        requiredAmount,
        requirement.asset,
        requirement.network
      );

      // 7. Deduct from local session allowance
      if (options?.onSessionSpend) {
        options.onSessionSpend(requiredAmount);
      }

      // 8. Construct PAYMENT-SIGNATURE payload
      const signaturePayload: PaymentSignaturePayload = {
        sessionSignature,
        sessionPublicKey: session.publicKey,
        delegation: session.delegationMessage,
        delegationSignature: session.delegationSignature,
      };

      const encodedPayload = btoa(JSON.stringify(signaturePayload));

      // 9. Prepare retry headers
      const retryHeaders = new Headers(init?.headers || {});
      retryHeaders.set('payment-signature', encodedPayload);

      log(`[x402Client] Retrying fetch request with PAYMENT-SIGNATURE header...`);

      // 10. Retry the request
      response = await fetch(input, {
        ...init,
        headers: retryHeaders,
      });

      if (response.status === 200) {
        log(`[x402Client] Retry successful! Resource unlocked.`);
      } else {
        log(`[x402Client] Retry returned status ${response.status}`);
      }

    } catch (err: any) {
      log(`[x402Client] Payment signing or retry failed: ${err.message}`);
      throw err;
    }
  }

  return response;
}
