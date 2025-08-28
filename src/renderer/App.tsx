import { useState } from 'react';
import StepOneModeChoose from './StepOneModeChoose.js';
import StepTwoProvideDataA from './StepTwoProvideDataA.js';
import StepTwoProvideDataB from './StepTwoProvideDataB.js';
import StepTwoProvideDataC from './StepTwoProvideDataC.js';
import StepThreeLogIn from './StepThreeLogIn.js';

export default function App() {
  const [step, setStep] = useState(1);  //預設值是1
  const [mode, setSelectedMode] = useState<'A' | 'B' | 'C'>('A'); //不會是 null defulat 'A' 
  //   const [data, setData] = useState< [string, number] >([]);  這樣寫會被誤認成 tuple 
  const [dataA, setDataA] = useState<Array<[string, string,string]>>([]);   //array這樣寫就已經是雙陣列的資料型別了[[]]
  const [dataB, setDataB] = useState<[string, string] | [string,""]>();  //也可以只填開始日期 沒填結標日期( 預設查詢到到現在 )
  const [dataC, setDataC] = useState<Array<[string, string,string]>>([]);
  // 這邊用預設值的語法宣告了 data 的資料結構
  // 原本可以單純提供預設值，讓程式自己判斷型別。 但因為這邊預設是空陣列，所以一定要寫明型別。

//  ['114/07/10', 888],
//  ['114/06/10', 8889],       key value對應的叫做物件 []的叫做陣列

  const buttonStyle = (active: boolean) => ({
    marginRight: 20,
    fontSize:'15px',
    padding: '14px 17px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: active ? '#ad741eff' : '#ebeae5ff',
    color: active ? '#ffffff' : '#111827',
    fontWeight: active ? '600' : '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: active ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
  });

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      color: '#111827',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 上方步驟切換列 */}
      <div style={{
        position: 'sticky',
        top: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
        zIndex: 10
      }}>
        <button onClick={() => setStep(1)} style={buttonStyle(step === 1)}>第一步，選擇模式</button>
        <button onClick={() => setStep(2)} style={buttonStyle(step === 2)}>第二步，寫入資料</button>
        <button onClick={() => setStep(3)} style={buttonStyle(step === 3)}>第三步，登入網頁</button>
      </div>

      {/* 下方內容區塊 */}
      <div style={{
        flexGrow: 1,
        padding: '24px',
        overflowY: 'auto',
        backgroundColor: 'rgb(133, 109, 77)',
        fontSize:'40px'

      }}>
        {step === 1 && (
          <StepOneModeChoose mode={mode} onSelectMode={mode => setSelectedMode(mode)} />   
          //mode = {mode} 就可以把從子元件傳過來的 mode 參數，再傳給子元件。 
          // 可能不是那麼需要，可以直接在子元件定義個參數儲存 mode 就好  @todo

          // 等於 function onSelectMode (mode)
          //  setSelectedMode(mode)     
          // 子元件負責的任務是呼叫父元件 onSelectMode 。子元件主要是負責提供 mode 作為參數


        )}
        
{step === 2 && mode === 'A' && (
  <StepTwoProvideDataA _dataA = {dataA} onProvidingData={dataA => {
    setDataA(dataA);
    console.log('App的dataA:',dataA);}
  }/>  
  // 在react中，要讓子元件給父元件一個參數。 
  // 父元件會需要 
  // 1. [data, setData] = useState
  // 2.渲染的子元件後面宣告一個要給子元件呼叫的函數 onProvidingData={data => setData(data)}。 然後在這個函數中呼叫setData 來修改data  
  // 子元件會需要
  // 1.prop 定義子元件預計要呼叫的函數、函數要吃的參數型別
  // 2.還得把預計要呼叫的函數，作為參數傳給自己的函數? function StepTwoProvideData({ onProvidingData }: Props)
)}

{step === 2 && mode === 'B' && (
  <StepTwoProvideDataB 
  onProvidingData={dataB => {
    setDataB(dataB);
    console.log('App的dataB:',dataB);}
    }
  />
)}

{step === 2 && mode === 'C' && (
  <StepTwoProvideDataC _dataC={dataC}
  onProvidingData={dataC => {
    setDataC(dataC);
    console.log('App的dataC:',dataC);

    }

    }

  />
)}

        {step === 3 && (
          <StepThreeLogIn mode={mode} 
  
          />
        )}
      </div>
    </div>
  );
}
