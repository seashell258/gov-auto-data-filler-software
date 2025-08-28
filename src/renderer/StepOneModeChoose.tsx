type Props = {
  onSelectMode: (mode: 'A' | 'B' | 'C') => void;   //子元件可以又提供 mode 又讓父元件傳 mode 回來當渲染的條件。 
  mode: 'A' | 'B' | 'C' | null;               // 因為子元件會先呼叫父元件函數，
                                             // 更新了父元件的mode 然後父元件再觸發重渲染。
};

 const buttonStyle = (active: boolean) => ({
    marginRight: 12,
    marginBottom:25,
    padding: '18px 18px',
    fontSize:'25px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: active ? '#bd7e21ff' : '#fdf3e3ff',        
    color: active ? '#ffffff' : '#5C3A21',
    fontWeight: active ? '600' : '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: active ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
  });

export default function StepOneModeChoose({ onSelectMode,mode }: Props) {
  return (
    <div>
      <h2 style={{color:'#F5F5DC'}}>請選擇模式</h2>
            <button
  style={buttonStyle(mode === 'A')}
  onClick={() => onSelectMode('A')}
>模式 身障團體成交金額(A)</button>

      <button
  style={buttonStyle(mode === 'B')}
  onClick={() => onSelectMode('B')}
>模式 經公告/議價未成交金額(B)</button>

            <button
  style={buttonStyle(mode === 'C')}
  onClick={() => onSelectMode('C')}
>模式 不經優採成交金額(C)</button>
    </div>
  );
}
