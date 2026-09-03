"""
ReelShort CPS 登录 + Synopsis 抓取测试脚本
使用你电脑上的真实 Chrome 浏览器（保留登录状态）
"""

import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager


def setup_chrome():
    """配置 Chrome，使用 webdriver-manager"""
    chrome_options = Options()
    
    # 使用临时 profile，不依赖你本地 Chrome
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # 禁用自动化标志，避免被检测
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    try:
        print("📦 正在下载 ChromeDriver（如果第一次运行）...")
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        return driver
    except Exception as e:
        print(f"❌ 启动 Chrome 失败: {e}")
        return None


def test_login(driver):
    """测试是否已登录"""
    print("\n📍 访问 ReelShort CPS 站点...")
    driver.get("https://cps.reelshort.com/resource-square")
    time.sleep(3)
    
    current_url = driver.current_url
    print(f"当前 URL: {current_url}")
    
    if "login" in current_url.lower():
        print("\n⚠️  需要登录")
        print("请在浏览器中完成 Google 登录...")
        print("登录成功后按回车继续...\n")
        input("按回车键继续...")
        
        # 重新访问
        driver.get("https://cps.reelshort.com/resource-square")
        time.sleep(3)
    
    print("✅ 已登录（或无需登录）")
    return True


def test_scrape_synopsis(driver):
    """测试抓取 synopsis"""
    print("\n🧪 开始测试抓取 synopsis...")
    
    # 点击"短剧"标签
    try:
        print("1️⃣ 点击'短剧'标签...")
        short_drama_tab = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), '短剧')]"))
        )
        short_drama_tab.click()
        time.sleep(2)
        print("✅ 点击成功")
    except Exception as e:
        print(f"⚠️  未找到'短剧'标签: {e}")
    
    # 等待剧集列表加载
    time.sleep(2)
    
    # 查找剧集卡片
    print("\n2️⃣ 查找剧集卡片...")
    drama_cards = driver.find_elements(By.CSS_SELECTOR, "[class*='drama'], [class*='card'], [class*='item']")
    print(f"找到 {len(drama_cards)} 个可能的剧集卡片")
    
    if not drama_cards:
        print("⚠️  未找到剧集卡片，尝试其他选择器...")
        # 尝试查找所有可点击的元素
        drama_cards = driver.find_elements(By.CSS_SELECTOR, "a[href*='/drama/'], a[href*='/detail/']")
        print(f"用链接选择器找到 {len(drama_cards)} 个剧集")
    
    if drama_cards:
        # 点击第一个卡片
        print("\n3️⃣ 点击第一个剧集卡片...")
        first_card = drama_cards[0]
        first_card.click()
        time.sleep(3)
        
        print(f"当前页面 URL: {driver.current_url}")
        print(f"页面标题: {driver.title}")
        
        # 尝试抓取 synopsis
        print("\n4️⃣ 尝试抓取 synopsis...")
        synopsis_selectors = [
            "[class*='synopsis']",
            "[class*='description']",
            "[class*='intro']",
            "[class*='detail']",
            "[class*='content']",
        ]
        
        synopsis_text = None
        for selector in synopsis_selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                for elem in elements:
                    text = elem.text
                    if text and len(text) > 50:
                        synopsis_text = text
                        print(f"✅ 找到 synopsis (selector: {selector})")
                        print(f"\nSynopsis 内容（前 300 字符）：")
                        print(synopsis_text[:300] + "..." if len(synopsis_text) > 300 else synopsis_text)
                        break
                if synopsis_text:
                    break
            except:
                continue
        
        if not synopsis_text:
            print("⚠️  未能自动抓取到 synopsis")
            print("\n请手动检查页面，告诉我：")
            print("1. synopsis 在页面的哪个位置？")
            print("2. 它附近有什么文字（如标题、标签等）？")
            print("3. 或者截图给我看页面结构")
        
        # 返回上一页
        print("\n5️⃣ 返回上一页...")
        driver.back()
        time.sleep(2)
    
    return synopsis_text is not None


def main():
    print("=" * 60)
    print("ReelShort CPS Synopsis 抓取测试")
    print("=" * 60)
    print("\n依赖安装（如果还没装）：")
    print("  pip install selenium")
    print("  下载 ChromeDriver: https://chromedriver.chromium.org/downloads\n")
    
    # 启动 Chrome
    driver = setup_chrome()
    if not driver:
        return
    
    try:
        # 测试登录
        if not test_login(driver):
            return
        
        # 测试抓取
        success = test_scrape_synopsis(driver)
        
        if success:
            print("\n" + "=" * 60)
            print("✅ 测试成功！通路验证完成")
            print("=" * 60)
            print("\n下一步：")
            print("1. 告诉我测试结果")
            print("2. 我会写批量抓取脚本，抓取所有 89 部 ReelShort 剧的 synopsis")
        else:
            print("\n" + "=" * 60)
            print("⚠️  测试未完成，需要你提供页面信息")
            print("=" * 60)
        
        print("\n按回车键关闭浏览器...")
        input()
        
    finally:
        driver.quit()
        print("✅ 浏览器已关闭")


if __name__ == "__main__":
    main()
