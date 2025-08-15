//web\frontend\frontOffice\src\main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { messaging, getToken, onMessage } from "@shared/services/firebase";
import App from './App.jsx'
import '../../shared/styles/global.css';

onMessage(messaging, (payload) => {
  console.log('Foreground message received:', payload);
});


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
};
