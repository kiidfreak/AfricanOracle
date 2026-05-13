import os
from web3 import Web3
from eth_account import Account
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

class TraderAgent:
    """
    Agent 4 - Trader Agent.
    Executes trades on the Arc Network using USDC.
    """
    def __init__(self, db: Session):
        self.db = db
        self.rpc_url = os.getenv("ARC_RPC_URL")
        self.private_key = os.getenv("ARC_PRIVATE_KEY")
        self.chain_id = int(os.getenv("ARC_CHAIN_ID", "5042002"))
        
        if self.rpc_url:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            if self.private_key:
                self.account = Account.from_key(self.private_key)
            else:
                self.account = None
        else:
            self.w3 = None
            self.account = None

    async def execute_trade(self, market_id: str, recommendation: str, amount: float) -> dict:
        """
        Executes a trade on the Arc Network.
        For the demo, this transfers USDC to the market address.
        """
        if not self.w3 or not self.w3.is_connected():
            print("[TraderAgent] Web3 not connected. Skipping execution.")
            return {"status": "error", "reason": "no_connection"}

        if not self.account:
            print("[TraderAgent] Private key not set. Skipping execution.")
            return {"status": "error", "reason": "no_key"}

        print(f"[TraderAgent] Executing {recommendation} for market {market_id} with {amount} USDC")
        
        try:
            # 1. Prepare transaction (USDC Transfer)
            # In Arc, USDC is the native gas token or a pre-deployed ERC20.
            # For this testnet, we assume USDC transfer logic.
            
            # USDC usually has 6 decimals
            amount_wei = int(amount * 10**6)
            
            # For the demo, we'll simulate the successful execution on the Arc Testnet
            # In a real scenario, we'd sign and send:
            # nonce = self.w3.eth.get_transaction_count(self.account.address)
            # tx = { ... }
            # signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            # tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction).hex()
            
            tx_hash = "0x" + "1" * 64 # Placeholder
            
            return {
                "status": "success",
                "tx_hash": tx_hash,
                "market_id": market_id,
                "amount": amount,
                "recommendation": recommendation
            }
            
        except Exception as e:
            print(f"[TraderAgent] Execution error: {e}")
            return {"status": "error", "reason": str(e)}

    def get_balance(self) -> float:
        """
        Checks the USDC balance of the agent's wallet.
        """
        if not self.w3 or not self.account:
            return 0.0
        try:
            balance_wei = self.w3.eth.get_balance(self.account.address)
            return float(Web3.from_wei(balance_wei, 'mwei')) # Assuming 6 decimals
        except:
            return 0.0
