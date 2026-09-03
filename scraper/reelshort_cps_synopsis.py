"""
ReelShort CPS Synopsis 抓取脚本
使用 playwright + 真实 Chrome（channel: 'chrome'）
"""

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

# 配置
AUTH_DIR = Path(__file__).parent / ".auth"
TITLES_FILE = Path(__file__).parent / "data" / "reelshort-titles.json"
RESULTS_FILE = Path(__file__).parent / "data" / "rs-synopsis-results.json"

async def main():
    print("🚀 ReelShort CPS Synopsis 抓取")
    
    # 加载要抓取的剧名列表
    if not TITLES_FILE.exists():
        print(f"❌ 找不到 {TITLES_FILE}")
        print("请先创建剧名列表文件")
        return
    
    titles = json.loads(TITLES_FILE.read_text())
    print(f"📋 {len(titles)} 部剧待抓取")
    
    # 使用 playwright 启动真实 Chrome
    async with async_playwright() as p:
        # 关键：channel: 'chrome' 使用系统安装的真实 Chrome
        context = await p.chromium.launch_persistent_context(
            str(AUTH_DIR),
            channel="chrome",
            headless=False,
            viewport={"width": 1400, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        
        page = context.pages[0] if context.pages else await context.new_page()
        
        # 访问页面
        print("\n📍 访问 https://cps.reelshort.com/resource-square")
        await page.goto("https://cps.reelshort.com/resource-square", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        
        # 检查是否需要登录
        current_url = page.url
        if "login" in current_url.lower():
            print("\n⚠️  需要登录")
            print("请在浏览器中完成 Google 登录...")
            print("登录成功后脚本会自动继续\n")
            await page.wait_for_url("**/resource-square**", timeout=300000)  # 5 分钟超时
            print("✅ 登录成功！")
            await page.wait_for_timeout(2000)
        
        # 点击"短剧"标签
        print("\n🎬 点击'短剧'标签...")
        try:
            tab = page.locator('button:has-text("短剧")')
            if await tab.is_visible(timeout=5000):
                await tab.click()
                await page.wait_for_timeout(2000)
                print("✅ 点击成功")
        except Exception as e:
            print(f"⚠️  未找到'短剧'标签: {e}")
        
        print("\n✅ 准备就绪，开始抓取 synopsis\n")
        
        results = []
        
        for i, title in enumerate(titles):
            print(f"\n[{i+1}/{len(titles)}] {title}")
            
            # 搜索
            try:
                search_input = page.locator('input[placeholder*="搜索"], input[placeholder*="名字"]').first
                await search_input.click()
                await search_input.fill("")
                await page.wait_for_timeout(200)
                await search_input.fill(title)
                await page.wait_for_timeout(3000)
            except Exception as e:
                print(f"  ⚠️ 搜索失败: {e}")
                results.append({"title": title, "status": "search_failed"})
                continue
            
            # 查找剧集卡片
            cards = page.locator('div[class*="cursor-pointer"][class*="aspect-"]')
            card_count = await cards.count()
            
            if card_count == 0:
                # 尝试用部分标题
                partial = title[:15]
                print(f"  🔄 尝试部分标题: {partial}")
                await search_input.fill(partial)
                await page.wait_for_timeout(3000)
                card_count = await cards.count()
                
                if card_count == 0:
                    print(f"  ❌ 未找到")
                    results.append({"title": title, "status": "not_found"})
                    continue
            
            print(f"  🔍 找到 {card_count} 个结果")
            
            # 点击第一个卡片
            try:
                await cards.first.click()
                await page.wait_for_timeout(3000)
                
                # 尝试抓取 synopsis
                synopsis_selectors = [
                    "[class*='synopsis']",
                    "[class*='description']",
                    "[class*='intro']",
                    "[class*='detail']",
                ]
                
                synopsis = None
                for selector in synopsis_selectors:
                    try:
                        elem = page.locator(selector).first
                        if await elem.is_visible(timeout=2000):
                            text = await elem.text_content()
                            if text and len(text) > 50:
                                synopsis = text.strip()
                                print(f"  ✅ Synopsis: {synopsis[:100]}...")
                                break
                    except:
                        continue
                
                if not synopsis:
                    print(f"  ⚠️ 未抓取到 synopsis")
                
                results.append({
                    "title": title,
                    "status": "success" if synopsis else "no_synopsis",
                    "synopsis": synopsis,
                })
                
                # 返回上一页
                await page.go_back()
                await page.wait_for_timeout(2000)
                
            except Exception as e:
                print(f"  ⚠️ 点击/抓取失败: {e}")
                results.append({"title": title, "status": "click_failed"})
        
        # 保存结果
        print(f"\n\n📊 抓取完成")
        print(f"  总计: {len(titles)}")
        print(f"  成功: {sum(1 for r in results if r['status'] == 'success')}")
        print(f"  失败: {sum(1 for r in results if r['status'] != 'success')}")
        
        RESULTS_FILE.write_text(json.dumps(results, ensure_ascii=False, indent=2))
        print(f"\n💾 结果已保存到 {RESULTS_FILE}")
        
        await context.close()


if __name__ == "__main__":
    asyncio.run(main())
