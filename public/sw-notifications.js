/**
 * Service Worker for web push notifications.
 * Handles push events and notification click routing.
 */

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, url, tag } = data;

  event.waitUntil(
    self.registration.showNotification(title || 'Astrologer', {
      body: body || 'You have a new notification',
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: tag || 'community-notification',
      data: { url: url || '/community' },
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/community';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if possible
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});
