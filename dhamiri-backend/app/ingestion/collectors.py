import requests
import feedparser
import pandas as pd
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod

class BaseCollector(ABC):
    def __init__(self, source_id: str, endpoint: str):
        self.source_id = source_id
        self.endpoint = endpoint

    @abstractmethod
    def fetch(self) -> Any:
        pass

class JSONCollector(BaseCollector):
    def fetch(self) -> Optional[Dict[str, Any]]:
        try:
            response = requests.get(self.endpoint, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching from {self.endpoint}: {e}")
            return None

class RSSCollector(BaseCollector):
    def fetch(self) -> List[Dict[str, Any]]:
        try:
            feed = feedparser.parse(self.endpoint)
            entries = []
            for entry in feed.entries:
                entries.append({
                    "title": entry.get("title", ""),
                    "link": entry.get("link", ""),
                    "published": entry.get("published", ""),
                    "summary": entry.get("summary", ""),
                })
            return entries
        except Exception as e:
            print(f"Error fetching RSS from {self.endpoint}: {e}")
            return []

class HTMLTableCollector(BaseCollector):
    def __init__(self, source_id: str, endpoint: str, match: str = ""):
        super().__init__(source_id, endpoint)
        self.match = match  # String to match the correct table

    def fetch(self) -> List[Dict[str, Any]]:
        try:
            # We use pandas to extract tables that contain the match string
            tables = pd.read_html(self.endpoint, match=self.match)
            if not tables:
                return []
            
            # Assuming the first matching table is the one we want
            df = tables[0]
            # Convert to list of dicts
            return df.to_dict(orient="records")
        except Exception as e:
            print(f"Error fetching HTML table from {self.endpoint}: {e}")
            return []
