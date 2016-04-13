
const OFFLINE_CACHE = 'v5';

this.addEventListener('install', function(event) {

console.log('serviceworker thread oninstall function');

const offlineRequest = new Request('index.html');
console.log('serviceworker thread oninstall function01');
  // event.waitUntil(
    fetch(offlineRequest).then(function(response) {
      console.log('serviceworker thread oninstall function02');
      return caches.open(OFFLINE_CACHE).then(function(cache) {
        console.log('serviceworker thread oninstall function03');
        return cache.put(offlineRequest, response);
      });
    });
  // );

const ImageRequest = new Request('snowTroopers.jpg');
fetch(ImageRequest).then(function(response) {
  return caches.open(OFFLINE_CACHE).then(function(cache) {
    return cache.put(ImageRequest, response);
  });
});

const JsRequest = new Request('app.js');
fetch(JsRequest).then(function(response) {
  return caches.open(OFFLINE_CACHE).then(function(cache) {
    return cache.put(JsRequest, response);
  });
});
                 
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