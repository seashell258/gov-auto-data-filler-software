import { Page } from 'playwright-core';
import { checkPageReady, navigateToFillPage, prepareNewForm, openDatePicker, fillDate, submitAndCloseOldForm }
  from './utils/playwright-utils.js';


// 定義 B 表單資料的型別
type OfficialDocumentData = [string, string, string]; // [案號, 截止日期, 金額]

  /**
   * 執行 B 表單的爬蟲與資料分組邏輯。
   * @param startDate - 查詢的開始日期。
   * @param endDate - 查詢的結束日期。
   * @returns -把同一天的案子集中在一起，當成key。 value 是一個陣列，一筆筆表單資料。
   */
  export async function scrapeAndGroupData(page:Page,startDate: string, endDate: string): Promise<Record<string, OfficialDocumentData[]>> {
    console.log('starting collecting B official doc process:');

    checkPageReady(page)

    // 導航到優採公告專區管理頁面
    await page.waitForSelector('a.list-group-item[href="#collapseAM"]');
    await page.click('a.list-group-item[href="#collapseAM"]');
    await page.waitForTimeout(200); // 等待選單展開
    await page.waitForSelector('a.menu-list[href="/portal/AM0100"]');
    await page.click('a.menu-list[href="/portal/AM0100"]');

    console.log('開始日期:', startDate, '結束日期:', endDate);

    // 填寫日期區間並查詢
    await page.waitForSelector('input[name="startDate"]', { state: 'visible' });
    await page.click('input[name="startDate"]');
    await fillDate(page, startDate); // 假設你的 fillDate 輔助函數接收 page 參數
    
    await page.waitForSelector('input[name="endDate"]', { state: 'visible' });
    await page.click('input[name="endDate"]');
    await fillDate(page, endDate);

    await page.waitForSelector('button.btn.btn-primary[title="查詢"]');
    await page.click('button.btn.btn-primary[title="查詢"]');

    // 調整每頁顯示筆數為 100
    await page.waitForSelector('select.chzn-select');
    await page.click('select.chzn-select');
    await page.selectOption('select.chzn-select', { label: '100' });
    await page.waitForTimeout(2000); // 等待表格重新載入

    // 迴圈爬取表格並處理資料
    const rows = page.locator('tbody > tr');
    const count = await rows.count();
    console.log('B RowsCount:', count);

    const officialDocumentDatas: OfficialDocumentData[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const row = rows.nth(i);
        console.log('>>> 處理 B 資料 第', i + 1, '筆');

        // 提取公告期限和採購金額
        const dateText = await row.locator('td').nth(8).innerText();
        const amountText = await row.locator('td').nth(9).innerText();
        const match = dateText.match(/~\s*(\d{3})\/(\d{2})\/(\d{2})/);
        let oneParsedDate: string;

        if (match) {
          const [_, rocYear, month, day] = match;
          oneParsedDate = `${rocYear}${month}${day}`;
          console.log(`公告期限: ${oneParsedDate}`);
        } else {
          console.log('B processing official document endDate no match');
          throw new Error(`第 ${i} 筆資料公告期限格式錯誤，停止執行`);
        }
        console.log(`採購金額: ${amountText}`);

        // 點擊檢視按鈕以打開 modal
        await page.locator('a[title="檢視"]').nth(i).click();
        await page.waitForSelector('.modal-content', { state: 'visible' });

        // 從 modal 中提取案號並儲存 PDF
        const caseNumber = await page.locator('span.form-control-plaintext').first().innerText();
        console.log('案號:', caseNumber);
        
        officialDocumentDatas.push([caseNumber, oneParsedDate, amountText]);
        
        // 關閉 modal 才能繼續下一個循環
        await page.waitForSelector('button.close', { state: 'visible' });
        await page.click('button.close');
        await page.waitForTimeout(500); // 短暫等待以確保 modal 完全關閉
      } catch (error) {
        console.error(`處理第 ${i + 1} 筆資料失敗:`, error);
        // 你可以在這裡選擇繼續或拋出錯誤
      }
    }

    console.log('officialDocumentDatas:', officialDocumentDatas);

    // 將資料按日期分組
    const groupedBDatas: Record<string, OfficialDocumentData[]> = {};
    for (const item of officialDocumentDatas) {
      const key = item[1];
      if (!groupedBDatas[key]) {
        groupedBDatas[key] = [];
      }
      groupedBDatas[key].push(item);
    }

    console.log('groupedBDatas:', groupedBDatas);
    return groupedBDatas;
  }

