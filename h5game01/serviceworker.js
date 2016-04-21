importScripts('serviceworker-cache-polyfill.js');
 
const OFFLINE_CACHE = 'h5game01_v1';

this.addEventListener('install', function(event) {

event.waitUntil(
    caches.open(OFFLINE_CACHE).then(function(cache) {
      return cache.addAll([
        'index.html',
        'css/base.css',
        'css/ps.css',
        'css/reset.css',
        'img/screen.png',
        'js/base.js',
        'js/circle.js',
        'js/core.js',
        'js/stick.js',
        'js/underscore.min.js',
        'js/zepto.min-1.1.4.js',
      ]);
    })
  );
          
});
 

this.addEventListener('activate', function(event) {
    console.log('serviceworker activate');
});
   
 
this.addEventListener('fetch', function(event)  {
 
  console.log('serviceworker thread onfetch function');
  console.log('this comes frome server!');
  console.log('Handling fetch event for '+ event.request.url);
  event.respondWith(
        caches.open(OFFLINE_CACHE).then(function(cache) {
          console.log('load from cache:'+ event.request.url);
          return cache.match(event.request.url);
        })
    ); 
  console.log('Handling fetch event end!');
}); 