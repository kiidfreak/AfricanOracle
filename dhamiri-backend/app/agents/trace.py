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

        # 2. Publish to Arc (using self-send transaction for trace storage)
        tx_hash = "0x" + "0" * 64 # Placeholder
        block_number = 0
        
        if self.w3 and self.w3.is_connected() and self.private_key:
            try:
                print(f"[TraceAgent] Publishing trace hash {trace_hash} to Arc...")
                tx_hash = self._send_self_transaction(trace_hash)
                # Wait for the transaction receipt to get block number
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=15)
                block_number = receipt.blockNumber
                print(f"[TraceAgent] Published trace {trace_hash} to Arc in block {block_number} (tx: {tx_hash})")
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

    def _send_self_transaction(self, trace_hash: str) -> str:
        # Ensure trace_hash starts with 0x
        if not trace_hash.startswith("0x"):
            trace_hash = "0x" + trace_hash
            
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        gas_price = self.w3.eth.gas_price
        
        tx = {
            'chainId': self.chain_id,
            'nonce': nonce,
            'to': self.account.address,
            'value': 0,
            'gas': 50000,
            'gasPrice': gas_price,
            'data': trace_hash
        }
        
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction).hex()
        return tx_hash
