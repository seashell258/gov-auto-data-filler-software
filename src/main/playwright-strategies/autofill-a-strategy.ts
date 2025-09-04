// AutoFillerA.ts
import { Page } from 'playwright-core';
import { AutoFillerContext, IAutoFiller } from './IAutoFiller.js';
import { checkPageReady, navigateToFillPage, prepareNewForm, openDatePicker, fillDate, submitAndCloseOldForm, reloadPage }
  from '../utils/playwright-utils.js';


export class AutoFillerA implements IAutoFiller<[string, string, string][]> {
  private executablePath!: string;
  private isDev!: boolean;
  private page!: Page;  // 後面會用 checkPageReady 函數來排除空白的情況。 所以使用非空斷言

  async initialize(context: AutoFillerContext): Promise<void> {
    const { executablePath, isDev, page } = context;
    this.executablePath = executablePath;
    this.isDev = isDev;
    this.page = page!; // 假設 context.page 已經存在
  }

  private failedRows: [string, string, string][] = [];//日期 金額 統一編號


  //日期 金額 統一編號
  public async startAutoFill(dataA: [string, string, string][]): Promise<[string, string, string][]> {
    this.failedRows = [];
    // 呼叫共用輔助函數 
    await checkPageReady(this.page)
    // 避免前一次失敗，會殘留未完成的表單在畫面上導致按不到下一輪的新增
    await reloadPage(this.page)

    await navigateToFillPage(this.page);

    // 等待「button[title="編輯身障團體成交金額(A)"]」出現且可見再點
    await this.page.waitForSelector('button[title="編輯身障團體成交金額(A)"]', { state: 'visible' });
    await this.page.locator('button[title="編輯身障團體成交金額(A)"]').click();

    for (const [date, num, factory] of dataA) {
      try {

        await prepareNewForm(this.page)
        await openDatePicker(this.page)
        await fillDate(this.page, date)

        // 接下來處理屬於填表 A 的獨特邏輯
        // 等待並填入採購金額
        await this.page.waitForSelector('input[name="amount"]', { state: 'visible' });
        await this.page.fill('input[name="amount"]', num);

        // 3. 按下「選擇...」按鈕
        // 程式一直點不到 發現原因是因為有兩個"選擇" 它只會預設點第一個，也不告訴妳其實它找到兩個，所以就一直點不到
        // await page.waitForSelector('button[title="選擇"]', { state: 'visible' }); 
        // await page.click('button[title="選擇"]') 

        // 用下面這個來除錯
        // const el = page.locator('button[title="選擇"]');
        // const html = await el.evaluate(node => node.outerHTML);

        // 點旁邊的那一個 button ( 更精確 ) ( 這邊的狀況是父結構裡面有兩個子元素 button 跟 factoryname)  
        const button = this.page.locator('div.form-inline:has(input[name="factoryName"]) >> button[title="選擇"]');
        await button.click();

        // 4. 等待廠商搜尋輸入框出現，輸入統編
        await this.page.waitForSelector('input[name="searchFactoryName"]', { state: 'visible' });
        await this.page.fill('input[name="searchFactoryName"]', factory);

        // 5. 等待「查詢」按鈕出現並點擊
        // 跟"選擇"一樣，也是有兩個查詢 所以要用 nth1 表示第二個。 
        await this.page.locator('button:has-text("查詢")').nth(1).waitFor({ state: 'visible' });
        await this.page.locator('button:has-text("查詢")').nth(1).click();

        // 6. 等待「符合統編」的按鈕出現並點擊
        await this.page.waitForSelector(`button:has-text("${factory}")`, { state: 'visible' });
        await this.page.click(`button:has-text("${factory}")`);

        // 7.程式暫停 讓使用者自己選 
        await this.page.waitForFunction(() => {
          const select = document.querySelector('select[name="goodsNo"]') as HTMLSelectElement | null;; //加上型別斷言 確定是 select 標籤
          return select && select.value && select.value !== '';   //select 就算 html 本身沒有 value 屬性 只有 option 選了 select.value 就還是會被賦予值
        });
        await submitAndCloseOldForm(this.page); //這裡不加 await 下一圈就會提早開始執行，但新表單還沒準備好。 所以那些行就都失效了

      } catch (error) {
        this.failedRows.push([date, num, factory])
        console.log('startautofilla default error \n ', 'this.failedrows:', this.failedRows)
      }
    }
    console.log('start-auto-fillA handled, about to return failedrows, from autofill-a-strategy')
    return this.failedRows
  }

  //___ helper function
  public getFailedRows(): [string, string, string][] {
    return this.failedRows;
  }


}