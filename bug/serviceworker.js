/**********************************************************************************/
//
var scope;
if (self.registration) {
    scope = self.registration.scope;
} else {
    scope = self.scope || new URL('./', self.location).href;
}

/**********************************************************************************/

/**********************************************************************************/
var pathRegexp = (function() {
    var isarray = Array.isArray || function (arr) {
            return Object.prototype.toString.call(arr) == '[object Array]';
        };

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
        // Match escaped characters that would otherwise appear in future matches.
        // This allows the user to escape special characters that won't transform.
        '(\\\\.)',
        // Match Express-style parameters and un-named parameters with a prefix
        // and optional suffixes. Matches appear as:
        //
        // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
        // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
        // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
        '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {string}  str
     * @param  {Object=} options
     * @return {!Array}
     */
    function parse (str, options) {
        var tokens = [];
        var key = 0;
        var index = 0;
        var path = '';
        var defaultDelimiter = options && options.delimiter || '/';
        var res;

        while ((res = PATH_REGEXP.exec(str)) != null) {
            var m = res[0];
            var escaped = res[1];
            var offset = res.index;
            path += str.slice(index, offset);
            index = offset + m.length;

            // Ignore already escaped sequences.
            if (escaped) {
                path += escaped[1];
                continue;
            }

            var next = str[index];
            var prefix = res[2];
            var name = res[3];
            var capture = res[4];
            var group = res[5];
            var modifier = res[6];
            var asterisk = res[7];

            // Push the current path onto the tokens.
            if (path) {
                tokens.push(path);
                path = '';
            }

            var partial = prefix != null && next != null && next !== prefix;
            var repeat = modifier === '+' || modifier === '*';
            var optional = modifier === '?' || modifier === '*';
            var delimiter = res[2] || defaultDelimiter;
            var pattern = capture || group;

            tokens.push({
                name: name || key++,
                prefix: prefix || '',
                delimiter: delimiter,
                optional: optional,
                repeat: repeat,
                partial: partial,
                asterisk: !!asterisk,
                pattern: pattern ? escapeGroup(pattern) : (asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?')
            });
        }

        // Match any characters still remaining.
        if (index < str.length) {
            path += str.substr(index);
        }

        // If the path exists, push it onto the end.
        if (path) {
            tokens.push(path);
        }

        return tokens;
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {string}             str
     * @param  {Object=}            options
     * @return {!function(Object=, Object=)}
     */
    function compile (str, options) {
        return tokensToFunction(parse(str, options));
    }

    /**
     * Prettier encoding of URI path segments.
     *
     * @param  {string}
     * @return {string}
     */
    function encodeURIComponentPretty (str) {
        return encodeURI(str).replace(/[\/?#]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
    }

    /**
     * Encode the asterisk parameter. Similar to ~pretty~, but allows slashes.
     *
     * @param  {string}
     * @return {string}
     */
    function encodeAsterisk (str) {
        return encodeURI(str).replace(/[?#]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
        // Compile all the tokens into regexps.
        var matches = new Array(tokens.length);

        // Compile all the patterns before compilation.
        for (var i = 0; i < tokens.length; i++) {
            if (typeof tokens[i] === 'object') {
                matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
            }
        }

        return function (obj, opts) {
            var path = '';
            var data = obj || {};
            var options = opts || {};
            var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent;

            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i];

                if (typeof token === 'string') {
                    path += token;

                    continue;
                }

                var value = data[token.name];
                var segment;

                if (value == null) {
                    if (token.optional) {
                        // Prepend partial segment prefixes.
                        if (token.partial) {
                            path += token.prefix;
                        }

                        continue
                    } else {
                        throw new TypeError('Expected "' + token.name + '" to be defined');
                    }
                }

                if (isarray(value)) {
                    if (!token.repeat) {
                        throw new TypeError('Expected "' + token.name + '" to not repeat, but received ~' + JSON.stringify(value) + '~');
                    }

                    if (value.length === 0) {
                        if (token.optional) {
                            continue;
                        } else {
                            throw new TypeError('Expected "' + token.name + '" to not be empty');
                        }
                    }

                    for (var j = 0; j < value.length; j++) {
                        segment = encode(value[j]);

                        if (!matches[i].test(segment)) {
                            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received ~' + JSON.stringify(segment) + '~');
                        }

                        path += (j === 0 ? token.prefix : token.delimiter) + segment;
                    }

                    continue;
                }

                segment = token.asterisk ? encodeAsterisk(value) : encode(value);

                if (!matches[i].test(segment)) {
                    throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"');
                }

                path += token.prefix + segment;
            }

            return path;
        }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {string} str
     * @return {string}
     */
    function escapeString (str) {
        return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1');
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {string} group
     * @return {string}
     */
    function escapeGroup (group) {
        return group.replace(/([=!:$\/()])/g, '\\$1');
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {!RegExp} re
     * @param  {Array}   keys
     * @return {!RegExp}
     */
    function attachKeys (re, keys) {
        re.keys = keys;
        return re;
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {string}
     */
    function flags (options) {
        return options.sensitive ? '' : 'i';
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {!RegExp} path
     * @param  {!Array}  keys
     * @return {!RegExp}
     */
    function regexpToRegexp (path, keys) {
        // Use a negative lookahead to match only capturing groups.
        var groups = path.source.match(/\((?!\?)/g);

        if (groups) {
            for (var i = 0; i < groups.length; i++) {
                keys.push({
                    name: i,
                    prefix: null,
                    delimiter: null,
                    optional: false,
                    repeat: false,
                    partial: false,
                    asterisk: false,
                    pattern: null
                });
            }
        }

        return attachKeys(path, keys);
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {!Array}  path
     * @param  {Array}   keys
     * @param  {!Object} options
     * @return {!RegExp}
     */
    function arrayToRegexp (path, keys, options) {
        var parts = [];

        for (var i = 0; i < path.length; i++) {
            parts.push(pathToRegexp(path[i], keys, options).source);
        }

        var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

        return attachKeys(regexp, keys);
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {string}  path
     * @param  {!Array}  keys
     * @param  {!Object} options
     * @return {!RegExp}
     */
    function stringToRegexp (path, keys, options) {
        return tokensToRegExp(parse(path, options), keys, options);
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {!Array}          tokens
     * @param  {(Array|Object)=} keys
     * @param  {Object=}         options
     * @return {!RegExp}
     */
    function tokensToRegExp (tokens, keys, options) {
        if (!isarray(keys)) {
            options = /** @type {!Object} */ (keys || options);
            keys = [];
        }

        options = options || {};

        var strict = options.strict;
        var end = options.end !== false;
        var route = '';

        // Iterate over the tokens and create our regexp string.
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];

            if (typeof token === 'string') {
                route += escapeString(token);
            } else {
                var prefix = escapeString(token.prefix);
                var capture = '(?:' + token.pattern + ')';

                keys.push(token);

                if (token.repeat) {
                    capture += '(?:' + prefix + capture + ')*';
                }

                if (token.optional) {
                    if (!token.partial) {
                        capture = '(?:' + prefix + '(' + capture + '))?';
                    } else {
                        capture = prefix + '(' + capture + ')?';
                    }
                } else {
                    capture = prefix + '(' + capture + ')';
                }

                route += capture;
            }
        }

        var delimiter = escapeString(options.delimiter || '/');
        var endsWithDelimiter = route.slice(-delimiter.length) === delimiter;

        // In non-strict mode we allow a slash at the end of match. If the path to
        // match already ends with a slash, we remove it for consistency. The slash
        // is valid at the end of a path match, not in the middle. This is important
        // in non-ending mode, where "/test/" shouldn't match "/test//route".
        if (!strict) {
            route = (endsWithDelimiter ? route.slice(0, -delimiter.length) : route) + '(?:' + delimiter + '(?=$))?';
        }

        if (end) {
            route += '$';
        } else {
            // In non-ending mode, we need the capturing groups to match as much as
            // possible by using a positive lookahead to the end or next path segment.
            route += strict && endsWithDelimiter ? '' : '(?=' + delimiter + '|$)';
        }

        return attachKeys(new RegExp('^' + route, flags(options)), keys);
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using ~/user/:id~, ~keys~ will
     * contain ~[{ name: 'id', delimiter: '/', optional: false, repeat: false }]~.
     *
     * @param  {(string|RegExp|Array)} path
     * @param  {(Array|Object)=}       keys
     * @param  {Object=}               options
     * @return {!RegExp}
     */
    function pathToRegexp (path, keys, options) {
        if (!isarray(keys)) {
            options = /** @type {!Object} */ (keys || options);
            keys = []
        }

        options = options || {};

        if (path instanceof RegExp) {
            return regexpToRegexp(path, /** @type {!Array} */ (keys));
        }

        if (isarray(path)) {
            return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options);
        }

        return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options);
    }


    /**
     * Expose ~pathToRegexp~.
     */
    pathToRegexp.parse = parse;
    pathToRegexp.compile = compile;
    pathToRegexp.tokensToFunction = tokensToFunction;
    pathToRegexp.tokensToRegExp = tokensToRegExp;
    return pathToRegexp;
})();
/**********************************************************************************/

/**********************************************************************************/
function debug(message, options) {
    options = options || {};
    var flag = options.debug;
    if (flag) {
        console.log('[tt-sw] ' + message);
    }
}

function networkOnly(request, values, options) {
    return fetch(request);
}

function networkFirst(request, values, options) {
    options = options || {};
    var successResponses = options.successResponses;
    var networkTimeoutSeconds = options.networkTimeoutSeconds;
    //debug('Strategy: network first [' + request.url + ']', options);

    return caches.open(options.cache.name).then(function(cache) {
        var timeoutId;
        var promises = [];
        var originalResponse;

        if (networkTimeoutSeconds) {
            var cacheWhenTimedOutPromise = new Promise(function(resolve) {
                timeoutId = setTimeout(function() {
                    cache.match(request).then(function(response) {
                        if (response) {
                            resolve(response);
                        }
                    });
                }, networkTimeoutSeconds * 1000);
            });
            promises.push(cacheWhenTimedOutPromise);
        }

        var networkPromise = fetchAndCache(request, options)
            .then(function(response) {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                if (successResponses.test(response.status)) {
                    return response;
                }

                //debug('Response was an HTTP error: ' + response.statusText,
                //    options);
                originalResponse = response;
                throw new Error('Bad response');
            }).catch(function(error) {
                //debug('Network or response error, fallback to cache [' +
                //    request.url + ']', options);
                return cache.match(request).then(function(response) {
                    if (response) {
                        return response;
                    }
                    if (originalResponse) {
                        return originalResponse;
                    }
                    throw error;
                });
            });

        promises.push(networkPromise);

        return Promise.race(promises);
    });
}

function cacheOnly(request, values, options) {
    //debug('Strategy: cache only [' + request.url + ']', options);
    return caches.open(options.cache.name).then(function(cache) {
        return cache.match(request);
    });
}

function cacheFirst(request, values, options) {
    //debug('Strategy: cache first [' + request.url + ']', options);
    return caches.open(options.cache.name).then(function(cache) {
        return cache.match(request).then(function(response) {
            if (response) {
                return response;
            }

            return fetchAndCache(request, options);
        });
    });
}

function fetchAndCache(request, options) {
    options = options || {};
    var successResponses = options.successResponses;
    var method = options.cache.method;

    return fetch(request.clone()).then(function(response) {
        var reqMethod = (request.method + '').toLowerCase();
        var flag = method.some(function(each) {
            if (reqMethod == each) {
                return true;
            }
        });
        if (flag) {
            if (successResponses.test(response.status)) {
                caches.open(options.cache.name).then(function(cache) {
                    cache.put(request, response);
                });
            }
        }

        return response.clone();
    });
}

function fastest(request, values, options) {
    //debug('Strategy: fastest [' + request.url + ']', options);

    return new Promise(function(resolve, reject) {
        var rejected = false;
        var reasons = [];

        var maybeReject = function(reason) {
            reasons.push(reason.toString());
            if (rejected) {
                reject(new Error('Both cache and network failed: "' +
                    reasons.join('", "') + '"'));
            } else {
                rejected = true;
            }
        };

        var maybeResolve = function(result) {
            if (result instanceof Response) {
                resolve(result);
            } else {
                maybeReject('No result returned');
            }
        };

        fetchAndCache(request.clone(), options)
            .then(maybeResolve, maybeReject);

        cacheOnly(request, values, options)
            .then(maybeResolve, maybeReject);
    });
}
/**********************************************************************************/

/**********************************************************************************/
function Route(method, path, handler, options) {
    this.method = method;
    this.path = path;
    this.handler = handler;
    this.options = options;
    if (path instanceof RegExp) {
        this.type = 1;
        this.rule = path;
    } else if (typeof path == 'string') {
        this.type = 2;
        this.rule = pathRegexp(path, options);
    } else {
        this.type = 3; //error
        this.rule = null;
    }
}

Route.prototype.getMethod = function() {
    return this.method;
};

Route.prototype.getPath = function() {
    return this.path;
};

Route.prototype.getHandler = function() {
    return this.handler;
};

Route.prototype.getOpts = function() {
    return this.options;
};

Route.prototype.getType = function() {
    return this.type;
};

Route.prototype.match = function(url) {
    if (this.type == 3) {
        return false;
    } else if (this.type == 1 || this.type == 2) {
        return this.rule.test(url);
    } else {
        return false;
    }
};

Route.prototype.getUrlParam = function(url) {
    if (this.type == 2) {
        var ret = {};
        var match = this.rule.exec(url);
        var keys = this.rule.keys;
        keys.forEach(function(key, index) {
            ret[key.name] = match[index + 1];
        });
        return ret;
    } else {
        return null;
    }
};

function Routes() {
    this.routes = new Map();
}

Routes.prototype.add = function(route) {
    if (!route instanceof Route) {
        return false;
    }
    var type = route.getType();
    if (type == 3) {
        return false;
    }
    var method = route.getMethod().toLowerCase();
    var routeArray = this.routes.get(method);
    if (!routeArray) {
        this.routes.set(method, []);
        routeArray = this.routes.get(method);
    }
    routeArray.push(route);
};


Routes.prototype.match = function(request) {
    return this.matchMethod(request.method, request.url) ||
        this.matchMethod('any', request.url);
};

Routes.prototype.matchMethod = function(method, url) {
    method = (method + '').toLocaleLowerCase();
    function selectHandler(routes, url) {
        if (!routes) {
            return null;
        }
        for (var i = routes.length - 1; i >= 0; --i) {
            var route = routes[i];
            if (route.match(url)) {
                return function(request) {
                    var opts = route.getOpts();
                    var hander = route.getHandler();
                    var values = route.getUrlParam(url);
                    for (var key in options) {
                        if (typeof opts[key] == 'undefined') {
                            opts[key] = options[key];
                        }
                    }
                    return hander(request, values, opts);
                }
            }
        }
        return null;
    }

    var urlObj = new URL(url);
    var path = urlObj.pathname;
    if (urlObj.host != self.location.host) {
        path = url;
    }

    var routes = this.routes.get(method);
    var handler = selectHandler(routes, path);
    if (handler) {
        return handler;
    }
    return null;
};

/**********************************************************************************/
/**********************************************************************************/
//
function fetchListener(event, routes) {
    var handler = routes.match(event.request);
    if (handler) {
        event.respondWith(handler(event.request));
    } else {
        event.respondWith(fetch(event.request))
    }
}

function activateListener(event, options) {
    debug('activate event fired');
    event.waitUntil(caches.keys().then(function(cacheNames) {
        return Promise.all(cacheNames.map(function(cacheName) {
            if (cacheName !== options.cache.name) {
                return caches.delete(cacheName);
            }
        }));
    }));
}

function installListener(event, options) {
    debug('install event fired');
    event.waitUntil(
        caches.open(options.cache.name).then(function(cache) {
            return cache.addAll(options.preCacheItems);
        })
    );
}
/**********************************************************************************/



/**********************************************************************************/
//
var routes = new Routes();
var defaultOptions = {
    cache: {
        name: 'tt-sw-cache-' + scope,
        method : ['get']
    },
    debug: true,
    networkTimeoutSeconds: 5,
    preCacheItems: [],
    successResponses: /^0|([123]\d\d)|(40[14567])|410$/
};
var tplOptions = {"cache":{"name":"sw_run_test_new"},"preCacheItems":[]};
var options = defaultOptions;
if (tplOptions) {
    if (tplOptions.cache) {
        if (tplOptions.cache.name) {
            options.cache.name = 'tt-sw-cache-' + encodeURIComponent(tplOptions.cache.name);
        }
        if (tplOptions.cache.method) {
            options.cache.method = tplOptions.cache.method;
        }
    }
    if (typeof tplOptions.debug == 'boolean') {
        options.debug = tplOptions.debug;
    }
    if (typeof tplOptions.networkTimeoutSeconds == 'number') {
        options.networkTimeoutSeconds = tplOptions.networkTimeoutSeconds;
    }
    if (tplOptions.preCacheItems && tplOptions.preCacheItems.length != 0) {
        options.preCacheItems = tplOptions.preCacheItems;
    }
    if (tplOptions.successResponses instanceof RegExp) {
        options.successResponses = tplOptions.successResponses;
    }
}
//method, path, handler, options
/*
1 --  networkFirst
2 --  cacheFirst
3 --  fastest
4 --  networkOnly
5 --  cacheOnly
*/

/*var route = new Route(
    'GET',

    "*.jpg"

    ,

    function(request, values, options) {
        return fetch("./sw02.jpg");
    }

    ,
    {}
);
routes.add(route);
*/

self.addEventListener('install', function(event) {
	console.log('on install event!');
    //installListener(event, options);
});
self.addEventListener('activate', function(event) {
	console.log('on install event!');
    //activateListener(event, options);
});
self.addEventListener('fetch', function(event) {
	console.log('on install event!');
    //fetchListener(event, routes);
});
/**********************************************************************************/