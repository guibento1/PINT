// web/frontend/backOffice/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { messaging, getToken, onMessage } from "@shared/services/firebase";
import App from './App.jsx';
import '../../shared/styles/global.css';


const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const user = urlParams.get('user');

onMessage(messaging, (payload) => {
  console.log('Foreground message received:', payload);
});

if (token) {
  sessionStorage.setItem('token', token);
  window.history.replaceState({}, document.title, '/'); 
}

if (user) {
  try {
    const decodedUser = JSON.parse(decodeURIComponent(user));
    sessionStorage.setItem('user', JSON.stringify(decodedUser));
  } catch (err) {
    console.error('Erro ao decodificar o user:', err);
  }
}

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <App />
  </StrictMode>
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
