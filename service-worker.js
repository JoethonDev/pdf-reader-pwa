const CACHE_NAME = 'didymus-institute-v1';

// قائمة الموارد المراد تخزينها تخزيناً مسبقاً للعمل دون إنترنت نهائياً
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'logo.jpg',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Scheherazade+New:wght@400;700&display=swap',
  
  // ملفات كتب المنهج الدراسي الخمسة المحددة
  'books/book1.pdf',
  'books/book2.pdf',
  'books/book3.pdf',
  'books/book4.pdf',
  'books/book5.pdf',
  
  // ملفات مكتبة الرندرة ومكونات عارض PDF.js المدمج
  'pdfjs/build/pdf.js',
  'pdfjs/build/pdf.worker.js',
  'pdfjs/web/viewer.html',
  'pdfjs/web/viewer.css',
  'pdfjs/web/viewer.js'
];

// مرحلة التثبيت: بناء الكاش وحفظ الملفات دفعة واحدة
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA Offline Cache Opening... Pre-caching Core PDF System Assets.');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// مرحلة التنشيط: حذف أي كاش قديم لضمان تحديث التطبيق عند تعديله مستقبلاً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing Obsolete System Cache Storage Assets:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// إستراتيجية جلب البيانات (Cache-First): إسترجاع فوري للملفات المخزنة محلياً لتوفير البيانات وسرعة العمل للأجهزة الضعيفة
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // إرجاع نسخة الكاش الفورية
      }
      
      // إذا لم يكن متواجداً في الكاش المسبق (مثل خطوط خارجية إضافية)، قم بجلبه من الشبكة وحفظه تالياً
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // إدارة أخطاء انقطاع الاتصال التام للموارد الغير مخزنة
        console.log('Resource Unavailable Offline:', event.request.url);
      });
    })
  );
});