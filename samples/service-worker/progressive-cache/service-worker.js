//cachestorage名称，可以加上版本号予以区分
const OFFLINE_CACHE_PREFIX = 'progressive_cache_';
const CACHE_VERSION = 'v1.0';
const OFFLINE_CACHE_NAME = OFFLINE_CACHE_PREFIX + CACHE_VERSION;
 
//Service Worker激活事件
this.addEventListener('activate', function(event) {
  //在激活事件中清除非当前版本的缓存避免用户存储空间急剧膨胀
  event.waitUntil(caches.keys().then(function(cacheNames) {
    return Promise.all(cacheNames.map(function(cacheName) {
        if (cacheName !== OFFLINE_CACHE_NAME) {
          if(cacheName.indexOf(OFFLINE_CACHE_PREFIX) != -1) {
            return caches.delete(cacheName);
          }
        }
    }));
  }));
});


var addToCache = function(req) {   
  return fetch(req.clone()).then(function(resp) {   
    var cacheResp = resp.clone();
    if (!resp.ok) {
      return resp;
    }
    caches.open(OFFLINE_CACHE_NAME).then(function(cache) {
      cache.put(req.clone(), cacheResp);
    });
    return resp;
  });
};
   

//Service Worker 请求拦截事件
this.addEventListener('fetch', function(event)  {
  event.respondWith(
     caches.open(OFFLINE_CACHE_NAME).then(function(cache) {
          return cache.match(req);
      }).then(function(response) {
        if (response) {
            return response;
        } else {
            return addToCache(req);
        }
    })
  ); 
});