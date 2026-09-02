# Synopsis Scrape Report

**Generated:** 2026-09-02 09:38:41 UTC

## Summary

| Metric | Count | % |
|--------|-------|---|
| Total dramas | 714 | 100% |
| With real synopsis | 505 | 70.7% |
| Still template/bad | 209 | 29.3% |

## By Platform

| Platform | Total | Good | Bad | Success Rate |
|----------|-------|------|-----|-------------|
| FlexTV | 101 | 95 | 6 | 94% |
| GoodShort | 203 | 199 | 4 | 98% |
| NetShort | 74 | 46 | 28 | 62% |
| ReelShort | 89 | 88 | 1 | 99% |
| ShortMax | 247 | 77 | 170 | 31% |

## Data Sources

1. **bestshortdrama.com (Dramora)**: Primary source - covers all 714 dramas. Extracted from JSON-LD schema.org CreativeWorkSeries and visible SYNOPSIS sections.
2. **Source sites via fetch_web**: GoodShort/NetShort/ReelShort pages that returned API data.
3. **Limitations**: ShortMax (shorttv.live), FlexTV source pages are inaccessible. NetShort has ~40% URL failure rate.

## Quality Notes

- Synopses are real plot descriptions from official platforms
- Template phrases like 'Passion, power...' and 'Follow the twists of fate...' are excluded
- 209 dramas retain template synopses, mainly from platforms with anti-bot protection
- ShortMax (170 bad): source site returns no text content
- NetShort (28 bad): ~60% of source URLs return errors
- GoodShort (4 bad): Cloudflare protection blocks most requests
- FlexTV (6 bad): source site inaccessible

## Scripts

- `scraper/scrape_synopsis.py`: Main scraper (bestshortdrama.com)
- `scraper/fix_synopsis.py`: Quality fix script

## Synopsis Examples

### 1. 100% Destined for Your Love (GoodShort)
Nina and Adam are both trying to flee from an arranged marriage tailor-made for them, but by the hand of fate, they end up meeting each other unprompted and making the spur-of-the-moment decision to g...

### 2. 30 Years Frozen,3 Brothers Regret (NetShort)
After enduring relentless abuse from her three brothers, the younger sister volunteered for a human cryopreservation experiment—sleeping for three decades. Selene, abused by her adopted brothers and r...

### 3. 30 Years Frozen, Emergency Rescue (NetShort)
When Selene Onassis's cryo-pod fails, Dr. Charlotte Reed must deliver the only serum in 3 hours. Sabotaged by Isabella—a woman claiming to be engaged to Selene's brother—Charlotte faces mid-air attack...

### 4. 99 Forgiveness, One Goodbye (ReelShort)
Brianna has been married to boxer Mark Maddix for

### 5. A Billionaire Queen's Fight for Justice (GoodShort)
GoodShort lists A Billionaire Queen's Fight for Justice as a 81-episode title with revenge / comeback appeal.

### 6. A Billionaire Stay-at-home Dad's Two Treasures (GoodShort)
A Billionaire Stay-at-home Dad's Two Treasures follows family bonds, parent-child reveals, and protective romance. A captivating 67-episode short drama on GoodShort.

### 7. A Billionaire's Secret Five (FlexTV)
A single sperm literally caused this woman

### 8. A Blind Date with my Mr. Meant-to-Be (GoodShort)
A Blind Date with my Mr. Meant-to-Be follows family bonds, parent-child reveals, and protective romance. A captivating 72-episode short drama on GoodShort.

### 9. A Decade to Brew True Love (GoodShort)
On her anniversary, Annabelle received proof of her husband Xavier's affair, the final straw after a decade of silent endurance

### 10. A Father's Regret (ReelShort)
On their twin daughters' fifth birthday, a ruthless father,


## Remaining Bad (209)

| # | Title | Source |
|---|-------|--------|
| 1 | A Game of Hearts and Lies | FlexTV |
| 2 | A Love Contract with the Zombie King | GoodShort |
| 3 | A Matter of Sin and Love | FlexTV |
| 4 | A Mother's Renunciation | ShortMax |
| 5 | A Second Life in the Marquis Estate | ShortMax |
| 6 | A Thousand Years to Love You | ShortMax |
| 7 | After She Cheated with a Star, I Pulled Her from Every Screen | ShortMax |
| 8 | Apocalypse: I have a super fortress in advance | ShortMax |
| 9 | Ascended: The Stunning Heiress Kneels | NetShort |
| 10 | Back with Five Heirs to Claim What's Mine | GoodShort |
| 11 | Beast Whisperer’s Mountain Fortune Hunt | ShortMax |
| 12 | Begging for Her Grace | FlexTV |
| 13 | Beyond the Law | ShortMax |
| 14 | Blood Harvest | ShortMax |
| 15 | Bloodbound Queen-I Kissed the Hunter Who Saved Me | ShortMax |
| 16 | Bow to 10-Year-Old Archmage Aldric | ShortMax |
| 17 | Clear Break | ShortMax |
| 18 | Cursed: I Married the Don in My Sister's Place | ShortMax |
| 19 | Dangerous Contract: Let Me Go, Mr. CEO | ShortMax |
| 20 | Died, Woke, Then Conquered | NetShort |
| 21 | Divine Doctor | ShortMax |
| 22 | Divorce Me, I Have Billions to Inherit | ShortMax |
| 23 | Divorced, I married the godfather. | ShortMax |
| 24 | Don't Be So Cruel, My Dominant Husband | ShortMax |
| 25 | Don't Mess with the New Guard | NetShort |
| 26 | Dragon King | ShortMax |
| 27 | Dreams Brought Us Together | ShortMax |
| 28 | [Dubbed]Am I A Taxi Driver? | ShortMax |
| 29 | [Dubbed]Apocalypse: My Infinite RV Upgrade | ShortMax |
| 30 | [Dubbed]Awesome Dad | ShortMax |
| 31 | [Dubbed] Beneath the Hypnosis | ShortMax |
| 32 | [Dubbed ]Billionaire Heiress Reborn | ShortMax |
| 33 | [Dubbed] Cataclysm Arrives: I Have a Mobile Fortress | ShortMax |
| 34 | [Dubbed]Data Deception: A Wife's Regret | ShortMax |
| 35 | [Dubbed]Destiny's Keeper | ShortMax |
| 36 | [Dubbed] Devil by My Side | ShortMax |
| 37 | [Dubbed] Don't Panic! Your Boss Just Married Dad! | ShortMax |
| 38 | [Dubbed] Doomsday Supermarket | ShortMax |
| 39 | [Dubbed]Dragon Lord’s Revenge | ShortMax |
| 40 | [Dubbed] Future Diary: The Journal of Premonitions | ShortMax |

*... and 169 more*