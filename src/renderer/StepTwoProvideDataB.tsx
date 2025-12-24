import { useEffect, useRef, useState } from 'react';
import { commonToastOptions } from './FrontEndUtils/errorMessageStyles';
import { toast } from 'react-toastify';

type Props = {
  _dataB: [string, string] | []
  onProvidingData: (dataB: [string, string]) => void;
};


export default function StepTwoProvideData({ _dataB, onProvidingData }: Props) {

  const textRef = useRef<HTMLInputElement>(null);

  useEffect(() => {          // 把_dataB再傳進來 搭配上這段，可以讓使用者再切換模式後還是能保留自己原本的輸入，不會全部消失
    if (_dataB && _dataB.length > 0) {
      const formatted = _dataB.join(',')
      if (textRef.current) {
        textRef.current.focus();
        textRef.current.value = formatted;  // 靠著每次渲染重新填充，保存 input 的內容為更新後的 dataB

      }
    }
  }, []);
  const handleClick = async () => {
    const value = textRef.current!.value;
    const [startDate, endDate] = value.split(',').map(s => s.trim());

    const parsed: [string, string] = [startDate, endDate];

    console.log('Bparsed', parsed);

    onProvidingData(parsed);
    const result = await window.electronAPI.updateDataB(parsed);
    toast.error(result.message + '\n伺服器取得資料：' + JSON.stringify(result.dataB), {//跳通知讓使用者知道成功
      ...commonToastOptions,
      onClose: () => textRef.current?.focus(),
    });
  };


  return (
    <div>
      <h2 style={{ color: '#F5F5DC' }}>輸入資料（模式 B）</h2>
      <div>
        <input ref={textRef}
          type="text"
          style={{
            width: '45vw',
            padding: '0.5rem 1rem',
            fontSize: '1.125rem',       // text-lg
            lineHeight: '1.75rem',      // leading-relaxed
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontFamily: 'sans-serif',
          }}
          className="dataProvidedB"
          placeholder="公文要從哪一天填到哪一天？   比如 1140610,1140710"
        />
      </div>

      <div style={{ fontSize: '2rem', color: '#F5F5DC' }}>
        <p>格式：</p>
        <pre>
          日期1,日期2  比如 1140610,1140710  </pre>
      </div>

      <button style={{
        width: '19vw',
        height: '10vh',
        margin: '4rem',
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
