import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from '@shared/services/axios';
import firebaseConfig from '@shared/config/firebase.js'; // única fonte

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const subscribeToTopics = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPI_KEY,
    });
    if (!token) return;

    const res = await api.post('/notificacao/devicesub', { device: token });
    if (res.status !== 200) {
      console.error('Falha ao subscrever tópicos');
    }
  } catch (err) {
    console.error('Erro subscribeToTopics', err);
  }
};

export { messaging, getToken, onMessage, subscribeToTopics };