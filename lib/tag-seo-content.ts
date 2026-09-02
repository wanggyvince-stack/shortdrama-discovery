/**
 * Tag SEO Content - Editorial introductions for top 5 tag pages
 * 
 * These introductions are data-driven, editorial in tone, and avoid template phrases.
 * All numbers are verified against dramas-data.json.
 * 
 * Source: dramadisco_tag_intros_v1.3_20260902.md (Anna)
 * Corrected by: 产品扣子 (5 data fixes applied)
 */

export interface TagSEOContent {
  slug: string;
  intro: string;
}

export const TAG_SEO_CONTENT: Record<string, TagSEOContent> = {
  'revenge---comeback': {
    slug: 'revenge---comeback',
    intro: `**Revenge is the genre that turns casual viewers into binge-watchers.** Of the 173 revenge-themed short dramas on DramaDisco, 18% score 9.0 or above — well ahead of the 16% global average across all 714 titles in our library.

The pattern is clear: revenge dramas work because the format removes everything slow. Within three episodes, the betrayal lands — a stolen inheritance, a framed murder, a family destroyed. By episode ten, the protagonist has stopped crying and started planning. By the finale, the reckoning arrives fast and precise.

What surprises us when looking at the data is how often revenge crosses into other genres. Nearly half of our revenge titles (84 of 173) also carry Romance or CEO/Billionaire tags. Rebirth and Time Travel shows up in 46 titles — the protagonist doesn't just plan revenge, they literally relive the past to get it right. And 43 revenge dramas double as Second Chance Romance, proving that the emotional core of revenge isn't anger — it's the desire to fix what was broken.

Our highest-rated picks: **His Partner, Her Revenge** (ReelShort, 9.5/10) layers corporate warfare with personal vendetta — the protagonist doesn't just destroy her betrayers, she builds something better from the wreckage. **The Sky's New Dawn** (GoodShort, 9.5/10) uses a time-skip structure to amplify the strategic payoff. **Angel's Masterpiece** (GoodShort, 9.4/10) stands out for its emotional depth — the revenge is personal, not just financial.

If you're new to the genre, start with these three. They show how far revenge short dramas have evolved from the straightforward "rich husband gets destroyed" formula of 2023.`
  },

  'ceo---billionaire': {
    slug: 'ceo---billionaire',
    intro: `**CEO and Billionaire short dramas are the single largest category on DramaDisco — 235 titles, one in every three dramas in our library.** Across ReelShort, GoodShort, ShortMax, FlexTV, and NetShort, no other genre comes close.

The appeal hasn't changed since the format emerged: power imbalance, hidden identity, and the fantasy of being chosen by someone untouchable. But the execution has matured considerably. GoodShort leads the category with 110 CEO titles (nearly half the genre), followed by ReelShort (49) and ShortMax (29).

The data reveals an interesting overlap: 57 of 235 CEO dramas also carry the Contract Marriage tag, and 30 also carry the Heir tag. These aren't separate audiences — they're the same viewers who can't get enough of power dynamics and hidden parentage. The best CEO titles stack multiple tropes into a single story, and the audience scores reflect it: 45 CEO dramas score 9.0 or above (19% of the genre), slightly above the 16% global average.

Our top picks demonstrate the genre's range: **Blood and Bones of the Disowned Daughter** (GoodShort, 9.5/10) combines CEO drama with hidden identity and family betrayal — the protagonist discovers she's the biological daughter of a billionaire, but the revelation comes too late to save her mother. **Perfect Landing into your Arms** (GoodShort, 9.5/10) merges CEO romance with second chance — two former lovers reunited in a corporate setting. **99 Forgiveness, One Goodbye** (ReelShort, 9.4/10) is the emotional heavyweight — a father-daughter story disguised as a CEO drama, and one of the most acclaimed titles in our entire library.

Platform differences matter. GoodShort's CEO catalog skews international with diverse casts. ShortMax's 29 titles lean into the "CEO in disguise" formula — the billionaire pretends to be poor to test his love interest. ReelShort's 49 titles tend toward higher production values and tighter writing.`
  },

  'werewolf---alpha': {
    slug: 'werewolf---alpha',
    intro: `**Werewolf and Alpha short dramas punch above their weight.** With 51 titles, it's one of the smaller genres on DramaDisco — but 22% of them score 9.0 or above, the highest elite ratio of any tag we've analyzed. The global average is 16%.

The genre's success is counterintuitive. Fantasy should struggle in a format defined by budget constraints. But werewolf dramas thrive on limitation — the pack hierarchy, the fated mate bond, the alpha's conflict between duty and desire. These constraints create narrative tension that realistic dramas struggle to match.

The tag data reveals what makes werewolf titles distinct. Hidden Identity appears in 21 of 51 werewolf dramas (41%) — the alpha hides his true nature. Fantasy/Superpower co-occurs in 19 titles. And Royal shows up in 19 — pack hierarchy maps cleanly onto royal court dynamics. The werewolf genre isn't really fantasy; it's power fantasy with fangs.

ReelShort dominates with 24 of 51 titles (47%), followed by ShortMax (11). GoodShort's 8 werewolf titles tend toward darker, more atmospheric storytelling.

Our editorial recommendation: **The Alpha Made His Savior the Pack's Slave** (ReelShort, 9.5/10) inverts the rejected-mate formula — the protagonist becomes the pack's strength after rejection, not its victim. **The Lycan's Savage Luna** (ReelShort, 9.4/10) delivers the most intense pack battle sequences in the genre. **Wolves at Her Back, Dragons at Her Side** (GoodShort, 9.3/10) stands out for its dual-supernatural-creature premise — rare in a genre that usually sticks to one mythology.`
  },

  'contract-marriage': {
    slug: 'contract-marriage',
    intro: `**Contract marriage is the most reliable formula in short drama history, and the data proves it.** Of 117 titles tracked on DramaDisco, the score distribution tells a clear story: 18 dramas score 9.0+ (the elite tier), 58 score between 7.5 and 8.9 (the solid middle), and 41 score below 7.5 (the ones that treat the premise as pure convenience).

The setup creates immediate conflict: two strangers, a legal document, zero emotional investment. Every interaction is charged — viewers know they'll fall in love, but the characters don't. The best titles in this genre (the 18 at 9.0+) use the contract as a metaphor for emotional walls, not just a plot device.

ShortMax leads with 33 contract marriage titles, followed by GoodShort (30) and ReelShort (27). The platform differences are notable: ShortMax's titles tend to raise the stakes — the contract often involves life-or-death scenarios. GoodShort's titles feature more diverse casts and international settings. ReelShort's 27 titles have the tightest writing and highest production values.

What stands out in the data: contract marriage rarely exists in isolation. The most common co-occurring tags are CEO/Billionaire, Hidden Identity, and Revenge — the contract is usually the entry point into a larger power struggle.

Our picks: **His Partner, Her Revenge** (ReelShort, 9.5/10) uses the contract to explore corporate rivalry — the two signers are business enemies before they're anything else. **Blood and Bones of the Disowned Daughter** (GoodShort, 9.5/10) layers hidden parentage onto the contract formula — the marriage reveals a family secret. **First Purchase: CEO Wife + God Mode** (ShortMax, 9.3/10) adds a supernatural twist that's genuinely original — the contract has consequences beyond the legal.`
  },

  'second-chance-romance': {
    slug: 'second-chance-romance',
    intro: `**Second chance romance is the genre that makes viewers cry in public.** With 143 titles on DramaDisco, it represents 20% of our library — and 20% of them score 9.0 or above, matching the genre's reputation for emotional impact.

The premise is simple: two people who loved each other, lost each other, and get one more chance. But the execution varies enormously. The tag data shows that second chance romance rarely travels alone — Romantic (the emotion tag) co-occurs in 76 of 143 titles (53%), Family/Cute Kids in 62 (43%), and CEO/Billionaire in 47 (33%). This isn't a standalone genre; it's an emotional amplifier that makes every other trope hit harder.

FlexTV dominates the category with 67 titles — nearly half the genre. ReelShort follows with 33, GoodShort with 25. FlexTV's second chance catalog tends toward longer episode counts and more complex relationship histories.

Revenge/Comeback appears as a co-tag in 43 second chance dramas — the protagonist doesn't just reunite with their lost love, they return transformed. Hidden Identity (41 titles) and Playing Dumb (29) suggest that deception and revelation are core to the second chance formula: the other person doesn't recognize who you've become.

Our recommendations: **The Sky's New Dawn** (GoodShort, 9.5/10) uses time-skip structure to explore regret and redemption — the protagonist literally has years to become someone worthy of a second chance. **The Alpha Made His Savior the Pack's Slave** (ReelShort, 9.5/10) combines second chance with werewolf lore — the rejected mate returns as the pack's savior. **Angel's Masterpiece** (GoodShort, 9.4/10) is the emotional standout — a second chance story where the stakes are life and death, not just love.`
  }
};

/**
 * Get SEO content for a tag by slug
 */
export function getTagSEOContent(slug: string): TagSEOContent | null {
  return TAG_SEO_CONTENT[slug] || null;
}
