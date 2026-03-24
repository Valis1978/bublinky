'use client';

import { useEffect, useState } from 'react';

export function usePushNotifications(userId: string | null) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!userId || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function subscribe() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidKey) return;

          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
          });
        }

        // Send subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            userId,
          }),
        });

        setIsSubscribed(true);
      } catch (err) {
        console.error('Push subscribe error:', err);
      }
    }

    subscribe();
  }, [userId]);

  return { isSubscribed };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
