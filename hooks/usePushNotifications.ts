import { useState, useEffect, useCallback } from 'react';
import { useUI } from '../contexts/UIContext';
import { APP_CONFIG } from '../utils/config';

// The VAPID public key from your backend.
const VAPID_PUBLIC_KEY = 'BGvGJjrIF5hse5btEpDw6BWFBQZP67ZuCkPLXHXxKv9rz_lfBFSrLfo7rgYs2qhCQl7HHRYjD1BcQ2r-AsDTiB8';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

export const usePushNotifications = () => {
    const { showToast, t } = useUI();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setIsLoading(true);
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(sub => {
                    if (sub) {
                        setIsSubscribed(true);
                        setSubscription(sub);
                    }
                }).catch(err => {
                    console.error("Error getting subscription:", err);
                }).finally(() => {
                    setIsLoading(false);
                });
            }).catch(err => {
                 console.error("Service worker not ready:", err);
                 setIsLoading(false);
            });
        } else {
            setIsLoading(false);
            setIsSupported(false);
        }
    }, []);

    const subscribeToPush = useCallback(async () => {
        if (!isSupported) {
            showToast('Push notifications are not supported by this browser.');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                showToast(t.notificationsBlocked);
                return;
            }
            
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // Send subscription to backend
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}subscribe.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub.toJSON()),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send subscription to server.');
            }

            setSubscription(sub);
            setIsSubscribed(true);
            showToast(t.pushSubscriptionSuccess);

        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            showToast(t.pushSubscriptionFailed);
        }
    }, [showToast, t, isSupported]);

    const unsubscribeFromPush = useCallback(async () => {
        if (!subscription) return;

        try {
            // Send unsubscription request to backend first
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}unsubscribe.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint }),
            });

             if (!response.ok) {
                throw new Error('Failed to send unsubscription to server.');
            }

            await subscription.unsubscribe();

            setSubscription(null);
            setIsSubscribed(false);
            showToast(t.pushUnsubscriptionSuccess);

        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            showToast(t.pushUnsubscriptionFailed);
        }
    }, [subscription, showToast, t]);

    const toggleSubscription = () => {
        setIsLoading(true);
        if (isSubscribed) {
            unsubscribeFromPush().finally(() => setIsLoading(false));
        } else {
            subscribeToPush().finally(() => setIsLoading(false));
        }
    };
    
    return { isSubscribed, toggleSubscription, isLoading, isSupported };
};