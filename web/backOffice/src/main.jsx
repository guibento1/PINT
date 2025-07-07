// web/frontend/backOffice/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '../../shared/styles/global.css';

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const user = urlParams.get('user');

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
