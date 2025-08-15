import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from '@shared/services/axios';

console.log(import.meta.env.VITE_FIREBASE_CONFIG);
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);


console.log("Firebase initialized:", app);
console.log("Messaging object:", messaging);

const subscribeToTopics = async () => {
  console.log("A começar . . .");
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.error("Notification permission denied");
      return;
    }

    console.log("Requesting token...");
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPI_KEY,
    }).catch((error) => {
      console.error("Error getting token:", error);
      throw error;
    });

    console.log('Token gerado ' + token);

    if (token) {
      console.log("Token received, subscribing to topics...");
      const res = await api.post('/notificacao/devicesub', { device: token });

      if (res.status == 200) {
        console.log('Subscribed to topics successfully');
      } else {
        console.error('Failed to subscribe to topics');
      }
    } else {
      console.error('No device token available');
    }
  } catch (error) {
    console.error('Error getting device token or subscribing to topics:', error);
  }
};

export { messaging, getToken, onMessage, subscribeToTopics };
