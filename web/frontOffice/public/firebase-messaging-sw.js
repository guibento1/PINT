importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCjhzGENdSl7SHv8G7lYBW36aAj0HBVyxI",
  authDomain: "thesoftskills-2025.firebaseapp.com",
  projectId: "thesoftskills-2025",
  storageBucket: "thesoftskills-2025.firebasestorage.app",
  messagingSenderId: "336298599663",
  appId: "1:336298599663:web:37466f1906c3ab1bc0e71a"
});

const messaging = firebase.messaging();

try {
  const bc = new BroadcastChannel('notifs');
  messaging.onBackgroundMessage((payload) => {
    bc.postMessage({ type: 'nova' });
    self.registration.showNotification(
      payload.notification?.title || 'Nova notificação',
      { body: payload.notification?.body || '' }
    );
  });
} catch (_) {}