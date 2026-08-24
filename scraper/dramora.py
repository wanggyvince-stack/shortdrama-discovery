"""
Dramora Scraper - Fetch drama data from bestshortdrama.com
Dramora indexes 673+ short dramas across 5 platforms
"""

import httpx
import re
import json
import asyncio
from typing import List, Dict, Optional
from datetime import datetime


class DramoraScraper:
    BASE_URL = "https://bestshortdrama.com"
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
    
    def parse_drama_list(self, html: str) -> List[Dict]:
        """Parse drama list from HTML"""
        dramas = []
        
        # Find all /drama/ links (relative paths)
        # Format: href="/drama/shattered-vows-6102157c"
        link_pattern = r'href="(/drama/([^/"]+))"'
        matches = re.findall(link_pattern, html)
        
        seen_slugs = set()
        for full_path, slug in matches:
            if slug in seen_slugs:
                continue
            seen_slugs.add(slug)
            
            dramas.append({
                'title': '',  # Will be filled from detail page
                'slug': slug,
                'sourceUrl': f"{self.BASE_URL}{full_path}",
            })
        
        return dramas
    
    def parse_drama_detail(self, html: str, slug: str) -> Dict:
        """Parse drama detail page"""
        drama = {
            'slug': slug,
            'sourceId': slug,
            'source': 'dramora',
        }
        
        # Extract title
        title_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
        if title_match:
            drama['title'] = title_match.group(1).strip()
        
        # Extract synopsis
        synopsis_patterns = [
            r'<p[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]+)</p>',
            r'"description"\s*:\s*"([^"]+)"',
            r'<meta[^>]*name="description"[^>]*content="([^"]+)"',
        ]
        for pattern in synopsis_patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                drama['synopsis'] = match.group(1).strip()
                break
        
        # Extract cover image
        cover_patterns = [
            r'<img[^>]*src="([^"]+)"[^>]*alt="[^"]*poster[^"]*"',
            r'"image"\s*:\s*"([^"]+)"',
            r'<meta[^>]*property="og:image"[^>]*content="([^"]+)"',
        ]
        for pattern in cover_patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                drama['coverUrl'] = match.group(1)
                break
        
        # Extract episode count
        # Pattern: "EPISODE LIST · <!-- -->52<!-- -->" or "REELSHORT<!-- --> · EP <!-- -->68"
        # Also: "52 EPISODES" or "(\d+)\s*EP"
        ep_patterns = [
            r'EPISODE\s+LIST\s*·\s*(?:<!--\s*-->)?\s*(\d+)',  # EPISODE LIST · 52
            r'(?:<!--\s*-->)?\s*EP\s*(?:<!--\s*-->)?\s*(\d+)',  # EP 68 or EP<!-- -->68
            r'(\d+)\s*(?:<!--\s*-->)?\s*EP',  # 52 EP
        ]
        for pattern in ep_patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                drama['chapterCount'] = int(match.group(1))
                break
        
        # Extract view count
        views_match = re.search(r'([\d.]+)([MK]?)\s*(?:VIEWS|views)', html)
        if views_match:
            num = float(views_match.group(1))
            unit = views_match.group(2)
            if unit == 'M':
                drama['readCount'] = int(num * 1000000)
            elif unit == 'K':
                drama['readCount'] = int(num * 1000)
            else:
                drama['readCount'] = int(num)
        
        # Extract platform
        platform_patterns = [
            r'<img[^>]*alt="([^"]+)"[^>]*src="[^"]*brand/([^/]+)\.png"',
            r'(ReelShort|DramaBox|GoodShort|ShortMax|FlexTV|NetShort)',
        ]
        for pattern in platform_patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                drama['platform'] = match.group(1) if match.lastindex else match.group(0)
                break
        
        # Extract genres/tags from /genres/ URLs
        genres = []
        genre_matches = re.findall(r'/genres/([a-z0-9-]+)', html)
        for genre in genre_matches:
            # Clean up: "ceo-billionaire" -> "CEO / Billionaire"
            clean = genre.replace('-', ' ').title()
            # Normalize common patterns
            clean = clean.replace('/', ' / ')
            if clean and len(clean) > 2:
                genres.append(clean)
        drama['tags'] = list(set(genres))
        
        return drama
    
    async def scrape_drama_detail(self, slug: str) -> Optional[Dict]:
        """Scrape individual drama detail page"""
        url = f"{self.BASE_URL}/drama/{slug}"
        html = await self.fetch_page(url)
        
        if not html:
            return None
        
        drama = self.parse_drama_detail(html, slug)
        drama['sourceUrl'] = url
        return drama
    
    async def scrape_all(self, max_dramas: int = 700) -> List[Dict]:
        """Scrape all dramas"""
        all_dramas = []
        
        # First, get drama list from main page and search
        print("📄 Fetching drama list...")
        
        # Fetch main page
        html = await self.fetch_page(self.BASE_URL)
        if html:
            dramas = self.parse_drama_list(html)
            all_dramas.extend(dramas)
            print(f"  Found {len(dramas)} dramas from main page")
        
        # Fetch charts page
        html = await self.fetch_page(f"{self.BASE_URL}/charts")
        if html:
            dramas = self.parse_drama_list(html)
            all_dramas.extend(dramas)
            print(f"  Found {len(dramas)} dramas from charts")
        
        # Fetch search page (all dramas)
        html = await self.fetch_page(f"{self.BASE_URL}/search")
        if html:
            dramas = self.parse_drama_list(html)
            all_dramas.extend(dramas)
            print(f"  Found {len(dramas)} dramas from search")
        
        # Fetch each platform page
        platforms = ['ReelShort', 'GoodShort', 'ShortMax', 'FlexTV', 'NetShort']
        for platform in platforms:
            html = await self.fetch_page(f"{self.BASE_URL}/search?platform={platform}")
            if html:
                dramas = self.parse_drama_list(html)
                all_dramas.extend(dramas)
                print(f"  Found {len(dramas)} dramas from {platform}")
            await asyncio.sleep(0.5)
        
        # Deduplicate by slug
        seen_slugs = set()
        unique_dramas = []
        for drama in all_dramas:
            if drama['slug'] not in seen_slugs:
                seen_slugs.add(drama['slug'])
                unique_dramas.append(drama)
        
        print(f"\n📊 Total unique dramas: {len(unique_dramas)}")
        
        # Fetch detail for each drama
        print("\n🔍 Fetching drama details...")
        detailed_dramas = []
        
        for i, drama in enumerate(unique_dramas[:max_dramas]):
            if (i + 1) % 10 == 0:
                print(f"  Progress: {i + 1}/{len(unique_dramas[:max_dramas])}")
            
            detail = await self.scrape_drama_detail(drama['slug'])
            if detail:
                detailed_dramas.append(detail)
            
            await asyncio.sleep(0.3)  # Rate limiting
        
        self.scraped_count = len(detailed_dramas)
        return detailed_dramas
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    def get_stats(self) -> Dict:
        """Get scraping statistics"""
        return {
            'scraped_count': self.scraped_count,
            'error_count': len(self.errors),
            'errors': self.errors[:10],
        }


async def main():
    """Test the scraper"""
    scraper = DramoraScraper()
    
    print("🎬 Testing Dramora Scraper...")
    print("=" * 50)
    
    # Test single detail page
    detail = await scraper.scrape_drama_detail("shattered-vows-6102157c")
    if detail:
        print("\n📋 Sample drama detail:")
        for key, value in detail.items():
            if key != 'tags':
                print(f"  {key}: {value}")
        if 'tags' in detail:
            print(f"  tags: {detail['tags']}")
    
    await scraper.close()


if __name__ == "__main__":
    asyncio.run(main())
