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
import { initializeBrowserAndPage } from './utils/playwright-utils.js';
import { ClasifyByGPT, mergeClassification } from './utils/CProcessClassifierOpenAI.js';
import { fileURLToPath } from 'url';

import type { Page, Browser } from 'playwright';


const isDev = !app.isPackaged;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const executablePath = isDev
  ? path.join(__dirname, '../../ms-playwright',
    'chromium-1179',
    'chrome-win',
    'chrome.exe')  // 你本地開發瀏覽器資料夾相對路徑

  : path.join(
    process.resourcesPath,  // 打包後路徑  ( ms-playwright資料夾 大概就在打包後軟體資料夾的根目錄 )
    'ms-playwright',
    'chromium-1179',
    'chrome-win',
    'chrome.exe' // Windows 範例，macOS 或 Linux 要換成對應檔名
  );
let page: Page | undefined
let context: AutoFillerContext


const strategies = {
  A: new AutoFillerA(),
  B: new AutoFillerB(),
  C: new AutoFillerC()
}

let dataA: Array<[string, string, string]> = [];
let dataB: [string, string];
let dataC: Array<[string, string, string]> = [];

let failedRowsA: [string, string, string][] = [] //日期 金額 統一編號
let failedRowsB: string[] = [] //案號 日期 金額 
let failedRowsC: [string, string, string][] = [] //日期 金額 商品名稱

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
    const filePath = path.join(__dirname, '../renderer/index.html'); //試過getappPath之後比較喜歡dirname。 getapppath應該是會帶妳到asar檔案的位置
    mainWindow.loadFile(filePath);
  }
})



ipcMain.handle('update-data-A', async (event, _dataA) => {   //event 不會用到 但 ipcmain一定要有event這個參數 
  dataA = _dataA
  console.log('main.ts got the infoA!:', dataA);

  return {
    message: '資料A更新成功！',
    dataA,
  };

});

ipcMain.handle('update-data-B', async (event, _dataB) => {   //event 不會用到 但 ipcmain一定要有event這個參數 
  dataB = _dataB
  console.log('main.ts got the infoB!:', dataB);

  return {
    message: '資料B更新成功！',
    dataB,
  };

});


ipcMain.handle('update-data-C', async (event, _dataC) => {   //event 不會用到 但 ipcmain一定要有event這個參數 
  dataC = _dataC
  console.log('main.ts got the infoC!:', dataC);

  return {
    message: '資料C更新成功！',
    dataC,
  };

});

ipcMain.handle('login', async (event) => {   //event 不會用到 但 ipcmain一定要有event這個參數 

  page = await initializeBrowserAndPage(executablePath, isDev);
  context = { executablePath, isDev, page };
  return { success: true };

})

ipcMain.handle('start-auto-fillA', async () => {   //event 不會用到 但 ipcmain一定要有event這個參數 
  console.log('starting auto fillA process:');
  strategies.A.initialize(context)
  if (!page) throw new Error('沒有偵測到打開的 Chromium 網頁');
  strategies.A.startAutoFill(dataA)
  return { dataA, failedRowsA }
})

ipcMain.handle('start-auto-fillB', async () => {

  console.log('starting auto fillB process:');
  strategies.B.initialize(context)
  if (!page) throw new Error('沒有偵測到打開的 Chromium 網頁');
    const [startDate, endDate] = dataB
  const groupedBdata=await strategies.B.Bdatascapper(startDate,endDate)
  await strategies.B.startAutoFill(groupedBdata)
  return 'B return holder'
})


ipcMain.handle('start-auto-fillC', async () => {
  console.log('starting auto fillC process:');
  strategies.C.initialize(context)
  if (!page) throw new Error('沒有偵測到打開的 Chromium 網頁');
  const clasifiedMap = await ClasifyByGPT(dataC);  // product -> {product,main,sub}
  const enrichedData = mergeClassification(dataC, clasifiedMap);
  strategies.C.startAutoFill(enrichedData)


});



// });
