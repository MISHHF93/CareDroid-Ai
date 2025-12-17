import { lazy } from 'react';

// Wrap React.lazy dynamic imports to handle transient chunk load failures
export default function lazyWithRetry(factory) {
  const wrappedFactory = () =>
    factory().catch((error) => {
      const message = String(error && (error.message || error));
      const shouldReload = /Failed to fetch dynamically imported module|ChunkLoadError|Importing a module script failed/i.test(message);
      if (shouldReload && typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('v', Date.now().toString());
          window.location.replace(url.toString());
          // Return a pending promise to satisfy React.lazy while reload happens
          return new Promise(() => {});
        } catch (_) {
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw error;
    });

  return lazy(wrappedFactory);
}
