const OFFLINE_CACHE = 'v1';

this.addEventListener('install', function(event) {
          
});
 

this.addEventListener('activate', function(event) {
    console.log('serviceworker activate');
});
   
 
this.addEventListener('fetch', function(event)  {

event.respondWith(
    return fetch(event.request).then(function(resp) {
      return resp;
  }
}); 