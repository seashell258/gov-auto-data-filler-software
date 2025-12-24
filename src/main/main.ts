// //項目	功能說明
// 建立視窗	建立 BrowserWindow，讓前端畫面出現
// 載入前端畫面	載入 React、HTML、Vite 頁面，例如 loadURL() 或 loadFile()
// 處理 IPC 請求	負責接收前端透過 ipcRenderer 發送的訊息，並進行處理回傳
// 控制應用生命週期	比如 app.whenReady()、app.quit()、macOS 獨有的 activate 邏輯
// tsconfig 編譯這些後端的部分，不會編譯react的前端部分
// viteconfig 負責編譯 react 的部分，把它變成靜態 html 檔案。 然後跟 electron 主程式搭配 ( 前後端搭配 )
// electron 只能透過 win.loadFile('dist/renderer/index.html') 載入一個靜態的 html + js 網站才能連上前端，
// 給後端.ts程式碼，後端是無法操作的

// main.js 好像是 electron 的啟動腳本。package.json的 script要填這個 

//打包階段	1.執行 vite build，把 React 編譯成純 JS + 靜態檔案	
// 2. loadFile('dist/index.html')	靜態資源，方便封裝和部署

// 宣告一個全域變數來快取從爬蟲收集到的資料。
// 這裡用 null 讓它在初始化時是空的。
import { app, ipcMain, BrowserWindow, IpcMainInvokeEvent } from 'electron';
import path, { dirname, join } from 'path';

import { AutoFillerA } from './playwright-strategies/autofill-a-strategy.js';
import { AutoFillerB } from './playwright-strategies/autofill-b-strategy.js';
import { AutoFillerC } from './playwright-strategies/autofill-c-strategy.js';
import { AutoFillerContext } from './playwright-strategies/IAutoFiller.js';
import browsermanager, { checkDataAFormat, checkDataBFormat, checkDataCFormat, resetPageToHome } from './utils/playwright-utils.js';
import { ClasifyByGPT, mergeClassification } from './utils/CProcessClassifierOpenAI.js';
import { fileURLToPath } from 'url';

import type { Page, Browser } from 'playwright';
import log from 'electron-log';

import { getPdfFolderPath } from './utils/getPdfPath.js'
import { shell } from 'electron/common';




const isDev = !app.isPackaged;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const executablePath = isDev
  ? path.join(__dirname, '../../ms-playwright',
    'chromium-1179',
    'chrome-win',
    'chrome.exe')  // 你本地開發瀏覽器資料夾相對路徑

  : path.join(
    process.resourcesPath,  // 打包後路徑  process.resourcesPath → win-unpacked/resources
    'ms-playwright',
    'chromium-1179',
    'chrome-win',
    'chrome.exe' // Windows 範例，macOS 或 Linux 要換成對應檔名
  );
console.log("executablepath", executablePath)
let page: Page | undefined
let context: AutoFillerContext


const strategies = {
  A: new AutoFillerA(),
  B: new AutoFillerB(),
  C: new AutoFillerC()
}

let dataA: Array<[string, string, string]> = [];//日期 金額 統一編號
let dataB: [string, string]; //公告開始日期 截止日期
let dataC: Array<[string, string, string]> = []; //日期 金額 商品名稱

let groupedBDatas: Record<string, [string, string, string][]> = {};

let failedRowsA: [string, string, string][] = []
let failedRowsB: string[] = [] //失敗的截止日期們 ( 截止日期是key 資料是value )
let failedRowsC: [string, string, string][] = []

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 1000,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  })
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const filePath = path.join(__dirname, '../../renderer/index.html'); //試過getappPath之後比較喜歡dirname。 getapppath應該是會帶妳到asar檔案的位置 win unpacked
    mainWindow.loadFile(filePath);
  }
})



ipcMain.handle('update-data-A', async (event, _dataA) => {   //event 不會用到 但 ipcmain一定要有event這個參數 
  await resetPageToHome(page!) // 避免用戶填完A又連續填別的 環境不一致造成意外。 
  // 如果還沒開瀏覽器，這個函數就甚麼也不會做

  const { isValid, error } = await checkDataAFormat(_dataA)
  if (isValid) {
    dataA = _dataA
    console.log('main.ts got the infoA!:', dataA);

    return {
      message: '資料A更新成功！',
      dataA,
    };
  }
  else {
    return {
      message: error
    };
  }
});

ipcMain.handle('update-data-B', async (event, _dataB) => {   //event 不會用到 但 ipcmain一定要有event這個參數 
  await resetPageToHome(page!)
  const { isValid, error } = await checkDataBFormat(_dataB)
  if (isValid) {
    dataB = _dataB
    console.log('main.ts got the infoB!:', dataB);
    return {
      message: '資料B更新成功！',
      dataB,
    };
  }
  else {
    return {
      message: error
    };
  }
});


ipcMain.handle('update-data-C', async (event, _dataC) => {   //event 不會用到 但 ipcmain一定要有event這個參數 
  await resetPageToHome(page!)
  const { isValid, error } = await checkDataCFormat(_dataC)
  if (isValid) {
    dataC = _dataC
    console.log('main.ts got the infoC!:', dataC);
    return {
      message: '資料C更新成功！',
      dataC,
    };
  }
  else {
    return {
      message: error
    };
  }




});

ipcMain.handle('login', async (event) => {   //event 不會用到 但 ipcmain一定要有event這個參數 
  try {
    log.info('ipcmain.handle login is triggered')
    page = await browsermanager.initializeBrowserAndPage(executablePath, isDev);
    context = { executablePath, isDev, page };
    return 'success'
  } catch (error) {

    return { error, executablePath };
  }


})

ipcMain.handle('start-auto-fillA', async () => {   //event 不會用到 但 ipcmain一定要有event這個參數 
  console.log('starting auto fillA process:');
  strategies.A.initialize(context)
  if (!page) throw new Error('沒有偵測到打開的 Chromium 網頁');
  failedRowsA = await strategies.A.startAutoFill(dataA)
  return failedRowsA
})

ipcMain.handle('B-start-collecting-document', async () => {
  console.log('B-start-collecting-document');
  if (!page) throw new Error('沒有偵測到打開的 Chromium 網頁');

  const [startDate, endDate] = dataB
  strategies.B.initialize(context)
  groupedBDatas = await strategies.B.Bdatascapper(startDate, endDate)

  return (groupedBDatas);

})
//#region 打開存pdf的按鈕 (B模式)
ipcMain.handle('open-folder', async () => {
  let PdfFolderPathpath = getPdfFolderPath()
  shell.openPath(getPdfFolderPath());

})
//#endregion

ipcMain.handle('start-auto-fillB', async () => {
  //測試用資料 
  /* 
  groupedBDatas = {
    '1140620': [
      ['R20250611095', '1140620', '1,500'],
      ['R20250611098', '1140620', '2,600']
    ],
    '1140627': [['R20250613030', '1140627', '2,880']]
  }*/
  console.log('groupbDATAS在main.ts', groupedBDatas)
  console.log('starting auto fillB process:');
  strategies.B.initialize(context)
  if (!page) throw new Error('沒有偵測到打開的 Chromium 網頁');

  failedRowsB = await strategies.B.startAutoFill(groupedBDatas)
  return failedRowsB
})



ipcMain.handle('start-auto-fillC', async () => {
  console.log('starting auto fillC process:');
  strategies.C.initialize(context)
  if (!page) throw new Error('沒有偵測到打開的 Chromium 網頁');
  const clasifiedMap = await ClasifyByGPT(dataC);  // product -> {product,main,sub}
  const enrichedData = mergeClassification(dataC, clasifiedMap);
  failedRowsC = await strategies.C.startAutoFill(enrichedData)
  return failedRowsC

});




// });
