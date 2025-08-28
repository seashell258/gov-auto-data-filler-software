import { useEffect, useState } from 'react';

type Props = {
  _dataA: Array<[string, string, string]>;
  onProvidingData: (dataA: Array<[string, string, string]>) => void;
};


export default function StepTwoProvideData({ _dataA, onProvidingData }: Props) {

  const [text, setText] = useState('');

  useEffect(() => {          // 把_dataA再傳進來 搭配上這段，可以讓使用者再切換模式後還是能保留自己原本的輸入，不會全部消失
    if (_dataA && _dataA.length > 0) {
      const formatted = _dataA.map(item => item.join(',')).join('\n');
      setText(formatted);
    }
  }, [_dataA]);

  // 資料沒有在子元件的話，其實可以讓父元件隨意傳個不吃參數的函數，這邊只是按下按鈕，通知父元件執行。
  // 因為父元件有所有狀態變數的資料，比較方便。  provideDataC就有用到這個做法。
  const handleClick = async () => {
    const parsed: [string, string, string][] = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [date, cost, factory] = line.split(',');
        return [date, cost, factory];
      });

    console.log('前端列印 parsed:', parsed,)
    // 先跑這行再跑下面的await 看能不能提早解鎖輸入框的輸入。 現在按下按鈕之後 輸入框會鎖。改了後還是沒效果
    // 切頻回來之後就可以繼續輸入
    onProvidingData(parsed);  //有逗號，沒填資料。那一格後端會收到空字串；沒填逗號，會是undefined
    // 但前端經過 JSON.strinify 之後 undefiend會變成 null

    const result = await window.electronAPI.updateDataA(parsed);   //等待後端回傳
    alert(result.message + '\n資料：' + JSON.stringify(result.dataA)); //跳通知讓使用者知道成功


  };



  return (

    <div>
      <h3 style={{color:'#F5F5DC'}}>輸入資料（模式 A）</h3>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',  // 靠上對齊
        gap: '2rem',               // 中間間距
      }}>
        <textarea style={{
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
          value={text}
          onChange={(e) => setText(e.target.value)} //這行跟上面都是為了捕捉textarea的文字 然後讓buttont傳送給父元件
        />
        <div style={{fontSize:'2rem',color:'#F5F5DC'}}>
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
