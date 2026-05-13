import pytest
from unittest.mock import MagicMock
from app.core.collateral import CollateralManager

@pytest.fixture
def mock_w3():
    return MagicMock()

@pytest.fixture
def collateral_manager(mock_w3):
    return CollateralManager(mock_w3)

def test_pusd_balance_check(collateral_manager):
    """Test that we can retrieve pUSD balance."""
    balance = collateral_manager.get_pusd_balance("0x123")
    assert balance >= 0
    assert isinstance(balance, float)

def test_wrap_routing_logic(collateral_manager):
    """Test the routing flow from Native USDC to pUSD."""
    # We mock the transaction success
    success = collateral_manager.wrap_native_usdc("0x123", 50.0)
    assert success is True

def test_unwrap_routing_logic(collateral_manager):
    """Test the redemption flow from pUSD back to Native."""
    success = collateral_manager.unwrap_to_native("0x123", 50.0)
    assert success is True
