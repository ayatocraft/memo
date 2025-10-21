// Service Workerをインストール可能にするための最小限のコード
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});