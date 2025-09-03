import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import api from "@shared/services/axios";

const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const subscribeToTopics = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.error("Notification permission denied");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPI_KEY,
    }).catch((error) => {
      console.error("Error getting token:", error);
      throw error;
    });

    if (token) {
      let res = await api.post("/notificacao/deviceregister", {
        device: token,
      });

      if (res.status == 200) {
        //registrado com sucesso
      } else {
        console.error("Failed to register token");
      }

      res = await api.post("/notificacao/devicesub", { device: token });

      if (res.status == 200) {
        //inscrito com sucesso
      } else {
        console.error("Failed to subscribe to topics");
      }
    } else {
      console.error("No device token available");
    }
  } catch (error) {
    console.error(
      "Error getting device token or subscribing to topics:",
      error
    );
  }
};

export { messaging, getToken, onMessage, subscribeToTopics };
