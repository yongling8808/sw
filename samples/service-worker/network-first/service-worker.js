//cachestorage名称，可以加上版本号予以区分
const OFFLINE_CACHE_PREFIX = 'network_first_';
const CACHE_VERSION = 'v1.0';
const OFFLINE_CACHE_NAME = OFFLINE_CACHE_PREFIX + CACHE_VERSION;

//Service Worker安装事件，其中可以预缓存资源
this.addEventListener('install', function(event) {
  
  //需要缓存的页面资源
  var urlsToPrefetch = [
    './index.html',
    './images/banner.png',
    './css/main.css',
    './js/main.js',
  ];

  event.waitUntil(
    caches.open(OFFLINE_CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToPrefetch);
    })
  );      
});
 
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
   

//Service Worker 请求拦截事件
this.addEventListener('fetch', function(event)  {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.open(OFFLINE_CACHE_NAME).then(function(cache) {
        return cache.match(event.request.url);
      });
    })
  );
});