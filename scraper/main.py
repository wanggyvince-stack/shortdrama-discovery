"""
Main scraper entry point
Run: python scraper/main.py
"""

import asyncio
import json
import os
from datetime import datetime

from reelshort import ReelShortScraper
from database import import_dramas, get_stats


DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')


async def run_scrape():
    """Run the full scrape process"""
    print("=" * 60)
    print("🎬 ShortDrama Discovery - Data Scraper")
    print("=" * 60)
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Initialize scraper
    scraper = ReelShortScraper()
    
    try:
        # Scrape all dramas
        print("📡 Starting ReelShort scrape...")
        dramas = await scraper.scrape_all(max_pages=100)
        
        if not dramas:
            print("❌ No dramas found. Check if the website structure changed.")
            return
        
        print(f"\n✅ Scraped {len(dramas)} dramas total")
        
        # Save raw data
        raw_file = os.path.join(DATA_DIR, f"reelshort_raw_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(raw_file, 'w', encoding='utf-8') as f:
            json.dump(dramas, f, ensure_ascii=False, indent=2)
        print(f"💾 Raw data saved to: {raw_file}")
        
        # Import to database
        print("\n📥 Importing to database...")
        imported = import_dramas(dramas)
        print(f"✅ Imported {imported} new dramas")
        
        # Get final stats
        stats = get_stats()
        print(f"\n📊 Database stats:")
        print(f"   Dramas: {stats['dramas']}")
        print(f"   Tags: {stats['tags']}")
        print(f"   Platforms: {stats['platforms']}")
        
        # Scraper stats
        scraper_stats = scraper.get_stats()
        if scraper_stats['errors']:
            print(f"\n⚠️  Errors ({len(scraper_stats['errors'])}):")
            for error in scraper_stats['errors'][:5]:
                print(f"   - {error}")
        
    finally:
        await scraper.close()
    
    print()
    print("=" * 60)
    print(f"📅 Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_scrape())
