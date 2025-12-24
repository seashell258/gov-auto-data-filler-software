import { useState } from 'react';
type prop = {
  mode: 'A' | 'B' | 'C';
}

export default function App({ mode }: prop) {

  type Row = [caseId: string, date: string, cost: string];
  type GroupedBDatas = Record<string, Row[]>;

  let [groupedBDatas, setGroupedBDatas] = useState<GroupedBDatas>({});
  let [DatasA, setDatasA] = useState<[string, string, string][]>([]);  //[[string,string,string]]
  let [DatasC, setDatasC] = useState<[string, string, string][]>([]);  //[[string,string,string]]


  let [failedRowsA, setFailedRowsA] = useState<[string, string, string][] | null>(null);
  let [failedRowsB, setFailedRowsB] = useState<string[]>([]);
  let [failedRowsC, setFailedRowsC] = useState<[string, string, string][] | null>(null);

  switch (mode) {
    //#region A
    case 'A':
      return (
        <div>
          <button style={{
            width: '25vw',
            height: '10vh',
            margin: '1rem',
            fontSize: '1.45rem',
            backgroundColor: '#FFEBCD',
            color: '#5C3A21',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderRadius: '15px',
            border: 'none',
          }} onClick={window.electronAPI.login}> 第一步：優先採購網登入 </button>
          <div style={{ marginBottom: '5rem', color: '#F5F5DC' }}>登入完停在首頁就夠了，可以直接回來按下第二步</div>

          <button style={{
            width: '25vw',
            height: '10vh',
            margin: '1rem',
            backgroundColor: '#FFEBCD',
            color: '#5C3A21',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderRadius: '15px',
            border: 'none',
            // onClick={function ()的話，一進Step3就會直接執行。 }
            // onClick={sayHi}   // 點擊時 React 會幫你執行 sayHi()
            // onClick={sayHi()} // 一載入就執行 sayHi()，結果變成 undefined 傳給 onClick


            fontSize: '1.45rem'
          }} onClick={async () => {
            const resultA = await window.electronAPI.startAutoFillA()
            console.log('後端回傳resultA (failedrows)：', resultA); //但也可能回傳 error，所以下面給個空陣列，防止傳回來的是預期外的東西
            setFailedRowsA(Array.isArray(resultA) ? resultA : []);
          }}



          > 第二步：開始自動填表 </button>
          <div>
            {failedRowsA === null ? ( //同一次程式執行期間 failedrows不會清除，所以執行兩次自動填表 可能會有第一次殘留的 failedrows
              <div></div>
            ) : failedRowsA.length > 0 ? ( //呼叫了startautofillA就一定會有failedrows的回傳
              failedRowsA.map(([date, cost, taxIdNumber], index) => (
                <div
                  key={index}
                  style={{ color: '#e77325ff', fontWeight: 'bold' }}
                >
                  (填寫失敗的幾筆資料:) 日期: {date} / 金額: {cost} / 統一編號: {taxIdNumber}
                </div>

              ))
            ) : (
              <div style={{ color: '#c78e24ff', fontWeight: 'bold' }}>目前沒有自動填寫失敗的資料</div>
            )}
          </div>


        </div>
      );
    //#endregion

    //#region B
    //如果是B的話 分成三個按鈕 三個步驟去執行。 讓整個環節被拆短一點，才不會一行報錯，整個環節被卡住
    case 'B':
      return (
        <div style={{ color: '#F5F5DC' }}>
          <button style={{
            width: '35vw',
            height: '10vh',
            margin: '1rem',
            fontSize: '1.45rem',
            backgroundColor: '#FFEBCD',
            color: '#5C3A21',
            cursor: 'pointer',
            borderRadius: '15px',
            border: 'none',
          }} onClick={window.electronAPI.login}> 第一步：優先採購網登入 </button>
          <div style={{ marginBottom: '5rem', color: '#F5F5DC' }}>登入完停在首頁就夠了，可以直接回來按下第二步</div>

          <button style={{
            width: '35vw',
            height: '10vh',
            margin: '1rem',
            backgroundColor: '#FFEBCD',
            color: '#5C3A21',
            cursor: 'pointer',
            borderRadius: '15px',
            border: 'none',

            fontSize: '1.45rem'
          }} onClick={async () => {
            const result = await window.electronAPI.BstartCollectingOfficialDocument();
            console.log('後端回傳：', result);
            setGroupedBDatas(result);

          }}> 第二步：開始收集公文 pdf 和紀錄資料 </button>

          <button style={{
            width: '35vw',
            height: '10vh',
            margin: '1rem',
            backgroundColor: '#FFEBCD',
            color: '#5C3A21',
            cursor: 'pointer',
            borderRadius: '15px',
            border: 'none',

            // @todo 跟上面的login  api的函數包在另一個函數裡的做法比較看看。 這邊如果可以就用這種寫法就好
            fontSize: '1.45rem'
          }} onClick={() => {
            window.electronAPI.openFolder();
          }}>
            打開存著 pdf 的資料夾 ( 如果需要人工上傳 pdf )
          </button>

          <button style={{
            width: '35vw',
            height: '10vh',
            margin: '1rem',
            backgroundColor: '#FFEBCD',
            color: '#5C3A21',
            cursor: 'pointer',
            borderRadius: '15px',
            border: 'none',

            // @todo 跟上面的login  api的函數包在另一個函數裡的做法比較看看。 這邊如果可以就用這種寫法就好
            fontSize: '1.45rem'
          }} onClick={async () => {
            const failedResultB = await window.electronAPI.startAutoFillB()
            console.log('failedResultB:', failedResultB)
            setFailedRowsB(failedResultB)
          }

          }> 第三步：開始自動填表和上傳 pdf </button>




          <div>
            <h5>按下第三步之後，下面的資料如果被填寫失敗，會變成紅色</h5>
            {Object.entries(groupedBDatas).map(([key, rows]) => ( //MAP函式回傳一個 DIV 區塊。然後外層整個 REACT 元件函數 就是應該吃 DIV 區塊，
              // ()就是要回傳的 div  如果是{} 就是要額外寫 return 回傳 div的內容 。   
              // 這邊處理B的區塊已經是 return 了，裡面也還有 return 是正常的，它會回傳 div  
              <div key={key}>
                <h3>{key}</h3>
                {rows.map(([caseId, date, cost], index) => {
                  const isFailed = failedRowsB.includes(key);
                  //const isFailed = failedRowsB.some(fDate => fDate === key); 也可以

                  return (
                    <div
                      key={index}
                      style={{
                        color: isFailed ? '#FF6B6B' : 'inherit',

                        fontWeight: isFailed ? 'bold' : 'normal',
                      }}
                    >    {isFailed && `(填寫失敗) `}
                      案號: {caseId} / 結標日期: {date} / 金額: {cost}

                    </div>
                  );
                })}
              </div>
            ))}

          </div>


        </div>
      );
    //#endregion

    //#region C
    case 'C':
      return (
        <div>
          <button style={{
            width: '25vw',
            height: '10vh',
            margin: '1rem',
            fontSize: '1.45rem',
            backgroundColor: '#FFEBCD',  // 淺奶油杏仁色
            color: '#5C3A21',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderRadius: '15px',
            border: 'none',
          }} onClick={async () => {
            const result = await window.electronAPI.login()
            console.log(result)
          }
          }> 第一步：優先採購網登入 </button>
          <div style={{ marginBottom: '5rem', color: '#F5F5DC' }}>登入完停在首頁就夠了，可以直接回來按下第二步</div>

          <button style={{
            width: '25vw',
            height: '10vh',
            margin: '1rem',
            backgroundColor: '#FFEBCD',
            color: '#5C3A21',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderRadius: '15px',
            border: 'none',
            // onClick={function ()的話，一進Step3就會直接執行。 }
            // onClick={sayHi}   // 點擊時 React 會幫你執行 sayHi()
            // onClick={sayHi()} // 一載入就執行 sayHi()，結果變成 undefined 傳給 onClick


            fontSize: '1.45rem'
          }} onClick={async () => {
            const resultC = await window.electronAPI.startAutoFillC()
            console.log('後端回傳resultC：', resultC);
            setFailedRowsC(Array.isArray(resultC) ? resultC : []);

          }}

          > 第二步：開始自動填表 </button>

          <div>
            {failedRowsC === null ? ( //同一次程式執行期間 failedrows不會清除，所以執行兩次自動填表 可能會有第一次殘留的 failedrows
              <div></div>
            ) : failedRowsC.length > 0 ? ( //呼叫了startautofillA就一定會有failedrows的回傳
              failedRowsC.map(([date, cost, taxIdNumber], index) => (
                <div
                  key={index}
                  style={{ color: '#e77325ff', fontWeight: 'bold' }}
                >
                  (填寫失敗的幾筆資料:) 日期: {date} / 金額: {cost} / 產品名稱: {taxIdNumber}
                </div>

              ))
            ) : (
              <div style={{ color: '#c78e24ff', fontWeight: 'bold' }}>目前沒有自動填寫失敗的資料</div>
            )}
          </div>
        </div>
      );
    //#endregion

  }
}




