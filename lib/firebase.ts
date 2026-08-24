'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';

// Same NEXT_PUBLIC_FIREBASE_* config as the customer Firebase project the
// backend already targets (config/app.config.ts -> firebase.customer.*) —
// the web app just needs the public client config, not the admin keys.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function isFirebaseConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

let messagingInstance: Messaging | null = null;

async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (messagingInstance) return messagingInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

/**
 * Requests notification permission (if not already decided) and returns
 * an FCM registration token, or null if permission was denied, the
 * browser doesn't support push, or Firebase isn't configured for this
 * deployment. Never throws — push notifications are an enhancement, not
 * something that should block the app.
 */
export async function requestFcmToken(): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    if (Notification.permission === 'denied') return null;
    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch {
    // Any failure here (blocked SW registration, browser quirk, etc.)
    // just means no push for this session — not worth surfacing to the user.
    return null;
  }
}

/**
 * Web equivalent of the mobile app's native Google Sign-In: pops up
 * Google's account chooser, then returns the Firebase ID token so it can
 * be verified the exact same way as the mobile app does — by POSTing it
 * to the backend's /auth/google (see AuthController.googleLogin /
 * AuthService.googleMobileLogin, which just verifies a Firebase ID token
 * regardless of whether it came from a native SDK or the web SDK).
 */
export async function signInWithGooglePopup(): Promise<string> {
  const app = getFirebaseApp();
  if (!app) throw new Error('Google sign-in is not configured for this deployment');
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return idToken;
}

/** Subscribes to messages that arrive while the app is in the foreground. */
export async function onForegroundMessage(callback: (payload: { title?: string; body?: string }) => void) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
    });
  });
}
