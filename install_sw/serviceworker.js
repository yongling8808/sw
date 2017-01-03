 const OFFLINE_CACHE = 'test';   


var addToCache = function(req) {
    
    return fetch(req.clone()).then(function(resp) {
        
        var cacheResp = resp.clone();
        caches.open(OFFLINE_CACHE).then(function(cache) {
            cache.put(req.clone(), cacheResp);
        });
        return resp;
    });
};
 
this.addEventListener('fetch', function(event)  {
    var promise;
    
    promise = caches.open(OFFLINE_CACHE).then(function(cache) {
        return cache.match(event.request);
    }).then(function(response) {
        if (response) {
            return response;
        } else {
            return addToCache(event.request);
        }
    });
    
    event.respondWith(promise);
}); 