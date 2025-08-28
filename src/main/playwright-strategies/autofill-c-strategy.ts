import { Page } from 'playwright-core';
import { IAutoFiller } from './IAutoFiller.js';
import type { AutoFillerContext } from './IAutoFiller.js';
import { checkPageReady, navigateToFillPage, prepareNewForm, openDatePicker, fillDate, submitAndCloseOldForm } from '../utils/playwright-utils.js';
import { mainCategoryMap, subCategoryMap } from '../config/categoryMap.js'

export class AutoFillerC implements IAutoFiller<[string, string, string, string, string][]> {
    private dataC: [string, string, string][] = [];//日期 產品 金額

    private executablePath!: string; // main 會初始化數值
    private isDev!: boolean; //main 會初始化數值
    private page!: Page;  // 後面會用 checkPageReady 函數來排除空白的情況。 所以使用非空斷言

    async initialize(context: AutoFillerContext): Promise<void> {
        const { executablePath, isDev, failedRows, page } = context;
        this.executablePath = executablePath;
        this.isDev = isDev;
        this.page = page!; // 假設 context.page 已經存在

    }

    public async startAutoFill(enrichedData: [string, string, string, string, string][]): 
    Promise<[string, string, string, string, string][]> {
        // 呼叫共用輔助函數 
        await checkPageReady(this.page)
        await navigateToFillPage(this.page);

        await this.page.waitForSelector('button[title="編輯不經優採成交金額(C)"]', { state: 'visible' });
        await this.page.locator('button[title="編輯不經優採成交金額(C)"]').click();


        for (const [date, product, cost, main, sub] of enrichedData) {
            try {
                await prepareNewForm(this.page)
                await openDatePicker(this.page)
                await fillDate(this.page, date)
                // 2. 等待並填入產品名稱
                await this.page.waitForSelector('input[name="goodsName"]', { state: 'visible' });
                await this.page.fill('input[name="goodsName"]', product);

                // 3.. 等待並填入採購金額
                await this.page.waitForSelector('input[name="amount"]', { state: 'visible' });
                await this.page.fill('input[name="amount"]', cost);

                // 4.選擇產品主類別的 select，並傳入 value
                // 先對照 main 文字找到對應 option 的 value (看你的 HTML 是 value="01", label="食品" 這種)
                const categoryMap = mainCategoryMap
                let valueToSelect: string = '16' //預設'其他'類別
                if (main in categoryMap) {
                    valueToSelect = categoryMap[main as keyof typeof categoryMap];
                    // 使用 valueToSelect
                } else {
                    console.log('main可能是未分類 或是什麼其他不在選項清單裡的主類別')
                }

                await this.page.selectOption('select[name="categoryParent"]', valueToSelect);

                // 5.選擇產品"子類別"的 select，並傳入 value
                // 先對照 main 文字找到對應 option 的 value (看你的 HTML 是 value="01", label="食品" 這種)
                const subcategoryMap = subCategoryMap


                let subValueToSelect: string = '16' //預設'其他'類別
                if (sub in subcategoryMap) {
                    subValueToSelect = subcategoryMap[sub as keyof typeof subcategoryMap];
                    // 使用 valueToSelect
                } else {
                    console.log('sub可能是未分類 或是什麼其他不在選項清單裡的次類別')
                }
                await this.page.waitForTimeout(1000); // set time out 沒有await 會沒效果

                await this.page.waitForSelector('select[name="categoryNo"]', { state: 'visible' });
                await this.page.selectOption('select[name="categoryNo"]', subValueToSelect);

                await submitAndCloseOldForm(this.page)

            } catch (error) {
                //this.failedRows!.push([date, product, cost])
                //console.log('failedRowsC 其中一次:', this.failedRows)
            }
        }
        console.log('start-auto-fillC handled, about to return failedrows, from autofill-a-strategy')
    return ([['failedrowscholder','failedrowscholder','failedrowscholder','failedrowscholder','failedrowscholder']])
    }
    /*
        //___ helper function
        public getFailedRows(): {
            console.log('hi')
            return this.failedRows;
        }
    
    */
}