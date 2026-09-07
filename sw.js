/* ============================================================
   sw.js - Service Worker لتطبيق متجر مشالى (PWA)
   يخزن الملفات الأساسية مؤقتاً ليعمل التطبيق أونلاين/أوفلاين
   ============================================================ */
const CACHE_NAME = 'mashily-store-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './excel-loader.js',
  './xlsx.full.min.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  './signature.png'
];

// التثبيت: خزّن الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

// التفعيل: حذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// الجلب: استراتيجية "شبكة أولاً ثم كاش" للملفات، وكاش أولاً للثابت
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // تجاهل الطلبات غير المتطابقة (مثل CDN خارجي)
  if (url.origin !== location.origin) return;

  // ملفات البيانات تُجلب من الشبكة دائماً (للتحديثات)
  if (url.pathname.includes('store-data.xlsx') || url.pathname.includes('db.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // بقية الملفات: شبكة أولاً ثم كاش
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
