const OFFLINE_CACHE = 'v5';

this.addEventListener('install', function(event) {

event.waitUntil(
    caches.open(OFFLINE_CACHE).then(function(cache) {
      return cache.addAll([
        '/sw/tmp/kwwk/index.html',
        '/sw/tmp/kwwk/snowTroopers.jpg',
        '/sw/tmp/kwwk/app.js',
      ]);
    })
  );
          
});
 

this.addEventListener('activate', function(event) {
});
   
 
this.addEventListener('fetch', function(event)  {
  event.respondWith(
        caches.open(OFFLINE_CACHE).then(function(cache) {
          return cache.match(event.request.url);
        })
    ); 
}); 