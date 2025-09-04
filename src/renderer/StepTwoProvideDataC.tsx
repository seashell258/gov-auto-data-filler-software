import { useEffect, useRef, useState } from 'react';
import { formatTextAreaAndRespond } from './FrontEndUtils/checkDataFormatAndRespond';
import { toast } from "react-toastify";
import { commonToastOptions } from './FrontEndUtils/errorMessageStyles';
type Props = {
  _dataC: Array<[string, string, string]>;
  onProvidingData: (dataC: Array<[string, string, string]>) => void;
};


export default function StepTwoProvideData({ _dataC, onProvidingData }: Props) {

  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {          // 把_dataA再傳進來 搭配上這段，可以讓使用者再切換模式後還是能保留自己原本的輸入，不會全部消失
    if (_dataC && _dataC.length > 0) {
      const formatted = _dataC.map(item => item.join(',')).join('\n');
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
      onProvidingData(parsed);
      if (ok) {
        const result = await window.electronAPI.updateDataC(parsed);   //等待後端回傳

        toast.error(result.message + '\n伺服器取得資料：' + JSON.stringify(result.dataC), {
          ...commonToastOptions,
          onClose: () => textRef.current?.focus(),
        });
      }
    }

  };


  return (
    <div >
      <h3 style={{
        color: '#F5F5DC',
      }}>輸入資料（模式 C）</h3>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',  // 靠上對齊
        gap: '2rem',               // 中間間距

      }}>
        <textarea ref={textRef}
          style={{
            width: '40vw',
            height: '53vh',
            padding: '1rem',
            fontSize: '1.4rem',       // 約等於 text-lg
            lineHeight: '1.75rem',      // leading-relaxed
            border: '1px solid #ccc',
            borderRadius: '8px',
            resize: 'none',
            fontFamily: 'sans-serif',
          }}
          className="dataProvidedC"

        />
        <div style={{ fontSize: '2rem', color: '#F5F5DC' }}>
          <p>格式：</p>
          <pre>
            日期1,產品名稱1,金額1 <br />
            日期2,產品名稱2,金額2<br />
          </pre>
          <p>比如：</p>
          <pre>
            1140710,便當,888 <br />
            1140610,國際英文日海報,999
          </pre>
          <p>不需要填寫產品主類別和次類別，這個軟體會使用 AI 自動選出主類別和次類別</p>
        </div>
      </div>

      <button style={{
        width: '19vw',
        height: '10vh',
        margin: '1rem',
        fontSize: '1.35rem',
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

