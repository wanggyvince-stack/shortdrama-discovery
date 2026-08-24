"""
Dramora Full Scraper v2
Scrapes ALL dramas from Dramora sitemap using JSON-LD structured data.
Target: 715+ dramas with full metadata.
"""

import requests
import re
import json
import time
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

SITEMAP_URL = 'https://bestshortdrama.com/sitemap.xml'
OUTPUT_FILE = 'data/dramora_full.json'


def get_all_drama_urls():
    r = requests.get(SITEMAP_URL, headers=HEADERS, timeout=20)
    r.raise_for_status()
    urls = re.findall(r'<loc>(https://bestshortdrama\.com/drama/[^<]+)</loc>', r.text)
    return list(set(urls))


def scrape_drama_page(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        scripts = soup.find_all('script', type='application/ld+json')
        drama_data = None

        for s in scripts:
            if not s.string:
                continue
            try:
                data = json.loads(s.string)
                if isinstance(data, list):
                    for item in data:
                        if item.get('@type') == 'CreativeWorkSeries':
                            drama_data = item
                            break
                elif isinstance(data, dict):
                    if data.get('@type') == 'CreativeWorkSeries':
                        drama_data = data
            except json.JSONDecodeError:
                continue

        if not drama_data:
            return {'url': url, 'error': 'No JSON-LD found'}

        provider = drama_data.get('provider', {})
        provider_name = provider.get('name', 'Unknown') if isinstance(provider, dict) else 'Unknown'
        action = drama_data.get('potentialAction', {})
        source_url = action.get('target', '') if isinstance(action, dict) else ''
        slug = url.rstrip('/').split('/')[-1]

        return {
            'slug': slug,
            'sourceId': slug,
            'source': 'dramora',
            'title': drama_data.get('name', ''),
            'synopsis': drama_data.get('description', ''),
            'coverUrl': drama_data.get('image', ''),
            'chapterCount': drama_data.get('numberOfEpisodes', 0),
            'language': drama_data.get('inLanguage', ''),
            'platform': provider_name,
            'tags': drama_data.get('genre', []),
            'sourceUrl': url,
            'watchUrl': source_url,
            'isAccessibleForFree': drama_data.get('isAccessibleForFree', None),
            'dateModified': drama_data.get('dateModified', ''),
        }
    except Exception as e:
        return {'url': url, 'error': str(e)}


def main():
    print("Step 1: Getting all drama URLs from sitemap...")
    urls = get_all_drama_urls()
    print(f"  Found {len(urls)} drama URLs")

    print(f"\nStep 2: Scraping all {len(urls)} drama pages...")
    results = []
    errors = []
    total = len(urls)

    for i, url in enumerate(urls):
        result = scrape_drama_page(url)
        if 'error' in result:
            errors.append(result)
        else:
            results.append(result)

        if (i + 1) % 50 == 0:
            print(f"  Progress: {i + 1}/{total} ({len(results)} OK, {len(errors)} errors)")

        time.sleep(0.3)

    print(f"\nStep 3: Results summary")
    print(f"  Successful: {len(results)}")
    print(f"  Errors: {len(errors)}")

    platforms = {}
    for d in results:
        p = d.get('platform', 'Unknown')
        platforms[p] = platforms.get(p, 0) + 1
    print(f"\n  Platform distribution:")
    for p, c in sorted(platforms.items(), key=lambda x: -x[1]):
        print(f"    {p}: {c}")

    all_tags = set()
    for d in results:
        for t in d.get('tags', []):
            all_tags.add(t)
    print(f"\n  Unique tags: {len(all_tags)}")

    has_cover = sum(1 for d in results if d.get('coverUrl'))
    has_synopsis = sum(1 for d in results if d.get('synopsis') and len(d['synopsis']) > 10)
    has_episodes = sum(1 for d in results if d.get('chapterCount') and d['chapterCount'] > 0)
    has_tags = sum(1 for d in results if d.get('tags') and len(d['tags']) > 0)

    print(f"\n  Data quality:")
    print(f"    With cover: {has_cover}/{len(results)}")
    print(f"    With synopsis: {has_synopsis}/{len(results)}")
    print(f"    With episodes: {has_episodes}/{len(results)}")
    print(f"    With tags: {has_tags}/{len(results)}")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n  Saved to {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
