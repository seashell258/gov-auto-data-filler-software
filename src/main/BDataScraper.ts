import { Locator, Page } from 'playwright-core';
import { checkPageReady, navigateToFillPage, prepareNewForm, openDatePicker, fillDate, submitAndCloseOldForm }
  from './utils/playwright-utils.js';
import { getPdfFolderPath } from './utils/getPdfPath.js'
import path from 'path';


type OfficialDocumentData = [string, string, string]; // [案號, 截止日期, 金額]

/**
 * 執行 B 表單的爬蟲與資料分組邏輯。
 * @param startDate - 查詢的開始日期。
 * @param endDate - 查詢的結束日期。
 * @returns -把同一天的案子集中在一起，當成key。 value 是一個陣列，一筆筆表單資料。
 */

async function extractRowData(row: Locator): Promise<{ endDate: string, amountText: string }> {
  const dateText = await row.locator('td').nth(8).innerText();
  const amountText = await row.locator('td').nth(9).innerText();

  const match = dateText.match(/~\s*(\d{3})\/(\d{2})\/(\d{2})/);
  if (!match) throw new Error('公告期限格式錯誤');
  const [_, rocYear, month, day] = match;
  const endDate = `${rocYear}${month}${day}`;
  return { endDate, amountText };
}

async function openModalAndGetCaseNumber(page: Page, index: number): Promise<string> {
  await page.locator('a[title="檢視"]').nth(index).click();
  await page.waitForSelector('.modal-content', { state: 'visible' });

  const caseNumber = await page.locator('span.form-control-plaintext').first().innerText();
  return caseNumber;
}

async function isolateModalForPdfSave(page: Page) { //要把 pdf 以外的網頁元素都隱藏起來 因為 pdf 現在的儲存方式是運用截圖
  await page.evaluate(() => {
    const modal = document.querySelector('.modal');
    if (!modal) return;
    const bodyChildren = Array.from(document.body.children);
    for (const el of bodyChildren) {
      if (el !== modal && !modal.contains(el)) {
        (el as HTMLElement).style.display = 'none';
      }
    }
  });
}

async function saveModalAsPdf(page: Page, caseNumber: string) {
  let pdfDesktopPath = getPdfFolderPath()
  const pafSavePath =
    path.join(pdfDesktopPath, `${caseNumber}.pdf`)
  await page.pdf({
    path: pafSavePath, //打包後環境 會是使用者啟動app的目錄 根目錄就是 win-unpacked
    format: 'A4',
    printBackground: true,
    margin: { right: '1cm', bottom: '1cm', left: '1cm' },
    scale: 1.05,
  });
}

/**
 * 將 modal 外的元素顯示還原
 * 注意：只能移除 inline style，無法還原原本 CSS 的 display 屬性
 */
async function restorePageAfterPdfSaved(page: Page) {
  // 等待 modal 元素已附加到 DOM
  await page.waitForSelector('.modal', { state: 'attached' });

  await page.evaluate(() => {
    const modal = document.querySelector('.modal');
    if (!modal) return;

    const bodyChildren = Array.from(document.body.children);
    for (const el of bodyChildren) {
      if (el !== modal && !modal.contains(el)) {
        // 移除之前用 display:none 設定的 inline style
        (el as HTMLElement).style.display = '';
      }
    }
  });
}


async function closeModal(page: Page) {
  await page.waitForSelector('button.close', { state: 'visible' });
  await page.click('button.close');
  await page.waitForTimeout(500);
}



export async function scrapeAndGroupData(page: Page, startDate: string, endDate: string, isdev: boolean): Promise<Record<string, OfficialDocumentData[]>> {
  console.log('starting collecting B official doc process:');

  let result = await checkPageReady(page);
  console.log(result)

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

  let officialDocumentDatas: OfficialDocumentData[] = [];
  for (let i = 0; i < count; i++) {
    try {
      const row = rows.nth(i);
      console.log('>>> 處理第', i + 1, '筆');

      const { endDate, amountText } = await extractRowData(row);
      console.log('公告期限:', endDate);
      console.log('採購金額:', amountText);

      const caseNumber = await openModalAndGetCaseNumber(page, i);
      console.log('案號:', caseNumber);

      await isolateModalForPdfSave(page);
      await saveModalAsPdf(page, caseNumber); //存在桌面一個資料夾
      officialDocumentDatas.push([caseNumber, endDate, amountText]);
      restorePageAfterPdfSaved(page)
      await closeModal(page);

    } catch (error) {
      console.error(`處理第 ${i + 1} 筆資料失敗:`, error);
      // 你可以在這裡選擇繼續或拋出錯誤
    }
  }

  console.log('完成爬蟲，officialDocumentDatas:', officialDocumentDatas);

  // 將資料按日期分組
  const groupedBDatas: Record<string, OfficialDocumentData[]> = {};
  for (const item of officialDocumentDatas) {
    const key = item[1];
    if (!groupedBDatas[key]) {
      groupedBDatas[key] = [];
    }
    groupedBDatas[key].push(item);
  }

  console.log('將officialDocumentDatas分組得到 groupedBDatas:', groupedBDatas);
  return groupedBDatas;
}

