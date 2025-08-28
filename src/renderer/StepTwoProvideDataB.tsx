import { useState } from 'react';

type Props = {
  onProvidingData: (dataB: [string, string]) => void;
};


export default function StepTwoProvideData({ onProvidingData }: Props) {

  const [text, setText] = useState('');

  const handleClick = async () => {
    const [startDate, endDate] = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.split(',').map(s => s.trim()))[0];

    const parsed: [string, string] = [startDate, endDate]

    console.log('Bparsed', parsed)

    const result = await window.electronAPI.updateDataB(parsed);   //等待後端回傳
    alert(result.message + '\n資料：' + JSON.stringify(result.dataB)); //跳通知讓使用者知道成功
    onProvidingData(parsed);  //有逗號，沒填資料。那一格後端會收到空字串；沒填逗號，會是undefined
    // 但前端經過 JSON.strinify 之後 undefiend會變成 null
    onProvidingData(parsed);
  };

  return (
    <div>
      <h2 style={{ color: '#F5F5DC' }}>輸入資料（模式 B）</h2>
      <div>
        <input
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
          className="dataProvidedA"
          value={text}
          onChange={(e) => setText(e.target.value)} // 維持雙向綁定
          placeholder="公文要從哪一天填到哪一天？   比如 1140610,1140710"　 
        />
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
