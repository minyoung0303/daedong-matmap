import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react';
import './index.css'
import App from './App.jsx'

// 카카오 js 키 확인
// useEffect(() => {
//   console.log(import.meta.env.VITE_KAKAO_JS_KEY);
// }, []);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
