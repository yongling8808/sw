var CACHE_NAME = 'community-portal-v1.2';
var urlsToCache = [
    // /app-\w+\/index-min.js/gi,
    '/app-min.js',
    '/common/zepto.min.js',
    '/openGameSDK/openGameSDK.min-1.0.5.js',
    '/css/main-min.css',
    '/js/libs-min.js'
];

 self.addEventListener('install', function (event) {
     console.log('---on service worker install---');
 });

self.addEventListener('fetch', function(event) {
    var requestUrl = event.request.url;

console.log('fetching url: ' + requestUrl);

 /*   var match = false;
    for(var i = 0; i < urlsToCache.length; ++i){
        var url = urlsToCache[i];
        if(url instanceof RegExp){
            match = url.test(requestUrl);
        } else if(requestUrl.indexOf(url) >= 0){
            match = true;
            break;
        }
    }

    if(!match) {
        // event.respondWith(fetch(event.request.clone()));
        return;
    }

    var req = null;
    if(requestUrl.indexOf('cors=1') >= 0) {
        req = new Request(requestUrl, { mode: 'cors' });
    } else {
        req = event.request.clone();
    }

    console.log(`service worker fetching ${ event.request.url }`);

    event.respondWith(
        caches.match(req)
            .then(function(response) {
                console.log('response: ' + response);
                // Cache hit - return response
                if (response) {
                    console.log(`${ event.request.url } cache hit`);
                    return response;
                }

                // IMPORTANT: Clone the request. A request is a stream and
                // can only be consumed once. Since we are consuming this
                // once by cache and once by the browser for fetch, we need
                // to clone the response
                var fetchRequest = req.clone();

                return fetch(fetchRequest, {
                    mode: 'cors',
                    credentials: 'omit'
                }).then(
                    function(response) {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have 2 stream.
                        var responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                console.log(`${ event.request.url } put into cache`);
                                cache.put(req.clone(), responseToCache);
                            });

                        return response;
                    }
                );
            })
    );*/
});

self.addEventListener('activate', function(event) {
    console.log('---on service worker activate---');

    var cacheWhitelist = ['pages-cache-v1'];

    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log(`cache ${ cacheName } deleted`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});