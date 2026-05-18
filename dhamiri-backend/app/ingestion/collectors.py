import requests
import feedparser
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
