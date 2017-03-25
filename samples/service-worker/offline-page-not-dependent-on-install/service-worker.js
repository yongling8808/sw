//cachestorage名称，可以加上版本号予以区分
const OFFLINE_CACHE_PREFIX = 'offline_page_not_dependent_on_install_';
const CACHE_VERSION = 'v1.0';
const OFFLINE_CACHE_NAME = OFFLINE_CACHE_PREFIX + CACHE_VERSION;

//Service Worker安装事件，其中可以预缓存资源
this.addEventListener('install', function(event) {
  
  //需要缓存的重要的高优先级资源
  var vipUrlsToPrefetch = [
    './index.html',
  ];

  //次重要的资源
  var urlsToPrefetch = [
    './images/banner.png',
    './css/main.css',
    './js/main.js',
  ];

  event.waitUntil(
    caches.open(OFFLINE_CACHE_NAME).then(function(cache) {
      //urlsToPrefetch非重要资源，即使有资源加载失败也不影响Service Worker安装
      cache.addAll(urlsToPrefetch);
      //vipUrlsToPrefetch中资源全部请求成功，Service Worker安装事件才顺利完成，可以进入激活事件
      return cache.addAll(vipUrlsToPrefetch);
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
    caches.open(OFFLINE_CACHE_NAME).then(function(cache) {
      return cache.match(event.request.url);
    }).then(function(response){
      //response为空表明未匹配成功，交由fetch方法去网络拉取
      if(response) {
        return response;
      }
      return fetch(event.request);
    })
  ); 
});