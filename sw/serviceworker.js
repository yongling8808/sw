importScripts('serviceworker-cache-polyfill.js');

const OFFLINE_CACHE = 'v5';

this.addEventListener('install', function(event) {

event.waitUntil(
    caches.open(OFFLINE_CACHE).then(function(cache) {
      return cache.addAll([
        '/sw/sw/index.html',
        '/sw/sw/snowTroopers.jpg',
        '/sw/sw/app.js',
      ]);
    })
  );
                 
});


this.addEventListener('activate', function(event) {
    console.log('serviceworker activate');
});
   

this.addEventListener('fetch', function(event)  {


  // self.clients.getAll().then(function(clients) {
  //     clients.forEach(function(client) {
  //         console.log('postMessage');
  //         client.postMessage('serviceworker-update');
  //     });
  // });  


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