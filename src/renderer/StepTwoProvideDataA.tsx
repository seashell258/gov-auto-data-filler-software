import { useEffect, useRef, useState } from 'react';
import { formatTextAreaAndRespond } from './FrontEndUtils/checkDataFormatAndRespond';
import { commonToastOptions } from './FrontEndUtils/errorMessageStyles';
import { toast } from 'react-toastify';

type Props = {
  _dataA: Array<[string, string, string]>;
  onProvidingData: (dataA: Array<[string, string, string]>) => void;
};


export default function StepTwoProvideData({ _dataA, onProvidingData }: Props) {

  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {          // 把_dataA再傳進來 搭配上這段，可以讓使用者再切換模式後還是能保留自己原本的輸入，不會全部消失
    if (_dataA && _dataA.length > 0) {
      const formatted = _dataA.map(item => item.join(',')).join('\n');
      if (textRef.current) {
        textRef.current.value = formatted;  // 靠著每次渲染重新填充，保存 textarea 的內容為更新後的 dataA
      }
    }
  }, []);

  // 資料沒有在子元件的話，其實可以讓父元件隨意傳個不吃參數的函數，這邊只是按下按鈕，通知父元件執行。
  // 因為父元件有所有狀態變數的資料，比較方便。  provideDataC就有用到這個做法。
  const handleClick = async () => {
    if (textRef.current) {
      const { ok, parsed } = formatTextAreaAndRespond(textRef); //無論有沒有錯誤都會回傳 parsed，因為想傳 parsed 給前端存著。 這樣使用者輸入的文字才能透過 useref一直保存
      onProvidingData(parsed); //傳給前端
      if (ok) {
        const result = await window.electronAPI.updateDataA(parsed);   //傳給後端 等待回傳
        toast.error(result.message + '\n伺服器取得資料：' + JSON.stringify(result.dataA), {//跳通知讓使用者知道成功
          ...commonToastOptions,
          onClose: () => textRef.current?.focus(),
        });

      }
    }

  };


  return (

    <div>
      <h3 style={{ color: '#F5F5DC' }}>輸入資料（模式 A）</h3>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',  // 靠上對齊
        gap: '2rem',               // 中間間距
      }}>
        <textarea ref={textRef}
          style={{
            width: '30vw',
            height: '52vh',
            padding: '1rem',
            fontSize: '1.41rem',       // 約等於 text-lg
            lineHeight: '1.75rem',      // leading-relaxed
            border: '1px solid #ccc',
            borderRadius: '8px',
            resize: 'none',
            fontFamily: 'sans-serif',
          }}
          className="dataProvidedA"
        />
        <div style={{ fontSize: '2rem', color: '#F5F5DC' }}>
          <p>格式：</p>
          <pre>
            日期1,金額1,統一編號1 <br />
            日期2,金額2,統一編號2 <br />
          </pre>
          <p>比如：</p>
          <pre>
            1140710,500,45331292 <br />
            1140610,200,45331292
          </pre>
        </div>

      </div>
      <button style={{
        width: '19vw',
        height: '9vh',
        margin: '1.9rem',
        fontSize: '1.45rem',
        backgroundColor: '#FFEBCD',  // 淺奶油杏仁色
        color: '#5C3A21',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderRadius: '19px',
        border: 'none',
      }} onClick={handleClick}> 填寫完畢，更新資料 </button>

    </div> //一個子元件只能return 一個最外層的div 其他都要塞裡面


  );
}
