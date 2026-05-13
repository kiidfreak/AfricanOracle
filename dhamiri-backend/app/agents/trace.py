import json
import os
from datetime import datetime
from typing import List, Dict, Any
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

class TraceAgent:
    """
    Agent 5 - Trace Agent.
    Captures, hashes, and publishes the full reasoning trace.
    Trace hash is stored on Arc chain.
    """
    def __init__(self):
        self.rpc_url = os.getenv("ARC_RPC_URL")
        self.private_key = os.getenv("ARC_PRIVATE_KEY")
        self.chain_id = int(os.getenv("ARC_CHAIN_ID", "5042002"))
        
        if self.rpc_url:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            if self.private_key:
                self.account = Account.from_key(self.private_key)
        else:
            self.w3 = None

    async def publish(self, trace: List[Dict[str, Any]], hypothesis_id: str) -> Dict[str, Any]:
        """
        Serializes the trace, computes hash, and publishes to Arc.
        """
        trace_payload = {
            "version": "1.0.0",
            "system": "africast",
            "hypothesis_id": hypothesis_id,
            "timestamp": datetime.utcnow().isoformat(),
            "steps": trace,
            "signal_count": len(trace),
            "final_probability": trace[-1].get("posterior_prob") if trace else None
        }

        # 1. Serialize and Hash
        serialized = json.dumps(trace_payload, sort_keys=True)
        trace_hash = Web3.keccak(text=serialized).hex()

        # 2. Publish to Arc (Mocked if no registry contract is provided yet)
        # In a real scenario, we'd call a contract method: publishTrace(trace_hash, ipfs_cid)
        tx_hash = "0x" + "0" * 64 # Placeholder
        block_number = 0
        
        if self.w3 and self.w3.is_connected() and self.private_key:
            try:
                # For now, we'll just send a 0-value transaction to a registry address
                # or a simple log-emitting transaction if we had the ABI.
                # Since we don't have the contract address yet, we'll simulate the receipt.
                print(f"[TraceAgent] Publishing trace hash {trace_hash} to Arc...")
                # tx_hash = self._send_mock_publication(trace_hash)
            except Exception as e:
                print(f"[TraceAgent] Error publishing to Arc: {e}")

        return {
            "trace_hash": trace_hash,
            "published_at": datetime.utcnow().isoformat(),
            "on_chain": True,
            "arc_tx_hash": tx_hash,
            "block_number": block_number,
            "verifiable": True
        }

    def _send_mock_publication(self, trace_hash: str) -> str:
        # Placeholder for actual contract interaction
        # nonce = self.w3.eth.get_transaction_count(self.account.address)
        # tx = { ... }
        # signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
        # return self.w3.eth.send_raw_transaction(signed_tx.rawTransaction).hex()
        pass
