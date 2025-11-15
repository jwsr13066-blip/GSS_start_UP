const CACHE_NAME = "gss-pwa-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png",
  "./og_image.png"
];

// 설치 단계에서 캐시
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 활성화 단계에서 오래된 캐시 정리
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 네트워크 요청 가로채서 캐시 우선 전략 사용
self.addEventListener("fetch", event => {
  const { request } = event;

  // GET 요청만 처리
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(networkResponse => {
          // 정적 파일은 캐시에 저장
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
          return networkResponse;
        })
        .catch(() => {
          // 완전 오프라인일 때 fallback이 필요하면 여기 추가
          return caches.match("./index.html");
        });
    })
  );
});
