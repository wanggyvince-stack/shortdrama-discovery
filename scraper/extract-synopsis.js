// RS Boost extraction v8 - New tab detection + search + detail extraction
// The detail page opens in a NEW TAB when card is clicked
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const TITLES_FILE = path.join(__dirname, 'reelshort-titles.json');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progress-v8.json');
const RESULTS_FILE = path.join(OUTPUT_DIR, 'rs-boost-links.json');

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')); }
  catch { return { completed: [], results: [] }; }
}
function saveProgress(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

(async () => {
  console.log('🚀 RS Boost extraction v8 (new tab detection)');
  const targetTitles = JSON.parse(fs.readFileSync(TITLES_FILE, 'utf-8'));
  console.log(`📋 ${targetTitles.length} dramas to process`);

  const progress = loadProgress();
  console.log(`📌 Resuming: ${progress.completed.length} done`);

  const context = await chromium.launchPersistentContext(
    path.join(__dirname, '.auth'),
    {
      channel: 'chrome',
      headless: false,
      viewport: { width: 1400, height: 900 },
      args: ['--disable-blink-features=AutomationControlled'],
    }
  );
  const page = context.pages()[0] || await context.newPage();

  // Navigate
  console.log('📍 Navigating...');
  await page.goto('https://cps.reelshort.com/resource-square', {
    waitUntil: 'networkidle', timeout: 30000,
  });
  await page.waitForTimeout(2000);
  try {
    const tab = page.locator('button:has-text("短剧")');
    if (await tab.isVisible({ timeout: 5000 })) await tab.click();
    await page.waitForTimeout(2000);
  } catch (e) {}
  console.log('✅ Ready');

  const results = progress.results || [];
  const completed = new Set(progress.completed || []);

  for (let i = 0; i < targetTitles.length; i++) {
    const title = targetTitles[i];
    if (completed.has(title)) {
      console.log(`[${i + 1}/${targetTitles.length}] "${title}" ⏭️ Done`);
      continue;
    }

    console.log(`\n[${i + 1}/${targetTitles.length}] "${title}"`);

    // --- Step 1: Search ---
    try {
      const searchSelector = 'input[placeholder*="搜索"], input[placeholder*="名字"]';
      await page.waitForSelector(searchSelector, { timeout: 5000 });
      const searchInput = page.locator(searchSelector).first();
      await searchInput.click();
      await searchInput.fill('');
      await page.waitForTimeout(200);
      await searchInput.fill(title);
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log(`  ⚠️ Search error: ${e.message}`);
      continue;
    }

    // Count cards
    const cards = page.locator('div[class*="cursor-pointer"][class*="aspect-"]');
    let cardCount = await cards.count();
    console.log(`  🔍 ${cardCount} card(s)`);

    if (cardCount === 0) {
      const partial = title.substring(0, 15);
      console.log(`  Trying partial: "${partial}"...`);
      await page.locator('input[placeholder*="搜索"], input[placeholder*="名字"]').first().fill(partial);
      await page.waitForTimeout(3000);
      cardCount = await cards.count();
      console.log(`  Partial: ${cardCount} card(s)`);
      if (cardCount === 0) {
        console.log(`  ❌ Not found`);
        results.push({ title, status: 'not_found' });
        completed.add(title);
        saveProgress({ completed: [...completed], results });
        continue;
      }
    }

    // --- Step 2: Get card info ---
    const cardData = await cards.first().evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const img = el.querySelector('img');
      const titleEl = el.querySelector('[class*="line-clamp"]');
      
      const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
      let bookId = null, cardTitle = '';
      
      if (fiberKey) {
        let current = el[fiberKey];
        for (let d = 0; d < 15 && current; d++) {
          const props = current.memoizedProps || current.pendingProps;
          if (props?.data?.id) {
            bookId = props.data.id;
            cardTitle = props.data.title || '';
            break;
          }
          current = current.return;
        }
      }
      
      return {
        x: rect.x + rect.width / 2, y: rect.y + rect.height / 2,
        bookId, cardTitle: cardTitle || img?.alt || titleEl?.textContent || '',
      };
    });

    console.log(`  📖 "${cardData.cardTitle}" (id: ${cardData.bookId})`);

    // --- Step 3: Set up new tab listener ---
    let newPage = null;
    const pagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);
    
    // Also monitor APIs on main page
    const mainApis = [];
    const mainApiHandler = async (response) => {
      const url = response.url();
      if (url.includes('/api/') &&
          !url.includes('all-book') && !url.includes('recommend-column') &&
          !url.includes('getUserInfo') && !url.includes('social_media')) {
        try {
          const data = await response.json();
          mainApis.push({ url, data });
        } catch (e) {}
      }
    };
    page.on('response', mainApiHandler);

    // --- Step 4: Click card (try multiple methods) ---
    console.log(`  🖱️ Clicking...`);
    
    // Method 1: React fiber onClick (bypasses browser events)
    const reactClicked = await cards.first().evaluate((el) => {
      const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
      if (fiberKey) {
        let current = el[fiberKey];
        for (let d = 0; d < 15 && current; d++) {
          const props = current.memoizedProps || current.pendingProps;
          if (typeof props?.onClick === 'function') {
            props.onClick({ preventDefault: () => {}, stopPropagation: () => {} });
            return 'react-fiber';
          }
          current = current.return;
        }
      }
      return null;
    });
    console.log(`  React click: ${reactClicked || 'none'}`);

    // Wait for new tab
    newPage = await pagePromise;

    if (newPage) {
      console.log(`  🆕 NEW TAB OPENED!`);
      await newPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await newPage.waitForTimeout(2000);
      
      const detailUrl = newPage.url();
      console.log(`  🌐 Detail URL: ${detailUrl}`);
      
      // Extract detail page content
      const detailData = await newPage.evaluate(() => {
        const text = document.body.innerText;
        const hasPromotion = text.includes('推广链接') || text.includes('App推广') || text.includes('复制链接') || text.includes('口令');
        
        const inputs = [];
        document.querySelectorAll('input, textarea').forEach(el => {
          if (el.value && el.value.length > 5) {
            inputs.push({ placeholder: el.placeholder || '', value: el.value });
          }
        });

        // Look for copy buttons and their associated data
        const links = [];
        document.querySelectorAll('button, [role="button"]').forEach(el => {
          const t = el.textContent || '';
          if (t.includes('复制') || t.includes('Copy')) {
            links.push({ text: t, nearbyText: el.parentElement?.textContent?.substring(0, 200) || '' });
          }
        });

        return { hasPromotion, pageText: text.substring(0, 1000), inputs, links };
      });
      
      console.log(`  📝 Promotion: ${detailData.hasPromotion}`);
      if (detailData.inputs.length > 0) {
        console.log(`  📋 Inputs: ${JSON.stringify(detailData.inputs)}`);
      }
      if (detailData.links.length > 0) {
        console.log(`  🔗 Links: ${JSON.stringify(detailData.links)}`);
      }

      // Also intercept APIs on the new tab
      const detailApis = [];
      newPage.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/')) {
          try {
            const data = await response.json();
            detailApis.push({ url, data });
          } catch (e) {}
        }
      });

      // Screenshot
      await newPage.screenshot({
        path: path.join(OUTPUT_DIR, `detail-${String(i + 1).padStart(3, '0')}.png`),
        fullPage: true,
      });
      console.log(`  📸 Screenshot saved`);

      // Save result
      results.push({
        title,
        bookId: cardData.bookId,
        cardTitle: cardData.cardTitle,
        detailUrl,
        hasPromotion: detailData.hasPromotion,
        detailInputs: detailData.inputs,
        detailLinks: detailData.links,
        detailApis: detailApis,
        pageText: detailData.pageText,
      });

      // Close new tab
      await newPage.close();
      console.log(`  ✅ Tab closed`);
    } else {
      console.log(`  ⚠️ No new tab opened`);
      
      // Check if main page APIs have detail info
      if (mainApis.length > 0) {
        console.log(`  🌐 APIs from main page: ${mainApis.length}`);
        for (const api of mainApis) {
          console.log(`     ${api.url} → ${JSON.stringify(api.data).substring(0, 200)}`);
        }
      }
      
      // Screenshot main page
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `detail-${String(i + 1).padStart(3, '0')}.png`),
        fullPage: true,
      });
      
      results.push({
        title,
        bookId: cardData.bookId,
        cardTitle: cardData.cardTitle,
        detailUrl: null,
        hasPromotion: false,
        mainApis,
      });
    }

    page.off('response', mainApiHandler);
    completed.add(title);

    if (completed.size % 5 === 0) {
      saveProgress({ completed: [...completed], results });
      console.log(`  💾 Progress (${completed.size}/${targetTitles.length})`);
    }

    // Navigate back to main page (in case it changed)
    await page.bringToFront();
    await page.goto('https://cps.reelshort.com/resource-square', {
      waitUntil: 'networkidle', timeout: 30000,
    });
    await page.waitForTimeout(2000);
    try {
      const tab = page.locator('button:has-text("短剧")');
      if (await tab.isVisible({ timeout: 5000 })) await tab.click();
      await page.waitForTimeout(2000);
    } catch (e) {}

    if (completed.size % 10 === 0) {
      await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      try {
        const tab = page.locator('button:has-text("短剧")');
        if (await tab.isVisible({ timeout: 5000 })) await tab.click();
        await page.waitForTimeout(2000);
      } catch (e) {}
    }
  }

  // Final save
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  saveProgress({ completed: [...completed], results });

  const found = results.filter(r => r.hasPromotion);
  const noPromotion = results.filter(r => r.detailUrl && !r.hasPromotion);
  const notFound = results.filter(r => r.status === 'not_found');
  console.log(`\n📊 SUMMARY`);
  console.log(`✅ Found promotion links: ${found.length}`);
  console.log(`⚠️ Tab opened but no links: ${noPromotion.length}`);
  console.log(`❌ Not found: ${notFound.length}`);
  console.log(`📋 Total: ${results.length}/${targetTitles.length}`);

  await context.close();
})().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
