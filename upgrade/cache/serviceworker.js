const OFFLINE_CACHE = 'v1';

this.addEventListener('install', function(event) {

// event.waitUntil(
//     caches.open(OFFLINE_CACHE).then(function(cache) {
//       return cache.addAll([
//         '/sw/sw/index.html',
//         '/sw/sw/app.js',
//       ]);
//     })
//   );

	var req1,req2;
	req1 = new Request('/sw/upgrade/cache/index.html');
	req2 = new Request('/sw/upgrade/cache/app.js');
	event.waitUntil(
    caches.open(OFFLINE_CACHE).then(function(cache) {
      return cache.addAll([
        req1,req2,
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

//   caches.open(OFFLINE_CACHE).then(function(cache) {
//   cache.keys().then(function(request) {
//   	console.log(request);
//     request.forEach(function(element, index, array) {
//       console.log(element.url);
//     });
//   });
// });

 
  console.log('serviceworker thread onfetch function');
  console.log('this comes frome server!');
  console.log('Handling fetch event for '+ event.request.url);
  // event.respondWith(
  //       caches.open(OFFLINE_CACHE).then(function(cache) {
  //         console.log('load from cache:'+ event.request.url);
  //         return cache.match(event.request.url);
  //       })
  //   ); 
  event.respondWith(
        caches.match(event.request.url).then(function(response) {
        	console.log('load from cache:'+ event.request.url);
        	return response;
        })
    ); 
  console.log('Handling fetch event end!');
}); 