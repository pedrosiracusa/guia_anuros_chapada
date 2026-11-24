---
layout: null
---
const CACHE_NAME = "anfibios-veadeiros-{{ site.time | date: '%Y%m%d%H%M%S' }}";

// 1. Core shell + all HTML pages + CSS + JS + JSON + fonts (~1-2 MB, fast install)
const CORE_URLS = [
  {{ '/' | relative_url | jsonify }},
  {{ '/assets/main.css' | relative_url | jsonify }},
  {{ '/manifest.webmanifest' | relative_url | jsonify }},
  {%- for page in site.pages -%}
    {%- if page.url contains '.js' and page.url != '/sw.js' -%}
      {{ page.url | relative_url | jsonify }},
    {%- endif -%}
  {%- endfor -%}
  {%- for page in site.html_pages -%}
    {%- unless page.url contains '404' or page.url contains 'aa. readme' or page.url contains 'a. modelo' or page.url contains 'dedrobatidae' or page.url contains 'leptodactylus tapiti' or page.url contains '/assets/' -%}
      {{ page.url | relative_url | jsonify }},
    {%- endunless -%}
  {%- endfor -%}
  {%- for file in site.static_files -%}
    {%- if file.path contains '/assets/javascript/' or file.path contains '/assets/data/' or file.path contains '/assets/sprite/' or file.path contains '/assets/bootstrap-icons/font/' or file.path contains '/assets/img/pwa/' -%}
      {{ file.path | relative_url | jsonify }},
    {%- endif -%}
  {%- endfor -%}
];

// 2. Heavy media: species photos, diagnose images, habitat icons, audio calls (~30 MB)
const MEDIA_URLS = [
  {%- for file in site.static_files -%}
    {%- if (file.path contains '/assets/img/' or file.path contains '/assets/audio/') and not (file.path contains '/assets/img/pwa/') -%}
      {{ file.path | relative_url | jsonify }},
    {%- endif -%}
  {%- endfor -%}
];

async function cacheUrlClean(cache, url) {
  const existing = await cache.match(url, { ignoreSearch: true });
  if (existing) return;

  const res = await fetch(url);
  if (!res.ok) return;

  // Cloudflare Pages / Pretty URLs may 308-redirect .html -> extensionless;
  // browsers reject returning a `redirected: true` Response for navigate requests.
  const cleanRes = res.redirected
    ? new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      })
    : res;

  await cache.put(url, cleanRes.clone());
  if (res.redirected && res.url) {
    await cache.put(new URL(res.url).pathname, cleanRes);
  }
}

async function precacheInBatches(cache, urls, batchSize = 6, onProgress = null) {
  let done = 0;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (url) => {
        try {
          await cacheUrlClean(cache, url);
        } catch (err) {
          console.warn("Precache skipped for:", url, err);
        } finally {
          done += 1;
        }
      })
    );
    if (onProgress) onProgress(done, urls.length);
  }
}

async function broadcastProgress(done, total) {
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    client.postMessage({ type: "OFFLINE_PROGRESS", done, total });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => precacheInBatches(cache, CORE_URLS, 6))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();

      // Download images and audio in the background once SW is active
      const cache = await caches.open(CACHE_NAME);
      await precacheInBatches(cache, MEDIA_URLS, 6, broadcastProgress);
    })()
  );
});

async function handleRangeRequest(request, cachedResponse) {
  const rangeHeader = request.headers.get("range");
  if (!rangeHeader || !cachedResponse) return cachedResponse;

  const bytes = await cachedResponse.arrayBuffer();
  const match = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);
  if (!match) return cachedResponse;

  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : bytes.byteLength - 1;
  const sliced = bytes.slice(start, end + 1);

  return new Response(sliced, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": cachedResponse.headers.get("Content-Type") || "application/octet-stream",
      "Content-Range": `bytes ${start}-${end}/${bytes.byteLength}`,
      "Content-Length": String(sliced.byteLength),
    },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Handle Range requests (e.g., audio playback on Safari/iOS)
  if (request.headers.has("range")) {
    event.respondWith(
      caches.match(url.pathname, { ignoreSearch: true }).then((cached) => {
        if (cached) return handleRangeRequest(request, cached);
        return fetch(request);
      })
    );
    return;
  }

  const isDocumentOrData =
    request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".json") ||
    !url.pathname.split("/").pop().includes(".");

  if (isDocumentOrData) {
    // Stale-while-revalidate: instant offline/field load, updates in background when online
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cleanPath = url.pathname.replace(/\/$/, "");
        const cached =
          (await cache.match(request, { ignoreSearch: true })) ||
          (await cache.match(cleanPath + ".html")) ||
          (await cache.match(cleanPath + "/")) ||
          (await cache.match(cleanPath + "/index.html"));

        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok && !response.redirected) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        if (cached) {
          event.waitUntil(networkFetch);
          return cached;
        }

        const networkResponse = await networkFetch;
        if (networkResponse) return networkResponse;

        return cache.match({{ '/' | relative_url | jsonify }});
      })
    );
    return;
  }

  // Cache-first for static assets (images, audio, CSS, JS, fonts)
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok && !response.redirected) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
