// utils.ts
import { Page, Browser, chromium } from 'playwright-core';

// 現在的輔助函數有 initializeBrowserAndPage  checkPageReady  navigateToFillPage  prepareNewForm
// openDatePicker fillDate


// 啟動瀏覽器並導航的函數
export async function initializeBrowserAndPage(executablePath: string, isDev: boolean): Promise<Page> {
    const browser = await chromium.launch({
        headless: !isDev,
        executablePath,
        args: ['--start-maximized'],
    });
    const page = await browser.newPage({ viewport: null });
    await page.goto('https://ptps.sfaa.gov.tw/portal/');
    await page.waitForSelector('input[name="account"]', { state: 'visible' });
    await page.fill('input[name="account"]', '392050700V');
    await page.fill('input[name="password"]', '!Amy590901');
    return page ;

}

// 確認網頁有開的共用函數
export async function checkPageReady(page: Page): Promise<void> {
    if (!page) {
        throw new Error('沒偵測到打開的 chromium 網頁，無法自動填表');
    }
}

// 導航到填報頁面的共用函數
export async function navigateToFillPage(page: Page): Promise<void> {
    await page.locator('a.list-group-item', { hasText: '義務採購填報管理' }).click();
    await page.waitForSelector('a.menu-list >> text=義務採購資料填報', { state: 'visible' });
    await page.locator('a.menu-list', { hasText: '義務採購資料填報' }).first().click();

    // 等待「a[title="編輯"]」出現且可見再點
    await page.waitForSelector('a[title="編輯"]', { state: 'visible' });
    await page.locator('a[title="編輯"]').click();
}


export async function prepareNewForm(page: Page) {
    await page.reload(); // 避免前一次失敗，會殘留未完成的表單在畫面上導致按不到下一輪的新增
    await page.waitForSelector('button[title="新增"]', { state: 'visible' });
    await page.locator('button[title="新增"]').click();
}


export async function openDatePicker(page: Page) {
    // 等待並填入採購日期
    await page.waitForSelector('input[name="purchaseDate"]', { state: 'visible' });
    // 點擊輸入欄位以打開日期選單
    await page.click('input[name="purchaseDate"]');
    await page.waitForTimeout(300); // 小緩衝，讓動畫跑完  不知道為什麼有出現過日曆打開一下但又快速關掉的狀況
}

// 填寫日期的共用函數
export async function fillDate(page: Page, date: string): Promise<void> {

    const rocYear = Number(date.slice(0, 3)); // 114
    const month = Number(date.slice(3, 5));   // 05
    const day = Number(date.slice(5, 7));     // 06

    const year = rocYear + 1911; // 民國轉西元

    console.log('trying to press the date picker')

    // 1.1選擇對應西元年 ( 可能可以省略，因為今年幾年就只能填當年的資料 113年12月的資料都不能填。 ) 
    // 這邊page後面用 ! 表示非null斷言。 因為上面已經執行過 page的檢查了。 () 
    await page!.waitForSelector('.react-datepicker__year-select', { state: 'visible' });
    await page!.selectOption('.react-datepicker__year-select', String(year));

    // 1.2 選月份
    const now = new Date();
    const currentMonth = now.getMonth() + 1;  // getMonth() 回傳 0~11 ，加1才是實際月份
    console.log('當前月份:', currentMonth,'from fn-fillDate');
    // 計算月差
    const monthDiff = Number(month) - currentMonth
    console.log('月份差:', monthDiff,'from fn-fillDate');
    // 根據差額點按鈕
    const direction = monthDiff > 0 ? 'next' : 'previous';
    const buttonSelector = direction === 'next'
        ? '.react-datepicker__navigation--next'
        : '.react-datepicker__navigation--previous';

    for (let i = 0; i < Math.abs(monthDiff); i++) {
        await page.click(buttonSelector);
        await page.waitForTimeout(300); // 等待日曆動畫與重新渲染
    }
    //  點選特定日，例如 5 號
    // 補零成3位數字字串（React Datepicker class用）
    const dayStr = day.toString().padStart(3, '0'); // 5 -> "005", 11 -> "011", 23 -> "023"

    // 用 class + 內文文字篩選對應日期節點
    // 注意 aria-disabled="false" 表示可點擊的日期
    const daySelector = `div.react-datepicker__day--${dayStr}[aria-disabled="false"]:not(.react-datepicker__day--outside-month)`;

    // 等待該日期元素出現並點擊
    await page.waitForSelector(daySelector, { state: 'visible' });
    await page.click(daySelector);

}

export async function submitAndCloseOldForm(page: Page) {
    // 送出表單
    await page.waitForSelector('button[title="儲存"]', { state: 'visible' });
    await page.locator('button[title="儲存"]').click();
    // 新增表單成功，點選關閉
    await page.waitForSelector('button.btn.bg-grey.btn-lg.waves-effect.btn.btn-primary', { state: 'visible' });
    await page.click('button.btn.bg-grey.btn-lg.waves-effect.btn.btn-primary');
}

