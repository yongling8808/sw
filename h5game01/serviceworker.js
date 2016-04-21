importScripts('serviceworker-cache-polyfill.js');
 
const OFFLINE_CACHE = 'h5game01_v1';

this.addEventListener('install', function(event) {

event.waitUntil(
    caches.open(OFFLINE_CACHE).then(function(cache) {
      return cache.addAll([
        'sw/h5game01/index.html',
        'sw/h5game01/css/base.css',
        'sw/h5game01/css/ps.css',
        'sw/h5game01/css/reset.css',
        'sw/h5game01/img/screen.png',
        'sw/h5game01/js/base.js',
        'sw/h5game01/js/circle.js',
        'sw/h5game01/js/core.js',
        'sw/h5game01/js/stick.js',
        'sw/h5game01/js/underscore.min.js',
        'sw/h5game01/js/zepto.min-1.1.4.js',
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