const OFFLINE_CACHE = 'v1';

this.addEventListener('install', function(event) {
          
});
 

this.addEventListener('activate', function(event) {
    console.log('serviceworker activate');
});
   
 

this.addEventListener('fetch', function(event) {
  
    event.respondWith(caches.match(event.request).then(function(resp) {
    
    console.log("mactch event.request:" + event.request.url);
  
   return resp;
  
  }).catch(function() {
  
    console.log("Not mactch event.request:" + event.request.url + " 1");
  
    return fetch(event.request).then(function(resp) {
  
      return resp;
  
  });
  
  }));
    
  
});