import os
import time
from typing import Optional, Dict, Any
from circle.web3 import utils, developer_controlled_wallets
from web3 import Web3
from dotenv import load_dotenv
from app.core.config import settings

class IdentityManager:
    """
    Manages Arc Network AI Agent Identity (ERC-8004).
    """
    IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e"
    REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713"
    RPC_URL = "https://rpc.testnet.arc.network/"

    def __init__(self):
        self.api_key = os.getenv("CIRCLE_API_KEY")
        self.entity_secret = os.getenv("CIRCLE_ENTITY_SECRET")
        
        if not self.api_key or not self.entity_secret:
            print("Warning: CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET not set.")
            self.circle_client = None
        else:
            self.circle_client = utils.init_developer_controlled_wallets_client(
                api_key=self.api_key,
                entity_secret=self.entity_secret,
            )
            self.wallets_api = developer_controlled_wallets.WalletsApi(self.circle_client)
            self.wallet_sets_api = developer_controlled_wallets.WalletSetsApi(self.circle_client)
            self.transactions_api = developer_controlled_wallets.TransactionsApi(self.circle_client)

        self.w3 = Web3(Web3.HTTPProvider(self.RPC_URL))

    def create_agent_wallets(self) -> Dict[str, Any]:
        """
        Creates the Owner and Validator wallets for the ERC-8004 flow.
        """
        if not self.circle_client:
            raise Exception("Circle client not initialized.")

        wallet_set = self.wallet_sets_api.create_wallet_set(
            developer_controlled_wallets.CreateWalletSetRequest.from_dict({
                "name": "Dhamiri Agent Wallets",
            })
        )
        wallet_set_id = wallet_set.data.wallet_set.actual_instance.id

        wallets_response = self.wallets_api.create_wallet(
            developer_controlled_wallets.CreateWalletRequest.from_dict({
                "blockchains": ["ARC-TESTNET"],
                "count": 2,
                "walletSetId": wallet_set_id,
                "accountType": "SCA",
            })
        )

        owner_wallet = wallets_response.data.wallets[0].actual_instance
        validator_wallet = wallets_response.data.wallets[1].actual_instance

        return {
            "owner_address": owner_wallet.address,
            "owner_id": owner_wallet.id,
            "validator_address": validator_wallet.address,
            "validator_id": validator_wallet.id,
            "wallet_set_id": wallet_set_id
        }

    def register_agent(self, owner_address: str, metadata_uri: str) -> str:
        """
        Registers the agent identity on Arc Testnet.
        """
        if not self.circle_client:
            raise Exception("Circle client not initialized.")

        request = developer_controlled_wallets \
            .CreateContractExecutionTransactionForDeveloperRequest.from_dict({
                "walletAddress": owner_address,
                "blockchain": "ARC-TESTNET",
                "contractAddress": self.IDENTITY_REGISTRY,
                "abiFunctionSignature": "register(string)",
                "abiParameters": [metadata_uri],
                "feeLevel": "MEDIUM",
            })

        response = self.transactions_api.create_developer_transaction_contract_execution(request)
        
        # Poll for completion
        tx_hash = self._wait_for_tx(response.data.id)
        return tx_hash

    def _wait_for_tx(self, tx_id: str, max_retries: int = 30) -> str:
        for _ in range(max_retries):
            time.sleep(2)
            tx = self.transactions_api.get_transaction(id=tx_id)
            if tx.data.transaction.state == "COMPLETE":
                return tx.data.transaction.tx_hash
            if tx.data.transaction.state == "FAILED":
                raise Exception(f"Transaction {tx_id} failed on-chain.")
        raise Exception(f"Transaction {tx_id} timed out.")

    def get_agent_id(self, owner_address: str) -> Optional[int]:
        """
        Retrieves the Agent ID (Token ID) from the blockchain.
        """
        identity_abi = [
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "from", "type": "address"},
                    {"indexed": True, "name": "to", "type": "address"},
                    {"indexed": True, "name": "tokenId", "type": "uint256"},
                ],
                "name": "Transfer",
                "type": "event",
            }
        ]
        contract = self.w3.eth.contract(address=self.IDENTITY_REGISTRY, abi=identity_abi)
        
        latest_block = self.w3.eth.block_number
        from_block = max(0, latest_block - 10000)
        
        events = contract.events.Transfer.create_filter(
            from_block=from_block,
            to_block=latest_block,
            argument_filters={"to": owner_address},
        ).get_all_entries()

        if events:
            return events[-1]["args"]["tokenId"]
        return None

    def record_reputation(self, validator_address: str, agent_id: int, score: int, tag: str):
        """
        Records a reputation event for the agent.
        """
        feedback_hash = "0x" + self.w3.keccak(text=tag).hex()

        request = developer_controlled_wallets \
            .CreateContractExecutionTransactionForDeveloperRequest.from_dict({
                "walletAddress": validator_address,
                "blockchain": "ARC-TESTNET",
                "contractAddress": self.REPUTATION_REGISTRY,
                "abiFunctionSignature":
                    "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)",
                "abiParameters": [
                    str(agent_id), str(score), "0", tag, "", "", "", feedback_hash
                ],
                "feeLevel": "MEDIUM",
            })

        response = self.transactions_api.create_developer_transaction_contract_execution(request)
        return self._wait_for_tx(response.data.id)
