
var config = {
    db : 'performance_test_1'
};

var addToCache = function(req) {
    
    return fetch(req.clone()).then(function(resp) {
        
        var cacheResp = resp.clone();
        if (resp.status !== 200 || (resp.type !== 'basic' && resp.type !== 'cors')) {
            return resp;
        }
        caches.open(config.db).then(function(cache) {
            cache.put(req.clone(), cacheResp);
        });
        return resp;
    });
};


self.addEventListener('install', function(event) {
});

self.addEventListener('activate', function(event) {
    event.waitUntil(caches.keys().then(function(cacheNames) {
        return Promise.all(cacheNames.map(function(cacheName) {
            if (cacheName !== config.db) {
                return caches.delete(cacheName);
            }
        }));
    }));
});

self.addEventListener('fetch', function(event) {
    
    var promise, req, url = event.request.url;
    
    
    ////////////////////////////////////////////////////////////////////////////////
    //Intercept perfromancereport fetch,check if cache has performancereport response,
    //if has,add 'sw=2' to the query
    //not,add 'sw=1' to the query
    if(url.indexOf('performancereport=1') !== -1)
    {
    	promise = caches.open(config.db).then(function(cache) {
        return cache.match(req);
	    }).then(function(response) {
	        if (response) {
	            var newUrl = url + '&sw=2';
	            return fetch(newUrl).then(function(resp){
	            		return resp;
	            	})
	        } else {
	        		var newUrl = url + '&sw=1';
	             return fetch(newUrl).then(function(resp){
	             		caches.open(config.db).then(function(cache) {
					            cache.put(url, resp);
					        });
	            		return resp;
	            	})
	        }
	    });
	    event.respondWith(promise);
	    return;
    }
    
    /////////////////////////////////////////////////////////////////////////////////////////
    
    if (url.indexOf('jsreport') !== -1 || url.indexOf('bypass=1') !== -1 || url.indexOf('http:') === 0) {
        event.respondWith(fetch(event.request.clone()));
        return;
    }

    if (url.indexOf('cors=1') !== -1) {
        req = new Request(url, {mode : 'cors'});
    } else {
        req = event.request.clone();
    }
    
    promise = caches.open(config.db).then(function(cache) {
        return cache.match(req);
    }).then(function(response) {
        if (response) {
            return response;
        } else {
            return addToCache(req);
        }
    });
    
    event.respondWith(promise);
    
});
