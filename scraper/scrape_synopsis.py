#!/usr/bin/env python3
"""
批量爬取短剧 Synopsis - 通过 bestshortdrama.com (Dramora)
源站 (GoodShort/NetShort) 有反爬保护，使用 bestshortdrama.com 聚合站作为数据源
"""

import json
import asyncio
import aiohttp
import re
import os
from datetime import datetime, timezone
from html import unescape
from typing import Optional, Dict, List, Tuple

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'lib', 'dramas-data.json')
REPORT_FILE = os.path.join(os.path.dirname(__file__), 'synopsis_scrape_report.md')
STATE_FILE = os.path.join(os.path.dirname(__file__), 'scrape_state.json')

MAX_CONCURRENT = 5
BATCH_PAUSE = 1.0
SAVE_EVERY = 50
MAX_RETRIES = 2

# Patterns indicating template/low-quality synopsis
TEMPLATE_PATTERNS = [
    r'^Passion, power',
    r'^A family bonds',
    r'^From the first episode',
    r'^Experience the drama unfold',
    r'^Follow the twists of fate',
    r'^Dive into a world',
    r'^A gripping tale of',
    r'^An? \d+-episode',
    r'^Watch on ',
    r'^Catch every episode',
    r'^All episodes available',
    r'^Stream now on',
    r'^Full episodes on',
    r'^is a \d+-episode',
    r'^sits in Dramora',
    r'^is a short-form',
    r'^\w+ lists \w+ as a \d+-episode',
    r'^\w+ lists \w+ as a short-form',
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}


def is_template_synopsis(synopsis: str) -> bool:
    if not synopsis or len(synopsis.strip()) < 20:
        return True
    text = synopsis.strip()
    for pattern in TEMPLATE_PATTERNS:
        if re.match(pattern, text, re.IGNORECASE):
            return True
    return False


def _clean_tags_from_text(text: str) -> str:
    """Remove embedded tag words that got mixed into the synopsis text."""
    # Remove patterns like "KHidden IdentityRevengeCEOLove-Torture"
    text = re.sub(r'K[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:[A-Z][a-z]*)*', '', text)
    # Remove sequences of capitalized single words without spaces
    text = re.sub(r'(?<![.!?]\s)(?:[A-Z][a-z]{1,15}){3,}', '', text)
    return text.strip()


def _extract_real_synopsis_from_text(text: str) -> Optional[str]:
    """Extract the real plot synopsis from a Dramora description text."""
    text = text.strip()
    if len(text) < 30:
        return None
    
    # Skip if text says metadata is light/missing
    if 'metadata is currently light' in text.lower() or 'metadata is sparse' in text.lower():
        return None
    
    # Pattern A: "The crawled synopsis points to [REAL SYNOPSIS]."
    m = re.search(
        r'The crawled synopsis points to\s+(.*?)(?:\.\s*Dramora|\.\s*More|…)',
        text, re.DOTALL | re.IGNORECASE
    )
    if m:
        result = m.group(1).strip().rstrip('.')
        if len(result) > 30:
            return result
    
    # Pattern B: "In source metadata, the setup centers on [REAL SYNOPSIS]."
    m = re.search(
        r'(?:In source metadata|In the source metadata),?\s*'
        r'(?:the setup centers on|the story centers on|it follows|the plot follows)?\s*'
        r'(.*?)(?:\.\s*Dramora|\.\s*More|…)',
        text, re.DOTALL | re.IGNORECASE
    )
    if m:
        result = m.group(1).strip().rstrip('.')
        # Clean possible embedded tags
        result = _clean_tags_from_text(result)
        if len(result) > 25 and not _looks_like_tags_only(result):
            return result
    
    # Pattern C: "The public description frames the hook around [REAL SYNOPSIS]."
    m = re.search(
        r'(?:The public description frames the hook around|the description reveals|'
        r'the premise is that)\s*(.*?)(?:\.\s*Dramora|\.\s*More|…)',
        text, re.DOTALL | re.IGNORECASE
    )
    if m:
        result = m.group(1).strip().rstrip('.')
        if len(result) > 25 and not _looks_like_tags_only(result):
            return result
    
    # Pattern D: Look for sentences with actual plot content
    sentences = re.split(r'(?<=[.!?])\s+', text)
    skip_patterns = [
        r'Dramora adds', r'discovery signals', r'official-watch',
        r'available metadata', r'metadata points', r'More ›',
        r'is a \d+-episode', r'is a short-form', r'sits in Dramora',
        r'compare it without', r'lists \w+ as a', r'metadata is currently',
        r'verified source fields', r'emphasizes',
    ]
    plot_keywords = [
        r'\b(she|he|they|her|his)\b', r'\bmarried\b', r'\blove\b', r'\bsecret\b',
        r'\bbillionaire\b', r'\bfind[s]?\b', r'\bdiscover[s]?\b', r'\bhidden\b',
        r'\breturn[s]?\b', r'\bescape[s]?\b', r'\bfight[s]?\b', r'\bforce[s]?\b',
        r'\bmust\b', r'\btry\b', r'\bwhen\b', r'\bafter\b', r'\bbut\b',
        r'\bwill\b', r'\bnever\b', r'\balways\b', r'\bmother\b', r'\bfather\b',
        r'\bson\b', r'\bdaughter\b', r'\bwife\b', r'\bhusband\b', r'\bbetray',
        r'\brevenge\b', r'\bpower\b', r'\bfamily\b', r'\bchild', r'\bbaby\b',
        r'\bpregnan', r'\bwolf\b', r'\balpha\b', r'\bpack\b', r'\bkill',
        r'\bdie\b', r'\bsave\b', r'\bprotect\b', r'\btruth\b', r'\blie\b',
        r'\bwealth\b', r'\brich\b', r'\bpoor\b', r'\bbroke\b', r'\bunravel',
        r'\bperfect life\b', r'\bcollege\b', r'\bviolent\b', r'\bagenda\b',
        r'\bsweet\b', r'\bsecretary\b', r'\bsp erm\b',
    ]
    
    plot_sentences = []
    for s in sentences:
        if any(re.search(p, s, re.IGNORECASE) for p in skip_patterns):
            continue
        if len(s) > 20 and any(re.search(p, s, re.IGNORECASE) for p in plot_keywords):
            plot_sentences.append(s.strip())
    
    if plot_sentences:
        result = ' '.join(plot_sentences[:5])
        if len(result) > 30:
            return result
    
    return None


def _looks_like_tags_only(text: str) -> bool:
    """Check if text is just a list of tags rather than real synopsis."""
    words = text.split()
    if len(words) <= 5:
        # Short text with mostly capitalized words = likely tags
        caps = sum(1 for w in words if w[0].isupper())
        if caps > len(words) * 0.6:
            return True
    return False


def extract_bsd_synopsis(html: str) -> Optional[str]:
    """Extract real synopsis from bestshortdrama.com page."""
    
    # Strategy 1: JSON-LD CreativeWorkSeries description
    for match in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL):
        try:
            data = json.loads(match)
            items = data if isinstance(data, list) else [data]
            for item in items:
                if item.get('@type') == 'CreativeWorkSeries':
                    desc = item.get('description', '')
                    if desc and len(desc) > 40:
                        result = _extract_real_synopsis_from_text(desc)
                        if result and len(result) > 30:
                            return result
        except (json.JSONDecodeError, TypeError):
            continue
    
    # Strategy 2: Visible SYNOPSIS section text
    idx = html.find('SYNOPSIS')
    if idx >= 0:
        segment = html[idx:idx+5000]
        p_match = re.search(r'<p[^>]*>(.*?)</p>', segment, re.DOTALL)
        if p_match:
            raw = p_match.group(1)
            clean = re.sub(r'<[^>]+>', '', raw)
            clean = unescape(clean)
            clean = re.sub(r'\s+', ' ', clean).strip()
            if clean and len(clean) > 40:
                result = _extract_real_synopsis_from_text(clean)
                if result and len(result) > 30:
                    return result
    
    # Strategy 3: Next.js hydration data descriptions
    for desc_match in re.findall(r'"description":"((?:[^"\\]|\\.)*)"', html):
        try:
            decoded = desc_match.encode('utf-8').decode('unicode_escape', errors='ignore')
        except:
            decoded = desc_match
        if len(decoded) > 80 and 'Dramora' in decoded:
            result = _extract_real_synopsis_from_text(decoded)
            if result and len(result) > 30:
                return result
    
    return None


async def fetch_url(session: aiohttp.ClientSession, url: str) -> Optional[str]:
    for attempt in range(MAX_RETRIES + 1):
        try:
            async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=20)) as resp:
                if resp.status == 200:
                    return await resp.text()
                elif resp.status == 429:
                    await asyncio.sleep(5 * (attempt + 1))
                elif resp.status in (403, 404, 500, 503):
                    return None
                else:
                    if attempt < MAX_RETRIES:
                        await asyncio.sleep(1)
        except Exception:
            if attempt < MAX_RETRIES:
                await asyncio.sleep(1.5)
    return None


async def scrape_drama(session: aiohttp.ClientSession, drama: dict, semaphore: asyncio.Semaphore) -> Tuple[str, Optional[str]]:
    async with semaphore:
        drama_id = drama['id']
        url = f"https://bestshortdrama.com/drama/{drama_id}"
        
        html = await fetch_url(session, url)
        if not html:
            return (drama_id, None)
        
        synopsis = extract_bsd_synopsis(html)
        
        if synopsis:
            synopsis = re.sub(r'\s+', ' ', synopsis).strip()
            if len(synopsis) < 20 or is_template_synopsis(synopsis):
                synopsis = None
        
        return (drama_id, synopsis)


def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'completed': [], 'results': {}}


def save_state(state: dict):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False)


async def main():
    print(f"Loading data from {DATA_FILE}")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    dramas = data['dramas']
    total = len(dramas)
    print(f"Total dramas: {total}")
    
    # Filter dramas needing update
    needs_update = []
    already_good = []
    for d in dramas:
        current = d.get('synopsis', '')
        if not current or is_template_synopsis(current):
            needs_update.append(d)
        else:
            already_good.append(d)
    
    sources = {}
    for d in needs_update:
        s = d.get('source', 'unknown')
        sources[s] = sources.get(s, 0) + 1
    
    print(f"\nAlready good synopsis: {len(already_good)}")
    print(f"Need update: {len(needs_update)}")
    print(f"By source: {dict(sorted(sources.items()))}")
    
    # Resume state
    state = load_state()
    completed_ids = set(state.get('completed', []))
    cached_results = state.get('results', {})
    
    to_scrape = [d for d in needs_update if d['id'] not in completed_ids]
    print(f"Already processed this run: {len(completed_ids)}, remaining: {len(to_scrape)}")
    
    if not to_scrape:
        print("Nothing to scrape!")
        # Apply cached results
        apply_and_save(data, dramas, state, already_good)
        return
    
    # Stats
    stats = {
        'total_to_scrape': len(to_scrape),
        'success': 0, 'failed': 0,
        'by_source_success': {}, 'by_source_fail': {}, 'by_source_total': {},
        'successes': [], 'failures': [],
    }
    for d in to_scrape:
        s = d.get('source', 'unknown')
        stats['by_source_total'][s] = stats['by_source_total'].get(s, 0) + 1
    
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    
    print(f"\nStarting scrape ({MAX_CONCURRENT} concurrent)...\n")
    
    connector = aiohttp.TCPConnector(limit=MAX_CONCURRENT + 2, force_close=False, ttl_dns_cache=300)
    async with aiohttp.ClientSession(connector=connector) as session:
        batch_size = MAX_CONCURRENT * 3
        processed = 0
        saved_at = 0
        
        for i in range(0, len(to_scrape), batch_size):
            batch = to_scrape[i:i + batch_size]
            tasks = [scrape_drama(session, d, semaphore) for d in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for j, result in enumerate(batch_results):
                drama = batch[j]
                drama_id = drama['id']
                source = drama.get('source', 'unknown')
                
                state['completed'].append(drama_id)
                
                if isinstance(result, Exception):
                    stats['failed'] += 1
                    stats['by_source_fail'][source] = stats['by_source_fail'].get(source, 0) + 1
                    stats['failures'].append({'id': drama_id, 'title': drama.get('title', ''), 'source': source, 'error': str(result)})
                    continue
                
                drama_id_r, synopsis = result
                
                if synopsis and not is_template_synopsis(synopsis):
                    state['results'][drama_id] = synopsis
                    stats['success'] += 1
                    stats['by_source_success'][source] = stats['by_source_success'].get(source, 0) + 1
                    stats['successes'].append({
                        'id': drama_id, 'title': drama.get('title', ''), 'source': source,
                        'synopsis_preview': synopsis[:150] + '...' if len(synopsis) > 150 else synopsis
                    })
                else:
                    stats['failed'] += 1
                    stats['by_source_fail'][source] = stats['by_source_fail'].get(source, 0) + 1
                    stats['failures'].append({'id': drama_id, 'title': drama.get('title', ''), 'source': source, 'error': 'no_real_synopsis'})
                
                processed += 1
            
            # Apply & save periodically
            updated = 0
            for drama in dramas:
                if drama['id'] in state['results']:
                    new_syn = state['results'][drama['id']]
                    if not is_template_synopsis(new_syn):
                        drama['synopsis'] = new_syn
                        updated += 1
            
            if processed - saved_at >= SAVE_EVERY or i + batch_size >= len(to_scrape):
                save_state(state)
                data['dramas'] = dramas
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"  [{processed}/{stats['total_to_scrape']}] ✓{stats['success']} ✗{stats['failed']} | Updated: {updated} | Saved")
                saved_at = processed
            
            if i + batch_size < len(to_scrape):
                await asyncio.sleep(BATCH_PAUSE)
    
    # Final save
    apply_and_save(data, dramas, state, already_good)
    
    # Cleanup
    if os.path.exists(STATE_FILE):
        os.remove(STATE_FILE)
    
    # Report
    generate_report(stats, len(already_good), len(needs_update))
    
    print(f"\n{'='*60}")
    print(f"SCRAPE COMPLETE")
    print(f"{'='*60}")
    print(f"Total: {total} | Already good: {len(already_good)} | Scraped: {stats['success']} | Failed: {stats['failed']}")
    print(f"Total with real synopsis now: {len(already_good) + stats['success']}")
    for s in sorted(stats['by_source_total'].keys()):
        t = stats['by_source_total'][s]
        succ = stats['by_source_success'].get(s, 0)
        fail = stats['by_source_fail'].get(s, 0)
        print(f"  {s}: {succ}/{t} success ({succ/max(t,1)*100:.0f}%)")


def apply_and_save(data, dramas, state, already_good):
    """Apply all cached results and save."""
    for drama in dramas:
        if drama['id'] in state.get('results', {}):
            new_syn = state['results'][drama['id']]
            if not is_template_synopsis(new_syn):
                drama['synopsis'] = new_syn
    
    data['dramas'] = dramas
    data['generatedAt'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Data saved to: {DATA_FILE}")


def generate_report(stats, already_good, needs_update):
    lines = []
    lines.append("# Synopsis Scrape Report")
    lines.append(f"\n**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    lines.append(f"\n## Summary\n")
    lines.append(f"| Metric | Count |")
    lines.append(f"|--------|-------|")
    lines.append(f"| Total dramas in database | {already_good + needs_update} |")
    lines.append(f"| Already had good synopsis | {already_good} |")
    lines.append(f"| Attempted to scrape | {stats['total_to_scrape']} |")
    lines.append(f"| Successful | {stats['success']} |")
    lines.append(f"| Failed | {stats['failed']} |")
    rate = stats['success'] / max(stats['total_to_scrape'], 1) * 100
    lines.append(f"| Success rate | {rate:.1f}% |")
    lines.append(f"| **Total with real synopsis** | **{already_good + stats['success']}** |")
    
    lines.append(f"\n## By Platform\n")
    lines.append(f"| Platform | Total | Success | Failed | Rate |")
    lines.append(f"|----------|-------|---------|--------|------|")
    for s in sorted(stats['by_source_total'].keys()):
        t = stats['by_source_total'][s]
        succ = stats['by_source_success'].get(s, 0)
        fail = stats['by_source_fail'].get(s, 0)
        r = succ / max(t, 1) * 100
        lines.append(f"| {s} | {t} | {succ} | {fail} | {r:.0f}% |")
    
    lines.append(f"\n## Top 10 Synopsis Examples\n")
    for i, s in enumerate(stats['successes'][:10], 1):
        lines.append(f"### {i}. {s['title']}")
        lines.append(f"- **Platform:** {s['source']}")
        lines.append(f"- **Synopsis:** {s['synopsis_preview']}")
        lines.append("")
    
    if stats['failures']:
        lines.append(f"\n## Failures ({len(stats['failures'])})\n")
        lines.append("| # | Title | Platform | Reason |")
        lines.append("|---|-------|----------|--------|")
        for i, f_item in enumerate(stats['failures'][:60], 1):
            lines.append(f"| {i} | {f_item['title']} | {f_item['source']} | {f_item['error']} |")
        if len(stats['failures']) > 60:
            lines.append(f"\n*... and {len(stats['failures']) - 60} more*")
    
    lines.append(f"\n## Notes\n")
    lines.append("- **Data source:** bestshortdrama.com (Dramora aggregator)")
    lines.append("- **Why not source sites:** GoodShort/NetShort have anti-bot protection (403)")
    lines.append("- **Extraction methods:** JSON-LD schema.org → visible SYNOPSIS text → Next.js hydration data")
    lines.append("- **Quality filter:** Template/generic synopses excluded via pattern matching")
    lines.append("- **Limitations:** Some dramas on Dramora have minimal metadata (no real synopsis available)")
    
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Report saved to: {REPORT_FILE}")


if __name__ == '__main__':
    asyncio.run(main())
