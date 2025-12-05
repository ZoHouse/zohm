'use client';

import { useEffect } from 'react';
import { devLog } from '@/lib/logger';

/**
 * Service Worker Registration Component
 * 
 * Registers the service worker for offline caching and PWA functionality.
 * Only runs on client-side in production.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in production
    if (process.env.NODE_ENV !== 'production') {
      devLog.log('🔧 [SW] Skipping service worker registration in development');
      
      // Clear any production service worker cache that might persist
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
            devLog.log('🗑️ [SW] Unregistered service worker from dev environment');
          });
        });
        
        // Clear caches
        if ('caches' in window) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              caches.delete(cacheName);
              devLog.log('🗑️ [SW] Deleted cache:', cacheName);
            });
          });
        }
      }
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      devLog.warn('⚠️ [SW] Service workers not supported in this browser');
      return;
    }

    // Register service worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        devLog.log('✅ [SW] Service worker registered successfully');
        devLog.log('📍 [SW] Scope:', registration.scope);

        // Check for updates on page load
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          devLog.log('🔄 [SW] Update found, installing new version...');

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker installed, but old one still controls the page
                devLog.log('🆕 [SW] New version available! Refresh to update.');
                
                // Optionally, you could show a toast notification here
                // telling the user a new version is available
              }
            });
          }
        });

        // Check for updates periodically (every hour)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

      } catch (error) {
        devLog.error('❌ [SW] Service worker registration failed:', error);
      }
    };

    // Register on load
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerServiceWorker);
    } else {
      registerServiceWorker();
    }

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      devLog.log('📬 [SW] Message received:', event.data);
    });

    // Cleanup
    return () => {
      // No cleanup needed for service worker
    };
  }, []);

  // This component doesn't render anything
  return null;
}

