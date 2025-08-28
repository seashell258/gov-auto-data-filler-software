import ReactDOM from 'react-dom/client';
import App from './App'; //不用.tsx 它會自動搜尋 .ts 或 .tsx 等等的文件

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
