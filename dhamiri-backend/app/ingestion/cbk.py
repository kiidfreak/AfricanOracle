import pandas as pd
from typing import Dict, Any, List
from datetime import datetime
from app.ingestion.collectors import BaseCollector

class CBKInflationCollector(BaseCollector):
    """
    Dedicated collector for the Central Bank of Kenya (CBK) Inflation Rates.
    Target endpoint: https://www.centralbank.go.ke/inflation-rates/
    """
    def __init__(self, source_id: str, endpoint: str = "https://www.centralbank.go.ke/inflation-rates/"):
        super().__init__(source_id, endpoint)

    def fetch(self) -> List[Dict[str, Any]]:
        try:
            # Match the exact table by a known header
            tables = pd.read_html(self.endpoint)
            if not tables:
                print(f"[CBKCollector] No inflation table found at {self.endpoint}")
                return []
            
            # Find the table that has '12-Month Inflation' or 'Year'
            df = None
            for table in tables:
                if "Year" in table.columns or "12-Month Inflation" in table.columns:
                    df = table
                    break
                    
            if df is None:
                print(f"[CBKCollector] No table with expected columns found.")
                return []
            
            # Clean up the dataframe
            # The CBK table sometimes has trailing spaces or weird characters
            df.columns = df.columns.str.strip()
            
            # Ensure the columns we need exist
            required_cols = ["Year", "Month", "12-Month Inflation"]
            for col in required_cols:
                if col not in df.columns:
                    print(f"[CBKCollector] Missing required column: {col}")
                    return []
            
            # We want the most recent entries first
            # Drop NaN rows just in case
            df = df.dropna(subset=required_cols)
            
            signals = []
            for _, row in df.head(10).iterrows(): # Just grab the top 10 most recent updates
                try:
                    year = int(row["Year"])
                    month_str = str(row["Month"]).strip()
                    inflation_value = float(row["12-Month Inflation"])
                    
                    # Construct a standard signal dictionary
                    signals.append({
                        "name": f"CBK 12-Month Inflation ({month_str} {year})",
                        "signal_class": "cpi_inflation",
                        "value": inflation_value,
                        "unit": "percent",
                        "year": year,
                        "month": month_str
                    })
                except ValueError as e:
                    print(f"[CBKCollector] Data parsing error for row {row}: {e}")
                    continue
                    
            return signals
            
        except Exception as e:
            print(f"[CBKCollector] Error fetching CBK inflation data: {e}")
            return []

class CBKTBillsCollector(BaseCollector):
    """
    Collector for CBK Treasury Bills Auction Results.
    Target endpoint: https://www.centralbank.go.ke/bills-bonds/treasury-bills/
    """
    def __init__(self, source_id: str, endpoint: str = "https://www.centralbank.go.ke/bills-bonds/treasury-bills/"):
        super().__init__(source_id, endpoint)

    def fetch(self) -> List[Dict[str, Any]]:
        try:
            tables = pd.read_html(self.endpoint)
            
            # Find the table that has 'Value Date' and 'On Offer'
            df = None
            for table in tables:
                if "Value Date" in table.columns and "On Offer" in table.columns:
                    df = table
                    break
                    
            if df is None:
                print(f"[CBKCollector] No T-Bills table found.")
                return []
                
            df.columns = df.columns.str.strip()
            df = df.dropna(subset=["Value Date", "On Offer"])
            
            signals = []
            for _, row in df.head(10).iterrows():
                val_date = str(row["Value Date"]).strip()
                on_offer = str(row["On Offer"]).strip()
                
                # We skip missing data or IFB (Infrastructure Bonds) if they got mixed in
                if on_offer == "--" or "IFB" in on_offer:
                    continue
                    
                # The format is often "IssueNo/Days", e.g. "2609/364"
                if "/" in on_offer:
                    parts = on_offer.split("/")
                    days = parts[-1]
                else:
                    days = on_offer
                    
                signals.append({
                    "name": f"CBK {days}-Day T-Bill Auction ({val_date})",
                    "signal_class": "interest_rate",
                    "value": int(days), # We would actually want the Yield rate here, but we extract what we can
                    "unit": "days",
                    "raw_offer": on_offer,
                    "date": val_date
                })
                
            return signals
            
        except Exception as e:
            print(f"[CBKCollector] Error fetching CBK T-Bills data: {e}")
            return []
