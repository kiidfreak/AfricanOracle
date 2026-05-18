import io
import requests
import pdfplumber
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from typing import Dict, Any, List
from app.ingestion.collectors import BaseCollector

class NSEEquityCollector(BaseCollector):
    """
    Scrapes the Nairobi Securities Exchange (NSE) Market Statistics page,
    finds the daily PDF report, downloads it, and extracts equity prices.
    """
    def __init__(self, source_id: str, endpoint: str = "https://www.nse.co.ke/dataservices/market-statistics/"):
        super().__init__(source_id, endpoint)

    def fetch(self) -> List[Dict[str, Any]]:
        try:
            # 1. Fetch the main statistics page
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            resp = requests.get(self.endpoint, headers=headers, timeout=15)
            resp.raise_for_status()
            
            # 2. Parse HTML to find the PDF link
            soup = BeautifulSoup(resp.text, 'html.parser')
            pdf_link = None
            
            for a in soup.find_all('a', href=True):
                text = a.get_text(strip=True).lower()
                if "equity price list" in text or "pricelist" in text:
                    pdf_link = a['href']
                    break
                    
            if not pdf_link:
                # Fallback: look for any .pdf link with 'equity'
                for a in soup.find_all('a', href=True):
                    if a['href'].endswith('.pdf') and 'equity' in a['href'].lower():
                        pdf_link = a['href']
                        break
                        
            if not pdf_link:
                # Let's just grab the first PDF as an absolute fallback
                for a in soup.find_all('a', href=True):
                    if a['href'].endswith('.pdf'):
                        pdf_link = a['href']
                        break
                        
            if not pdf_link:
                print(f"[NSECollector] Could not find any PDF links on {self.endpoint}")
                return []
                
            pdf_link = urljoin(self.endpoint, pdf_link)
            print(f"[NSECollector] Found PDF: {pdf_link}")
            
            # 3. Download the PDF into memory
            pdf_resp = requests.get(pdf_link, headers=headers, timeout=30)
            pdf_resp.raise_for_status()
            
            signals = []
            
            # 4. Parse the PDF
            with pdfplumber.open(io.BytesIO(pdf_resp.content)) as pdf:
                for page in pdf.pages:
                    # Extract tables using pdfplumber's robust engine
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            if not row or len(row) < 3:
                                continue
                                
                            try:
                                # We assume the first column is the ticker or company name
                                ticker = str(row[0]).strip().upper()
                                
                                # Heuristic: Most African equities have 3-5 letter tickers
                                if len(ticker) >= 3 and len(ticker) <= 6 and ticker.isalpha():
                                    
                                    # Prices are usually towards the right side of the table
                                    price = None
                                    for col in reversed(row):
                                        if col:
                                            # Clean up thousands separators
                                            clean_col = str(col).replace(',', '').strip()
                                            try:
                                                price = float(clean_col)
                                                break # Found the last numeric value (likely closing price)
                                            except ValueError:
                                                continue
                                                
                                    if price is not None:
                                        signals.append({
                                            "name": f"NSE Equity: {ticker}",
                                            "signal_class": "equity_price",
                                            "value": price,
                                            "unit": "KES",
                                            "ticker": ticker
                                        })
                            except Exception:
                                pass
                                
            return signals
            
        except Exception as e:
            print(f"[NSECollector] Error scraping NSE PDF: {e}")
            return []
