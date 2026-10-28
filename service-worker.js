
const CACHE_NAME = "your-safe-circle-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];

//
// Install: save the essential files on the device.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_FILES);
    })
  );

  self.skipWaiting();
});

// Activate: remove old versions of this app's cache.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("your-safe-circle-") &&
              key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// Fetch: serve saved files when offline.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle normal page and file requests.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Do not intercept requests to other websites.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      // Use the saved version first, even when offline.
      if (cachedResponse) {
        return cachedResponse;
      }

      // Try the network for files that are not cached.
      try {
        return await fetch(request);
      } catch (error) {
        // If a page is requested offline, show the saved home page.
        if (request.mode === "navigate") {
          const offlinePage = await caches.match("./index.html");

          if (offlinePage) {
            return offlinePage;
          }
        }

        return new Response("This resource is unavailable offline.", {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        });
      }
    })
  );
});
