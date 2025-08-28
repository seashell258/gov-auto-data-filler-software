// AutoFillerA.ts
import { Page } from 'playwright-core';
import { AutoFillerContext, IAutoFiller } from './IAutoFiller.js';
import { initializeBrowserAndPage, checkPageReady, navigateToFillPage, prepareNewForm, openDatePicker, fillDate, submitAndCloseOldForm } from '../utils/playwright-utils.js';
import path from 'path';
import { app } from 'electron';
import { scrapeAndGroupData } from '../BDataScraper.js';



export class AutoFillerB implements IAutoFiller<Record<string, [string, string, string][]>> {
    private executablePath!: string;
    private isDev!: boolean;
    private page!: Page;  // 後面會用 checkPageReady 函數來排除空白的情況。 所以使用非空斷言

    async initialize(context: AutoFillerContext): Promise<void> {
        const { executablePath, isDev, page } = context;
        this.executablePath = executablePath;
        this.isDev = isDev;
        this.page = page!; // 假設 context.page 已經存在
    }

    private failedRows: string[] = [];//日期 金額 統一編號

    public async Bdatascapper(startDate:string, enDate:string):
        Promise<Record<string, [string, string, string][]>> {
            const groupedBDatas = await scrapeAndGroupData(this.page,startDate,enDate)
        return groupedBDatas
        }

    public async startAutoFill(groupedBDatas: Record<string, [string, string, string][]>):
        Promise<string[]> {
        // 呼叫輔助函數來啟動瀏覽器和頁面  //但我感覺應該是main 呼叫這個函數一次就好 aBc三策略不用

        // 呼叫共用輔助函數 
        await checkPageReady(this.page)
        await navigateToFillPage(this.page);

        await this.page.waitForSelector('button[title="編輯經公告/議價未成交金額(B)"]', { state: 'visible' });
        await this.page.locator('button[title="編輯經公告/議價未成交金額(B)"]').click();


        for (const [key, value] of Object.entries(groupedBDatas)) { //一個表單統一填完日期 key 後，value 是同一日期的多筆資料，放在同一個表單一起送出
            try {
                await prepareNewForm(this.page)
                await openDatePicker(this.page)
                await fillDate(this.page, key)

                const button = this.page.locator('div.form-inline:has(input[name="factoryName"]) >> button[title="選擇"]');
                await button.click();

                //2.等待廠商搜尋輸入框出現，輸入統編
                await this.page.waitForSelector('input[name="searchFactoryName"]', { state: 'visible' });
                await this.page.fill('input[name="searchFactoryName"]', 'A9999990');

                // 等待「查詢」按鈕出現並點擊
                // 跟"選擇"一樣，也是有兩個查詢 所以要用 nth1 表示第二個。 
                await this.page.locator('button:has-text("查詢")').nth(1).waitFor({ state: 'visible' });
                await this.page.locator('button:has-text("查詢")').nth(1).click();

                await this.page.locator('button:has-text("已公告但無廠商投標")').waitFor({ state: 'visible' });
                await this.page.locator('button:has-text("已公告但無廠商投標")').click();

                await this.page.locator('select[name="goodsNo"]').selectOption('A99999900001');

                //每一個不同的 key ( 日期 ) 都會有專屬於自己的，三個資料處理後的結果
                let caseJoinString: string = ''   //填寫佐證說明用的
                let caseGroupedList: string[] = [] //上傳pdf，指定pdf檔名用的。
                let costSum: number = 0
                // for迴圈用 in 取得 index 用 for遍歷內容
                for (let item of value) {  // item EX :[R20250613030,1140505,2880 ]  
                    let caseNumber: string = item[0]
                    let cost: string = item[2]
                    costSum += Number(cost.replace(/,/g, ''))   //2,880 變成2880 才能變成 number
                    // 串接 caseNumber 字串到 caseJoinString，且中間加空格
                    if (caseJoinString.length === 0) {
                        caseJoinString = caseNumber;
                    } else {
                        caseJoinString += ' ' + caseNumber;
                    }

                    // 同時把 caseNumber 放入 caseGroupedList
                    caseGroupedList.push(caseNumber);
                }

                console.log('costSum:', costSum);
                console.log('caseJoinString:', caseJoinString);
                console.log('caseGroupedList:', caseGroupedList);

                // 3.等待輸入框可見後填入金額
                await this.page.locator('input[name="amount"]').waitFor({ state: 'visible' });
                await this.page.locator('input[name="amount"]').fill(String(costSum));

                //4. 填寫採購說明
                await this.page.waitForSelector('textarea[title="佐證說明"]', { state: 'visible' });
                await this.page.locator('textarea[title="佐證說明"]').fill(`已於優先採購網路資訊平台/採購公告專區刊登公告，惟本採購案經優採平台公告，仍無廠商投標之情形，公告案號${caseJoinString}，公告截圖如附件。`);

                // 假設 caseGroupedList 長度是 6
                const n = caseGroupedList.length;

                // 點加號 n - 1 次
                for (let i = 0; i < n - 1; i++) {
                    // 點擊新增按鈕（用 class 選擇器）
                    await this.page.locator('div.add.btn-add-01').click();
                }

                // 逐筆填資料
                let pdfPath: string
                for (let i = 0; i < n; i++) {
                    // 找到 input[type="file"]，直接設定要上傳的檔案路徑 
                    if (this.isDev) {
                        pdfPath = path.join(
                            __dirname,  //原本在dist/main/playwtight-strategies
                            '..',  //到達main
                            '..',  //到達dist
                            ',,', //到達根目錄
                            `${caseGroupedList[i]}.pdf`
                        );
                        console.log('dirname', __dirname)
                    }
                    else {
                        pdfPath = path.join(
                            app.getAppPath(),
                            '..', // 往上一層
                            '..', // 再上一層
                            '..',
                            `${caseGroupedList[i]}.pdf` // 組出完整檔名
                        )

                    }
                    console.log(pdfPath)
                    await this.page.locator('input[type="file"]').nth(i).setInputFiles(pdfPath);
                }

            } catch (error) {
                this.failedRows.push(key) // failedrows 是日期列表。 因為三筆資料可能就是填一次表單
                throw Error
            }
            await submitAndCloseOldForm(this.page)
        }
        return (this.failedRows)
    }


}