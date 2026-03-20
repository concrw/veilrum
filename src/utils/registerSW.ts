export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available
              console.log('[PWA] New version available');

              // Notify user about update
              if (confirm('New version available! Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Controller changed, reloading...');
        window.location.reload();
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }
}

export async function requestNotificationPermission() {
  if ('Notification' in window && 'PushManager' in window) {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  }
  return 'denied';
}

export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration,
  supabaseClient?: { from: (table: string) => unknown }
) {
  try {
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      console.log('[PWA] Notification permission denied');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      ),
    });

    console.log('[PWA] Push subscription:', subscription);

    // Save subscription to database if supabase client provided
    if (supabaseClient && subscription) {
      await saveSubscriptionToDatabase(subscription, supabaseClient);
    }

    return subscription;
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
    return null;
  }
}

async function saveSubscriptionToDatabase(
  subscription: PushSubscription,
  supabaseClient: { from: (table: string) => unknown }
) {
  try {
    const subscriptionJson = subscription.toJSON();
    const keys = subscriptionJson.keys as { p256dh: string; auth: string } | undefined;

    if (!keys?.p256dh || !keys?.auth) {
      console.error('[PWA] Missing subscription keys');
      return;
    }

    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: navigator.userAgent,
      is_active: true,
    };

    // @ts-expect-error - Supabase client type not fully specified
    const { error } = await supabaseClient
      .from('push_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id,endpoint',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('[PWA] Failed to save subscription:', error);
    } else {
      console.log('[PWA] Subscription saved to database');
    }
  } catch (error) {
    console.error('[PWA] Error saving subscription:', error);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function unsubscribeFromPushNotifications(
  supabaseClient?: { from: (table: string) => unknown }
) {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove from database if supabase client provided
      if (supabaseClient) {
        try {
          // @ts-expect-error - Supabase client type not fully specified
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint);
          console.log('[PWA] Subscription removed from database');
        } catch (error) {
          console.error('[PWA] Error removing subscription from database:', error);
        }
      }

      await subscription.unsubscribe();
      console.log('[PWA] Unsubscribed from push notifications');
    }
  }
}

export function checkPWAInstallability() {
  let deferredPrompt: Event | null = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt available');
  });

  return {
    showInstallPrompt: async () => {
      if (!deferredPrompt) {
        console.log('[PWA] Install prompt not available');
        return false;
      }

      // @ts-expect-error - BeforeInstallPromptEvent type not recognized
      deferredPrompt.prompt();
      // @ts-expect-error - BeforeInstallPromptEvent type not recognized
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);
      deferredPrompt = null;
      return outcome === 'accepted';
    },
  };
}
