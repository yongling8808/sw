
'use strict';

        
var OFFLINE_CACHE = 'offline';
var OFFLINE_URL = 'offline.html';

var CACHE_VERSION = 1;
var CURRENT_CACHES = {
  prefetch: 'prefetch-cache-v' + CACHE_VERSION
};


self.addEventListener('activate', function(e) {
  console.log('Activate event:' + e);
}); 

self.addEventListener('install', function(event) {
  
  console.log("sw install");
  
  var urlsToPrefetch = [
		'index.html',
		'img/1.jpg',
		'img/2.jpg',
		'img/3.jpg',
		'img/4.jpg',
		'img/5.jpg',
		'img/6.jpg',
		'img/7.jpg',
		'img/8.jpg',
		'img/9.jpg',
		'img/10.jpg',
		'img/11.jpg',
		'img/12.jpg',
		'img/13.jpg',
		'img/14.jpg',
		'img/15.jpg',
		'js/index.js',
		'css/index.css',
  ];
 
  event.waitUntil(
    caches.open(CURRENT_CACHES.prefetch).then(function(cache) {
        
	var cachePromises = urlsToPrefetch.map(function(urlToPrefetch) {
		
        var url = new URL(urlToPrefetch, location.href);
        
		console.log("fetch url:" + url);
		
        return fetch(new Request(url, {mode: 'no-cors'})).then(function(response) {
		
		  console.log("fetch response:" + response.status);  
		
          if (response.status >= 400) {
            throw new Error('request for ' + urlToPrefetch +
              ' failed with status ' + response.statusText);
          }

          return cache.put(urlToPrefetch, response);
		  
        }).catch(function(error) {
          console.error('Not caching ' + urlToPrefetch + ' due to ' + error);
        });
      });

      return Promise.all(cachePromises).then(function() {
        console.log('Pre-fetching complete.');
      });
	  
    }).catch(function(error) {
        console.error('Pre-fetching failed:', error);
    })
  );
});

this.addEventListener('activate', function(event) {
     caches.open(CURRENT_CACHES.prefetch).then(function(cache) {
     	var preload = 'preloadToMemory='
     								+'https://yongling8808.github.io/sw/pic_page/js/index.js,'
     								+'https://yongling8808.github.io/sw/pic_page/css/index.css,' 
     								+'https://yongling8808.github.io/sw/pic_page/img/1.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/2.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/3.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/4.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/5.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/6.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/7.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/8.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/9.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/10.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/11.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/12.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/13.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/14.jpg,'
     								+'https://yongling8808.github.io/sw/pic_page/img/15.jpg';
     	var body = new Blob(preload)
     	cache.put('https://x5sw.qq.com/config',new Response(body));
   });	
});

/*self.addEventListener('fetch', function(event) {

  console.log('fetch event for ' + event.request.url);

  event.respondWith(   
	
	fetch(event.request).then(function(response) {
        console.log('Response from network is:' + response);			
        return response;
	})
	
  );  
});*/




/*self.addEventListener('fetch', function(event) {

    console.log('fetch event for ' + event.request.url);
 
    event.respondWith(
      fetch(event.request).catch(function(e) {

  	    console.log('Fetch failed; returning offline page instead.' + e);
		
        return caches.open(OFFLINE_CACHE).then(function(cache) {
          return cache.match(OFFLINE_URL);
        });
      })
    );
 
});*/


self.addEventListener('fetch', function(event) {

    event.respondWith(
        caches.open(CURRENT_CACHES.prefetch).then(function(cache) {
          console.log('load from cache:'+ event.request.url);
          return cache.match(event.request.url);
        })
    );
 
});



