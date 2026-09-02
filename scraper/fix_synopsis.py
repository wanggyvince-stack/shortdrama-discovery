#!/usr/bin/env python3
"""
Phase 2: Fix quality issues from Phase 1 scrape
Issues to fix:
1. "Dramora indexes..." - wrong JSON-LD schema (WebSite instead of CreativeWorkSeries)
2. "X lists Y as a N-episode..." - template text
3. Tag garbage (KHidden, -Torture etc.)
4. "In source metadata..." prefix not stripped
"""

import json
import asyncio
import aiohttp
import re
import os
from datetime import datetime, timezone
from html import unescape
from typing import Optional

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'lib', 'dramas-data.json')
REPORT_FILE = os.path.join(os.path.dirname(__file__), 'synopsis_fix_report.md')
STATE_FILE = os.path.join(os.path.dirname(__file__), 'fix_state.json')

MAX_CONCURRENT = 5
BATCH_PAUSE = 1.0
SAVE_EVERY = 50
MAX_RETRIES = 2

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}


def is_bad_synopsis(s: str) -> bool:
    """Check if a synopsis is bad/low-quality."""
    if not s or len(s.strip()) < 20:
        return True
    text = s.strip()
    
    bad_patterns = [
        r'^Dramora indexes',
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
        r'^In source metadata',
        r'-Torture',
        r'KHidden',
        r'KAlpha',
        r'KContemporary',
        r'^MLove-Torture',
    ]
    for p in bad_patterns:
        if re.search(p, text, re.IGNORECASE):
            return True
    return False


def _extract_real_synopsis_from_text(text: str) -> Optional[str]:
    """Extract real plot synopsis from Dramora description."""
    text = text.strip()
    if len(text) < 30:
        return None
    
    # Skip site-level descriptions
    if text.startswith('Dramora indexes') or 'helps viewers discover' in text[:50]:
        return None
    if 'metadata is currently light' in text.lower():
        return None
    
    # Clean tag garbage first
    text = re.sub(r'[A-Z][a-z]*(?:[A-Z][a-z]+){2,}', ' ', text)  # CamelCase tag runs
    text = re.sub(r'(?<![.!?])\s+-[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*', ' ', text)  # -Tag patterns
    
    # Pattern A: "The crawled synopsis points to [SYNOPSIS]."
    m = re.search(
        r'The crawled synopsis points to\s+(.*?)(?:\.\s*Dramora|\.\s*More)',
        text, re.DOTALL | re.IGNORECASE
    )
    if m:
        result = m.group(1).strip().rstrip('.')
        # Remove trailing ellipsis indicators
        result = re.sub(r'…+$', '', result).strip().rstrip('.')
        if len(result) > 30:
            return result
    
    # Pattern B: "In source metadata, the setup centers on [SYNOPSIS]."
    m = re.search(
        r'(?:In source metadata|In the source metadata),?\s*'
        r'(?:the setup centers on|the story centers on|it follows|the plot follows)?\s*'
        r'(.*?)(?:\.\s*Dramora|\.\s*More)',
        text, re.DOTALL | re.IGNORECASE
    )
    if m:
        result = m.group(1).strip().rstrip('.')
        result = re.sub(r'…+$', '', result).strip().rstrip('.')
        # Additional tag cleanup
        result = re.sub(r'^[A-Z][a-z]*(?:\s*[A-Z][a-z]*){3,}\s*', '', result)
        if len(result) > 25:
            return result
    
    # Pattern C: "The public description frames the hook around [SYNOPSIS]."
    m = re.search(
        r'(?:The public description frames the hook around|the description reveals|'
        r'the premise is that)\s*(.*?)(?:\.\s*Dramora|\.\s*More)',
        text, re.DOTALL | re.IGNORECASE
    )
    if m:
        result = m.group(1).strip().rstrip('.')
        result = re.sub(r'…+$', '', result).strip().rstrip('.')
        if len(result) > 25:
            return result
    
    # Pattern D: Plot sentences extraction
    sentences = re.split(r'(?<=[.!?])\s+', text)
    skip = [
        r'Dramora adds', r'discovery signals', r'official-watch',
        r'available metadata', r'metadata points', r'More ›',
        r'is a \d+-episode', r'is a short-form', r'sits in Dramora',
        r'compare it without', r'lists \w+ as a', r'metadata is currently',
        r'verified source fields', r'emphasizes', r'indexes short drama',
    ]
    plot_kw = [
        r'\b(she|he|they|her|his)\b', r'\bmarried\b', r'\blove\b', r'\bsecret\b',
        r'\bbillionaire\b', r'\bfind[s]?\b', r'\bdiscover[s]?\b', r'\bhidden\b',
        r'\breturn[s]?\b', r'\bescape[s]?\b', r'\bfight[s]?\b', r'\bforce[s]?\b',
        r'\bmust\b', r'\btry\b', r'\bwhen\b', r'\bafter\b', r'\bbut\b',
        r'\bwill\b', r'\bnever\b', r'\balways\b', r'\bmother\b', r'\bfather\b',
        r'\bson\b', r'\bdaughter\b', r'\bwife\b', r'\bhusband\b', r'\bbetray',
        r'\brevenge\b', r'\bpower\b', r'\bfamily\b', r'\bchild', r'\bbaby\b',
        r'\bpregnan', r'\bwolf\b', r'\balpha\b', r'\bpack\b', r'\bkill',
        r'\bsave\b', r'\bprotect\b', r'\btruth\b', r'\blie\b',
        r'\bunravel', r'\bperfect life\b', r'\bcollege\b', r'\bviolent\b',
        r'\bagenda\b', r'\bsweet\b', r'\bsecretary\b', r'\bsperm\b',
        r'\banniversary\b', r'\baffair\b', r'\bendure\b', r'\bstraw\b',
        r'\bfrozen\b', r'\bcryopreservation\b', r'\babuse\b', r'\bbrother',
    ]
    
    plot_s = []
    for s in sentences:
        if any(re.search(p, s, re.IGNORECASE) for p in skip):
            continue
        if len(s) > 15 and any(re.search(p, s, re.IGNORECASE) for p in plot_kw):
            # Skip if it looks like a tag list
            words = s.split()
            if len(words) < 10:
                caps = sum(1 for w in words if w[0].isupper() and len(w) > 2)
                if caps > len(words) * 0.5:
                    continue
            plot_s.append(s.strip())
    
    if plot_s:
        result = ' '.join(plot_s[:5])
        if len(result) > 30:
            return result
    
    return None


def extract_bsd_synopsis(html: str) -> Optional[str]:
    """Extract real synopsis from bestshortdrama.com page."""
    
    # Strategy 1: JSON-LD CreativeWorkSeries ONLY (not WebSite!)
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
    
    # Strategy 2: Visible SYNOPSIS section
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
    
    # Strategy 3: Next.js hydration data
    for desc_match in re.findall(r'"description":"((?:[^"\\]|\\.)*)"', html):
        try:
            decoded = desc_match.encode('utf-8').decode('unicode_escape', errors='ignore')
        except:
            decoded = desc_match
        # Skip site descriptions
        if decoded.startswith('Dramora indexes') or 'helps viewers discover' in decoded[:50]:
            continue
        if len(decoded) > 80 and 'Dramora' in decoded:
            result = _extract_real_synopsis_from_text(decoded)
            if result and len(result) > 30:
                return result
    
    return None


async def fetch_url(session, url):
    for attempt in range(MAX_RETRIES + 1):
        try:
            async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=20)) as resp:
                if resp.status == 200:
                    return await resp.text()
                elif resp.status == 429:
                    await asyncio.sleep(5 * (attempt + 1))
                else:
                    if attempt < MAX_RETRIES:
                        await asyncio.sleep(1)
        except Exception:
            if attempt < MAX_RETRIES:
                await asyncio.sleep(1.5)
    return None


async def scrape_drama(session, drama, semaphore):
    async with semaphore:
        drama_id = drama['id']
        url = f"https://bestshortdrama.com/drama/{drama_id}"
        html = await fetch_url(session, url)
        if not html:
            return (drama_id, None)
        synopsis = extract_bsd_synopsis(html)
        if synopsis:
            synopsis = re.sub(r'\s+', ' ', synopsis).strip()
            if len(synopsis) < 20 or is_bad_synopsis(synopsis):
                synopsis = None
        return (drama_id, synopsis)


async def main():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    dramas = data['dramas']
    
    # Find dramas with bad synopses
    bad_dramas = [d for d in dramas if is_bad_synopsis(d.get('synopsis', ''))]
    print(f"Found {len(bad_dramas)} dramas with bad synopses out of {len(dramas)}")
    
    if not bad_dramas:
        print("All synopses look good!")
        return
    
    # Count by source
    sources = {}
    for d in bad_dramas:
        s = d.get('source', 'unknown')
        sources[s] = sources.get(s, 0) + 1
    print(f"By source: {dict(sorted(sources.items()))}")
    
    # Scrape with improved extraction
    stats = {'total': len(bad_dramas), 'fixed': 0, 'still_bad': 0, 'by_source_fixed': {}, 'by_source_fail': {}, 'successes': [], 'failures': []}
    
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    connector = aiohttp.TCPConnector(limit=MAX_CONCURRENT + 2, force_close=False, ttl_dns_cache=300)
    
    print(f"\nRe-scraping with improved extraction...")
    
    async with aiohttp.ClientSession(connector=connector) as session:
        batch_size = MAX_CONCURRENT * 3
        processed = 0
        
        for i in range(0, len(bad_dramas), batch_size):
            batch = bad_dramas[i:i + batch_size]
            tasks = [scrape_drama(session, d, semaphore) for d in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for j, result in enumerate(results):
                drama = batch[j]
                source = drama.get('source', 'unknown')
                
                if isinstance(result, Exception):
                    stats['still_bad'] += 1
                    stats['by_source_fail'][source] = stats['by_source_fail'].get(source, 0) + 1
                    stats['failures'].append({'id': drama['id'], 'title': drama.get('title', ''), 'source': source, 'error': str(result)})
                    continue
                
                drama_id, synopsis = result
                
                if synopsis and not is_bad_synopsis(synopsis):
                    # Update in place
                    for d in dramas:
                        if d['id'] == drama_id:
                            d['synopsis'] = synopsis
                            break
                    stats['fixed'] += 1
                    stats['by_source_fixed'][source] = stats['by_source_fixed'].get(source, 0) + 1
                    stats['successes'].append({
                        'id': drama_id, 'title': drama.get('title', ''), 'source': source,
                        'preview': synopsis[:150] + '...' if len(synopsis) > 150 else synopsis
                    })
                else:
                    stats['still_bad'] += 1
                    stats['by_source_fail'][source] = stats['by_source_fail'].get(source, 0) + 1
                    stats['failures'].append({'id': drama_id, 'title': drama.get('title', ''), 'source': source, 'error': 'still_bad'})
                
                processed += 1
            
            if processed % SAVE_EVERY == 0 or i + batch_size >= len(bad_dramas):
                data['dramas'] = dramas
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"  [{processed}/{stats['total']}] Fixed: {stats['fixed']} | Still bad: {stats['still_bad']}")
            
            if i + batch_size < len(bad_dramas):
                await asyncio.sleep(BATCH_PAUSE)
    
    # Final save
    data['dramas'] = dramas
    data['generatedAt'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # Final quality check
    final_bad = sum(1 for d in dramas if is_bad_synopsis(d.get('synopsis', '')))
    
    print(f"\n{'='*60}")
    print(f"FIX COMPLETE")
    print(f"{'='*60}")
    print(f"Attempted: {stats['total']}")
    print(f"Fixed: {stats['fixed']}")
    print(f"Still bad: {stats['still_bad']}")
    print(f"Final bad count across all 714 dramas: {final_bad}")
    
    for s in sorted(sources.keys()):
        f_count = stats['by_source_fixed'].get(s, 0)
        fail_count = stats['by_source_fail'].get(s, 0)
        print(f"  {s}: fixed {f_count}, still bad {fail_count}")
    
    # Generate report
    lines = []
    lines.append("# Synopsis Fix Report (Phase 2)")
    lines.append(f"\n**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    lines.append(f"\n## Summary\n")
    lines.append(f"| Metric | Count |")
    lines.append(f"|--------|-------|")
    lines.append(f"| Bad synopses found | {stats['total']} |")
    lines.append(f"| Fixed | {stats['fixed']} |")
    lines.append(f"| Still bad | {stats['still_bad']} |")
    lines.append(f"| Final bad count (total 714) | {final_bad} |")
    
    lines.append(f"\n## By Platform\n")
    lines.append(f"| Platform | Fixed | Still Bad |")
    lines.append(f"|----------|-------|-----------|")
    for s in sorted(sources.keys()):
        lines.append(f"| {s} | {stats['by_source_fixed'].get(s, 0)} | {stats['by_source_fail'].get(s, 0)} |")
    
    if stats['successes']:
        lines.append(f"\n## Fix Examples\n")
        for i, s in enumerate(stats['successes'][:10], 1):
            lines.append(f"### {i}. {s['title']}")
            lines.append(f"- **Platform:** {s['source']}")
            lines.append(f"- **Fixed Synopsis:** {s['preview']}")
            lines.append("")
    
    if stats['failures']:
        lines.append(f"\n## Still Bad ({len(stats['failures'])})\n")
        lines.append("| # | Title | Platform |")
        lines.append("|---|-------|----------|")
        for i, f_item in enumerate(stats['failures'][:50], 1):
            lines.append(f"| {i} | {f_item['title']} | {f_item['source']} |")
    
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"\nReport: {REPORT_FILE}")


if __name__ == '__main__':
    asyncio.run(main())
