"""
ReelShort Scraper - Fetch drama data from ReelShort website
Uses RSC Payload parsing for Next.js App Router sites
"""

import httpx
import re
import json
import asyncio
from typing import List, Dict, Optional
from datetime import datetime


class ReelShortScraper:
    BASE_URL = "https://www.reelshort.com"
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
            timeout=30.0,
            follow_redirects=True,
        )
        self.scraped_count = 0
        self.errors: List[str] = []
    
    async def fetch_page(self, url: str) -> Optional[str]:
        """Fetch a single page"""
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                return response.text
            else:
                self.errors.append(f"HTTP {response.status_code} for {url}")
                return None
        except Exception as e:
            self.errors.append(f"Error fetching {url}: {str(e)}")
            return None
    
    def parse_rsc_payload(self, html: str) -> List[Dict]:
        """
        Parse Next.js RSC Payload from HTML
        The data is embedded in self.__next_f.push() calls
        """
        dramas = []
        
        # Pattern to match RSC payload chunks
        # Format: self.__next_f.push([1, "..."])
        pattern = r'self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)'
        matches = re.findall(pattern, html)
        
        for match in matches:
            try:
                # Decode escape sequences
                decoded = match.encode('utf-8').decode('unicode_escape')
                
                # Look for drama data patterns
                if any(key in decoded for key in ['"bookId"', '"title"', '"dramaId"']):
                    # Try to extract JSON objects
                    self._extract_dramas_from_text(decoded, dramas)
            except Exception as e:
                continue
        
        return dramas
    
    def _extract_dramas_from_text(self, text: str, dramas: List[Dict]):
        """Extract drama objects from text"""
        # Try to find JSON arrays or objects containing drama data
        # Look for patterns like [{"bookId": ..., "title": ...}, ...]
        
        # Simple pattern matching for drama objects
        drama_pattern = r'\{[^{}]*"bookId"[^{}]*\}'
        matches = re.findall(drama_pattern, text)
        
        for match in matches:
            try:
                data = json.loads(match)
                if self._is_valid_drama(data):
                    dramas.append(self._normalize_drama(data))
            except json.JSONDecodeError:
                # Try to fix common JSON issues
                try:
                    # Remove trailing commas
                    fixed = re.sub(r',\s*}', '}', match)
                    fixed = re.sub(r',\s*]', ']', fixed)
                    data = json.loads(fixed)
                    if self._is_valid_drama(data):
                        dramas.append(self._normalize_drama(data))
                except:
                    continue
    
    def _is_valid_drama(self, data: Dict) -> bool:
        """Check if data contains valid drama information"""
        required_fields = ['bookId', 'title']
        return all(field in data and data[field] for field in required_fields)
    
    def _normalize_drama(self, data: Dict) -> Dict:
        """Normalize drama data to standard format"""
        book_id = str(data.get('bookId', ''))
        
        return {
            'sourceId': book_id,
            'source': 'reelshort',
            'title': data.get('title', '').strip(),
            'synopsis': data.get('synopsis', data.get('description', '')).strip(),
            'coverUrl': data.get('coverImage', data.get('cover', data.get('poster', ''))),
            'score': self._parse_float(data.get('score', data.get('rating'))),
            'readCount': self._parse_int(data.get('readCount', data.get('views', data.get('playCount')))),
            'collectCount': self._parse_int(data.get('collectCount', data.get('likes', data.get('favorites')))),
            'chapterCount': self._parse_int(data.get('chapterCount', data.get('episodes', data.get('episodeCount')))),
            'tags': self._parse_tags(data.get('tags', data.get('genres', []))),
            'sourceUrl': f"{self.BASE_URL}/drama/{book_id}" if book_id else None,
        }
    
    def _parse_float(self, value) -> Optional[float]:
        """Parse float value safely"""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def _parse_int(self, value) -> Optional[int]:
        """Parse int value safely"""
        if value is None:
            return None
        try:
            return int(float(str(value).replace(',', '')))
        except (ValueError, TypeError):
            return None
    
    def _parse_tags(self, tags) -> List[str]:
        """Parse tags to list of strings"""
        if isinstance(tags, list):
            return [str(t).strip() for t in tags if t]
        elif isinstance(tags, str):
            return [t.strip() for t in tags.split(',') if t.strip()]
        return []
    
    async def scrape_drama_list(self, page: int = 1) -> List[Dict]:
        """Scrape drama list from browse page"""
        url = f"{self.BASE_URL}/browse?page={page}"
        html = await self.fetch_page(url)
        
        if not html:
            return []
        
        dramas = self.parse_rsc_payload(html)
        self.scraped_count += len(dramas)
        return dramas
    
    async def scrape_drama_detail(self, drama_id: str) -> Optional[Dict]:
        """Scrape individual drama detail page"""
        url = f"{self.BASE_URL}/drama/{drama_id}"
        html = await self.fetch_page(url)
        
        if not html:
            return None
        
        dramas = self.parse_rsc_payload(html)
        return dramas[0] if dramas else None
    
    async def scrape_all(self, max_pages: int = 100) -> List[Dict]:
        """Scrape all dramas from browse pages"""
        all_dramas = []
        seen_ids = set()
        
        for page in range(1, max_pages + 1):
            print(f"📄 Scraping page {page}...")
            dramas = await self.scrape_drama_list(page)
            
            if not dramas:
                print(f"  No dramas found on page {page}, stopping.")
                break
            
            # Deduplicate
            new_dramas = []
            for drama in dramas:
                if drama['sourceId'] not in seen_ids:
                    seen_ids.add(drama['sourceId'])
                    new_dramas.append(drama)
            
            all_dramas.extend(new_dramas)
            print(f"  Found {len(new_dramas)} new dramas (total: {len(all_dramas)})")
            
            # Rate limiting
            await asyncio.sleep(1)
        
        return all_dramas
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    def get_stats(self) -> Dict:
        """Get scraping statistics"""
        return {
            'scraped_count': self.scraped_count,
            'error_count': len(self.errors),
            'errors': self.errors[:10],  # First 10 errors
        }


async def main():
    """Test the scraper"""
    scraper = ReelShortScraper()
    
    print("🎬 Testing ReelShort Scraper...")
    print("=" * 50)
    
    # Test single page
    dramas = await scraper.scrape_drama_list(page=1)
    print(f"\n📊 Found {len(dramas)} dramas on page 1")
    
    if dramas:
        print("\n📋 Sample drama:")
        sample = dramas[0]
        for key, value in sample.items():
            print(f"  {key}: {value}")
    
    # Get stats
    stats = scraper.get_stats()
    print(f"\n📈 Stats: {stats}")
    
    await scraper.close()


if __name__ == "__main__":
    asyncio.run(main())
