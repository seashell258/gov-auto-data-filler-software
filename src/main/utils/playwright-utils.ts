// utils.ts
import { Page, Browser, chromium } from 'playwright-core';
import log from 'electron-log'; //打包後 debug 用的東西

// 現在的輔助函數有 initializeBrowserAndPage  checkPageReady  navigateToFillPage  prepareNewForm
// openDatePicker fillDate

class BrowserManager {
    private static browser: Browser | null = null;
    private static page: Page | null = null;

    static async initializeBrowserAndPage(executablePath: string, isDev: boolean): Promise<Page> {
        log.info(`Attempting to launch browser with initializebrowserandpage. the path is: ${executablePath}`);
        log.info(`Is development mode: ${isDev}`);

        // 如果已有 page 且還活著 → 直接回傳
        if (this.page && !this.page.isClosed()) { //有 page 只是 page 變數被指定了數值。 指向的 page 不一定還開著 
            log.info(`this page exist $$ page not closed, return exsisting page `);
            return this.page;

        }

        // 如果沒有 browser 或 browser 已經關掉 → 重開
        if (!this.browser) {
            log.info(`no existing page, launch a new browser `);
            this.browser = await chromium.launch({
                headless: false, // T 的話，瀏覽器不會有任何圖形介面，看不到畫面。 
                executablePath,
                args: ["--start-maximized"],

            });
        }

        // 開新 page
        this.page = await this.browser.newPage({ viewport: null });
        await this.page.goto("https://ptps.sfaa.gov.tw/portal/");
        await this.page.waitForSelector('input[name="account"]', { state: "visible" });

        // 登入（可以再抽出去 login() function）
        await this.page.fill('input[name="account"]', "392050700V");
        await this.page.fill('input[name="password"]', "!Amy590901");

        return this.page;
    }

    static async close() {

        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }

    static isAlive() {
        return this.page !== null && !this.page.isClosed();
    }
}

export default BrowserManager;


export async function resetPageToHome(page: Page) {
    try {
        await page.goto('https://ptps.sfaa.gov.tw/portal/home')
        console.log("每次更新資料前就回到首頁，不然填完模式 C 又連續填 A，可能會導致意外錯誤")
    } catch (error) {
        console.log('這次不是填完 A 又填 c 那種連續使用，所以 page 其實還沒在第三步的時候被打開，所以這邊讓 page 前往優採網首頁的步驟失敗了。/n error訊息:', error)
    }
    return
}
export async function checkDataAFormat(dataA: Array<[string, string, string]>): Promise<{ isValid: boolean; error?: string }> {
    for (const item of dataA) {
        if (!Array.isArray(item) || item.length !== 3) {
            return { isValid: false, error: '每行發票必須至少要有兩個逗號相隔出三筆資料 )' };
        }
    }
    return { isValid: true }
}

export async function checkDataBFormat(dataB: [string, string]): Promise<{ isValid: boolean; error?: string }> {
    if (!Array.isArray(dataB) || dataB.length !== 2) {
        return { isValid: false, error: '每行發票必須至少要有一個逗號，相隔出開始日期和截止日期 )' };
    }
    // 日期格式正則：7 位數字，前兩位是年，接兩位月，接兩位日 1140610
    const dateRegex = /^\d{7}$/;
    const [startDate, endDate] = dataB
    if (!dateRegex.test(startDate)) {
        return { isValid: false, error: `開始日期格式錯誤: ${startDate}` };
    }
    if (!dateRegex.test(endDate)) {
        return { isValid: false, error: `截止日期格式錯誤: ${endDate}` };
    }

    return { isValid: true }
}



export async function checkDataCFormat(dataC: Array<[string, string, string]>): Promise<{ isValid: boolean; error?: string }> {
    let totalProductNameLength = 0;
    for (const item of dataC) {
        if (!Array.isArray(item) || item.length !== 3) {
            return { isValid: false, error: '每行發票必須至少要有兩個逗號相隔出三筆資料 )' };
        }
        const [date, cost, productname] = item;
        if ([date, cost, productname].some(x => x.length > 13)) {
            totalProductNameLength += productname.length;
            return { isValid: false, error: '每個字串長度不能超過 13 個字' }

        }
    }
    if (totalProductNameLength > 700) {
        return { isValid: false, error: '所有 productname 字數加起來總長度不能超過 700 個字' };
    }
    return { isValid: true }
}


// 確認網頁有開的共用函數
export async function checkPageReady(page: Page): Promise<string> {
    if (!page) {
        throw new Error('沒偵測到打開的 chromium 網頁，無法自動填表');
    }
    return "checkd: page ready "
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

export async function reloadPage(page: Page) {
    try { //避免前輪的操作影響到這次操作
        await page.reload({ timeout: 5000 }); // 最多等5秒 //超過五秒的話下面那行 log 也不會顯示
        console.log("Page reloaded to prepare page to press「新增」 按鈕");
    } catch (err) {
        console.error("Reload 失敗:", err);
        return; // 提早退出，避免後面繼續報錯
    }
    return
}
export async function prepareNewForm(page: Page) {

    await reloadPage(page) // 避免前一次失敗，會殘留未完成的表單在畫面上導致按不到下一輪的新增
    await page.waitForSelector('button[title="新增"]', { state: 'visible' });
    await page.getByText('新增').click();
    console.log("按下新增清單按鈕");
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
    console.log('當前月份:', currentMonth, 'from fn-fillDate');
    // 計算月差
    const monthDiff = Number(month) - currentMonth
    console.log('月份差:', monthDiff, 'from fn-fillDate');
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

