'use client';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { usersApi } from '@/lib/api';
import { requestFcmToken, onForegroundMessage } from '@/lib/firebase';

// Registers this browser for push notifications once the customer is
// logged in, and shows a toast for any that arrive while the tab is
// open (background/closed-tab notifications are handled by the service
// worker itself — see public/firebase-messaging-sw.js).
//
// Silent by design: a customer with notifications blocked, an
// unsupported browser, or no Firebase config configured for this
// deployment should see no difference in the app at all.
const LAST_REGISTERED_TOKEN_KEY = 'hs_fcm_token_registered';

export default function PushNotificationManager() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const token = await requestFcmToken();
      if (!token || cancelled) return;

      // Avoid re-PUTting the same token every mount/navigation — only
      // register when it's actually new for this browser.
      const last = typeof window !== 'undefined' ? localStorage.getItem(LAST_REGISTERED_TOKEN_KEY) : null;
      if (last === token) return;

      try {
        await usersApi.updateFcmToken(token);
        localStorage.setItem(LAST_REGISTERED_TOKEN_KEY, token);
      } catch {
        // Non-fatal — booking/status notifications still show up in-app
        // via the notifications list even if push registration failed.
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let unsubscribe: (() => void) | undefined;

    onForegroundMessage(({ title, body }) => {
      toast(body || title || 'You have a new notification', { icon: '🔔' });
    }).then((unsub) => { unsubscribe = unsub; });

    return () => unsubscribe?.();
  }, [user]);

  return null;
}
