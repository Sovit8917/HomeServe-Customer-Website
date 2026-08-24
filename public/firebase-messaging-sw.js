// Firebase Cloud Messaging service worker — handles push notifications
// that arrive while the customer app isn't the active tab. Must live at
// the site root (not /public/firebase/...) so its scope covers the app.
//
// This can't read process.env (it's not part of the Next.js build), so
// the same NEXT_PUBLIC_FIREBASE_* config used in lib/firebase.ts is
// duplicated here as plain values. These are public client keys — safe
// to ship in a static file, same as they are in any client bundle.
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// NOTE: replace with your actual Firebase web config, or generate this
// file from env vars at build/deploy time — see README for the swap-in.
firebase.initializeApp({
  apiKey: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_APP_ID',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'HomeServe';
  const options = {
    body: payload.notification?.body,
    icon: '/file.svg',
    data: payload.data,
  };
  self.registration.showNotification(title, options);
});

// Route the customer to the relevant screen when they tap a background
// notification, e.g. straight to the booking it's about.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.bookingId
    ? `/bookings/${event.notification.data.bookingId}`
    : '/notifications';
  event.waitUntil(clients.openWindow(url));
});
