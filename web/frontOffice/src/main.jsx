//web\frontend\frontOffice\src\main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { messaging } from '@shared/config/firebase';
import App from './App.jsx'
import '../../shared/styles/global.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('@shared/public/firebase-messaging-sw.js')
    .then((registration) => {
      messaging.useServiceWorker(registration);
    });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
