(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":4}],3:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var cookies = require('./../helpers/cookies');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');
var defaults = require('../defaults');
var Cancel = require('../cancel/Cancel');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    var responseType = config.responseType;
    var onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
        request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
      var transitional = config.transitional || defaults.transitional;
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(
        timeoutErrorMessage,
        config,
        transitional.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = function(cancel) {
        if (!request) {
          return;
        }
        reject(!cancel || (cancel && cancel.type) ? new Cancel('canceled') : cancel);
        request.abort();
        request = null;
      };

      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }

    if (!requestData) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};

},{"../cancel/Cancel":5,"../core/buildFullPath":10,"../core/createError":11,"../defaults":17,"./../core/settle":15,"./../helpers/buildURL":20,"./../helpers/cookies":22,"./../helpers/isURLSameOrigin":25,"./../helpers/parseHeaders":27,"./../utils":30}],4:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');
axios.VERSION = require('./env/data').version;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// Expose isAxiosError
axios.isAxiosError = require('./helpers/isAxiosError');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

},{"./cancel/Cancel":5,"./cancel/CancelToken":6,"./cancel/isCancel":7,"./core/Axios":8,"./core/mergeConfig":14,"./defaults":17,"./env/data":18,"./helpers/bind":19,"./helpers/isAxiosError":24,"./helpers/spread":28,"./utils":30}],5:[function(require,module,exports){
'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;

},{}],6:[function(require,module,exports){
'use strict';

var Cancel = require('./Cancel');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;

  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;

  // eslint-disable-next-line func-names
  this.promise.then(function(cancel) {
    if (!token._listeners) return;

    var i;
    var l = token._listeners.length;

    for (i = 0; i < l; i++) {
      token._listeners[i](cancel);
    }
    token._listeners = null;
  });

  // eslint-disable-next-line func-names
  this.promise.then = function(onfulfilled) {
    var _resolve;
    // eslint-disable-next-line func-names
    var promise = new Promise(function(resolve) {
      token.subscribe(resolve);
      _resolve = resolve;
    }).then(onfulfilled);

    promise.cancel = function reject() {
      token.unsubscribe(_resolve);
    };

    return promise;
  };

  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Subscribe to the cancel signal
 */

CancelToken.prototype.subscribe = function subscribe(listener) {
  if (this.reason) {
    listener(this.reason);
    return;
  }

  if (this._listeners) {
    this._listeners.push(listener);
  } else {
    this._listeners = [listener];
  }
};

/**
 * Unsubscribe from the cancel signal
 */

CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
  if (!this._listeners) {
    return;
  }
  var index = this._listeners.indexOf(listener);
  if (index !== -1) {
    this._listeners.splice(index, 1);
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./Cancel":5}],7:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],8:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');
var validator = require('../helpers/validator');

var validators = validator.validators;
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(configOrUrl, config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof configOrUrl === 'string') {
    config = config || {};
    config.url = configOrUrl;
  } else {
    config = configOrUrl || {};
  }

  if (!config.url) {
    throw new Error('Provided config url is not valid');
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators.boolean),
      forcedJSONParsing: validators.transitional(validators.boolean),
      clarifyTimeoutError: validators.transitional(validators.boolean)
    }, false);
  }

  // filter out skipped interceptors
  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }

    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;

  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];

    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    chain = chain.concat(responseInterceptorChain);

    promise = Promise.resolve(config);
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }


  var newConfig = config;
  while (requestInterceptorChain.length) {
    var onFulfilled = requestInterceptorChain.shift();
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected(error);
      break;
    }
  }

  try {
    promise = dispatchRequest(newConfig);
  } catch (error) {
    return Promise.reject(error);
  }

  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  if (!config.url) {
    throw new Error('Provided config url is not valid');
  }
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;

},{"../helpers/buildURL":20,"../helpers/validator":29,"./../utils":30,"./InterceptorManager":9,"./dispatchRequest":12,"./mergeConfig":14}],9:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected,
    synchronous: options ? options.synchronous : false,
    runWhen: options ? options.runWhen : null
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":30}],10:[function(require,module,exports){
'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};

},{"../helpers/combineURLs":21,"../helpers/isAbsoluteURL":23}],11:[function(require,module,exports){
'use strict';

var enhanceError = require('./enhanceError');

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};

},{"./enhanceError":13}],12:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');
var Cancel = require('../cancel/Cancel');

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new Cancel('canceled');
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData.call(
    config,
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/Cancel":5,"../cancel/isCancel":7,"../defaults":17,"./../utils":30,"./transformData":16}],13:[function(require,module,exports){
'use strict';

/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  };
  return error;
};

},{}],14:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  // eslint-disable-next-line consistent-return
  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function mergeDirectKeys(prop) {
    if (prop in config2) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  var mergeMap = {
    'url': valueFromConfig2,
    'method': valueFromConfig2,
    'data': valueFromConfig2,
    'baseURL': defaultToConfig2,
    'transformRequest': defaultToConfig2,
    'transformResponse': defaultToConfig2,
    'paramsSerializer': defaultToConfig2,
    'timeout': defaultToConfig2,
    'timeoutMessage': defaultToConfig2,
    'withCredentials': defaultToConfig2,
    'adapter': defaultToConfig2,
    'responseType': defaultToConfig2,
    'xsrfCookieName': defaultToConfig2,
    'xsrfHeaderName': defaultToConfig2,
    'onUploadProgress': defaultToConfig2,
    'onDownloadProgress': defaultToConfig2,
    'decompress': defaultToConfig2,
    'maxContentLength': defaultToConfig2,
    'maxBodyLength': defaultToConfig2,
    'transport': defaultToConfig2,
    'httpAgent': defaultToConfig2,
    'httpsAgent': defaultToConfig2,
    'cancelToken': defaultToConfig2,
    'socketPath': defaultToConfig2,
    'responseEncoding': defaultToConfig2,
    'validateStatus': mergeDirectKeys
  };

  utils.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
    var merge = mergeMap[prop] || mergeDeepProperties;
    var configValue = merge(prop);
    (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });

  return config;
};

},{"../utils":30}],15:[function(require,module,exports){
'use strict';

var createError = require('./createError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};

},{"./createError":11}],16:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var defaults = require('./../defaults');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  var context = this || defaults;
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn.call(context, data, headers);
  });

  return data;
};

},{"./../defaults":17,"./../utils":30}],17:[function(require,module,exports){
(function (process){(function (){
'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');
var enhanceError = require('./core/enhanceError');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  }
  return adapter;
}

function stringifySafely(rawValue, parser, encoder) {
  if (utils.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

var defaults = {

  transitional: {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false
  },

  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');

    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils.isObject(data) || (headers && headers['Content-Type'] === 'application/json')) {
      setContentTypeIfUnset(headers, 'application/json');
      return stringifySafely(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    var transitional = this.transitional || defaults.transitional;
    var silentJSONParsing = transitional && transitional.silentJSONParsing;
    var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';

    if (strictJSONParsing || (forcedJSONParsing && utils.isString(data) && data.length)) {
      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw enhanceError(e, this, 'E_JSON_PARSE');
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;

}).call(this)}).call(this,require('_process'))
},{"./adapters/http":3,"./adapters/xhr":3,"./core/enhanceError":13,"./helpers/normalizeHeaderName":26,"./utils":30,"_process":1}],18:[function(require,module,exports){
module.exports = {
  "version": "0.25.0"
};
},{}],19:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

},{}],20:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":30}],21:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

},{}],22:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);

},{"./../utils":30}],23:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
};

},{}],24:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return utils.isObject(payload) && (payload.isAxiosError === true);
};

},{"./../utils":30}],25:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);

},{"./../utils":30}],26:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":30}],27:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

},{"./../utils":30}],28:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],29:[function(require,module,exports){
'use strict';

var VERSION = require('../env/data').version;

var validators = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function(type, i) {
  validators[type] = function validator(thing) {
    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});

var deprecatedWarnings = {};

/**
 * Transitional option validator
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 * @returns {function}
 */
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return function(value, opt, opts) {
    if (validator === false) {
      throw new Error(formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')));
    }

    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(
        formatMessage(
          opt,
          ' has been deprecated since v' + version + ' and will be removed in the near future'
        )
      );
    }

    return validator ? validator(value, opt, opts) : true;
  };
};

/**
 * Assert object's properties type
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 */

function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }
  var keys = Object.keys(options);
  var i = keys.length;
  while (i-- > 0) {
    var opt = keys[i];
    var validator = schema[opt];
    if (validator) {
      var value = options[opt];
      var result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new TypeError('option ' + opt + ' must be ' + result);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw Error('Unknown option ' + opt);
    }
  }
}

module.exports = {
  assertOptions: assertOptions,
  validators: validators
};

},{"../env/data":18}],30:[function(require,module,exports){
'use strict';

var bind = require('./helpers/bind');

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return Array.isArray(val);
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return toString.call(val) === '[object FormData]';
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (toString.call(val) !== '[object Object]') {
    return false;
  }

  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return toString.call(val) === '[object URLSearchParams]';
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM
};

},{"./helpers/bind":19}],31:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }

  // Remove event specific arrays for event types that no
  // one is subscribed for to avoid memory leak.
  if (callbacks.length === 0) {
    delete this._callbacks['$' + event];
  }

  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};

  var args = new Array(arguments.length - 1)
    , callbacks = this._callbacks['$' + event];

  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],32:[function(require,module,exports){
module.exports = stringify
stringify.default = stringify
stringify.stable = deterministicStringify
stringify.stableStringify = deterministicStringify

var LIMIT_REPLACE_NODE = '[...]'
var CIRCULAR_REPLACE_NODE = '[Circular]'

var arr = []
var replacerStack = []

function defaultOptions () {
  return {
    depthLimit: Number.MAX_SAFE_INTEGER,
    edgesLimit: Number.MAX_SAFE_INTEGER
  }
}

// Regular stringify
function stringify (obj, replacer, spacer, options) {
  if (typeof options === 'undefined') {
    options = defaultOptions()
  }

  decirc(obj, '', 0, [], undefined, 0, options)
  var res
  try {
    if (replacerStack.length === 0) {
      res = JSON.stringify(obj, replacer, spacer)
    } else {
      res = JSON.stringify(obj, replaceGetterValues(replacer), spacer)
    }
  } catch (_) {
    return JSON.stringify('[unable to serialize, circular reference is too complex to analyze]')
  } finally {
    while (arr.length !== 0) {
      var part = arr.pop()
      if (part.length === 4) {
        Object.defineProperty(part[0], part[1], part[3])
      } else {
        part[0][part[1]] = part[2]
      }
    }
  }
  return res
}

function setReplace (replace, val, k, parent) {
  var propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k)
  if (propertyDescriptor.get !== undefined) {
    if (propertyDescriptor.configurable) {
      Object.defineProperty(parent, k, { value: replace })
      arr.push([parent, k, val, propertyDescriptor])
    } else {
      replacerStack.push([val, k, replace])
    }
  } else {
    parent[k] = replace
    arr.push([parent, k, val])
  }
}

function decirc (val, k, edgeIndex, stack, parent, depth, options) {
  depth += 1
  var i
  if (typeof val === 'object' && val !== null) {
    for (i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        setReplace(CIRCULAR_REPLACE_NODE, val, k, parent)
        return
      }
    }

    if (
      typeof options.depthLimit !== 'undefined' &&
      depth > options.depthLimit
    ) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent)
      return
    }

    if (
      typeof options.edgesLimit !== 'undefined' &&
      edgeIndex + 1 > options.edgesLimit
    ) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent)
      return
    }

    stack.push(val)
    // Optimize for Arrays. Big arrays could kill the performance otherwise!
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        decirc(val[i], i, i, stack, val, depth, options)
      }
    } else {
      var keys = Object.keys(val)
      for (i = 0; i < keys.length; i++) {
        var key = keys[i]
        decirc(val[key], key, i, stack, val, depth, options)
      }
    }
    stack.pop()
  }
}

// Stable-stringify
function compareFunction (a, b) {
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }
  return 0
}

function deterministicStringify (obj, replacer, spacer, options) {
  if (typeof options === 'undefined') {
    options = defaultOptions()
  }

  var tmp = deterministicDecirc(obj, '', 0, [], undefined, 0, options) || obj
  var res
  try {
    if (replacerStack.length === 0) {
      res = JSON.stringify(tmp, replacer, spacer)
    } else {
      res = JSON.stringify(tmp, replaceGetterValues(replacer), spacer)
    }
  } catch (_) {
    return JSON.stringify('[unable to serialize, circular reference is too complex to analyze]')
  } finally {
    // Ensure that we restore the object as it was.
    while (arr.length !== 0) {
      var part = arr.pop()
      if (part.length === 4) {
        Object.defineProperty(part[0], part[1], part[3])
      } else {
        part[0][part[1]] = part[2]
      }
    }
  }
  return res
}

function deterministicDecirc (val, k, edgeIndex, stack, parent, depth, options) {
  depth += 1
  var i
  if (typeof val === 'object' && val !== null) {
    for (i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        setReplace(CIRCULAR_REPLACE_NODE, val, k, parent)
        return
      }
    }
    try {
      if (typeof val.toJSON === 'function') {
        return
      }
    } catch (_) {
      return
    }

    if (
      typeof options.depthLimit !== 'undefined' &&
      depth > options.depthLimit
    ) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent)
      return
    }

    if (
      typeof options.edgesLimit !== 'undefined' &&
      edgeIndex + 1 > options.edgesLimit
    ) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent)
      return
    }

    stack.push(val)
    // Optimize for Arrays. Big arrays could kill the performance otherwise!
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        deterministicDecirc(val[i], i, i, stack, val, depth, options)
      }
    } else {
      // Create a temporary object in the required way
      var tmp = {}
      var keys = Object.keys(val).sort(compareFunction)
      for (i = 0; i < keys.length; i++) {
        var key = keys[i]
        deterministicDecirc(val[key], key, i, stack, val, depth, options)
        tmp[key] = val[key]
      }
      if (typeof parent !== 'undefined') {
        arr.push([parent, k, val])
        parent[k] = tmp
      } else {
        return tmp
      }
    }
    stack.pop()
  }
}

// wraps replacer function to handle values we couldn't replace
// and mark them as replaced value
function replaceGetterValues (replacer) {
  replacer =
    typeof replacer !== 'undefined'
      ? replacer
      : function (k, v) {
        return v
      }
  return function (key, val) {
    if (replacerStack.length > 0) {
      for (var i = 0; i < replacerStack.length; i++) {
        var part = replacerStack[i]
        if (part[1] === key && part[0] === val) {
          val = part[2]
          replacerStack.splice(i, 1)
          break
        }
      }
    }
    return replacer.call(this, key, val)
  }
}

},{}],33:[function(require,module,exports){
'use strict';

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var Format = {
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

module.exports = {
    'default': Format.RFC3986,
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return String(value);
        }
    },
    RFC1738: Format.RFC1738,
    RFC3986: Format.RFC3986
};

},{}],34:[function(require,module,exports){
'use strict';

var stringify = require('./stringify');
var parse = require('./parse');
var formats = require('./formats');

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};

},{"./formats":33,"./parse":35,"./stringify":36}],35:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    comma: false,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

var parseArrayValue = function (val, options) {
    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
        return val.split(',');
    }

    return val;
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, 'key');
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
            val = utils.maybeMap(
                parseArrayValue(part.slice(pos + 1), options),
                function (encodedVal) {
                    return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                }
            );
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }

        if (part.indexOf('[]=') > -1) {
            val = isArray(val) ? [val] : val;
        }

        if (has.call(obj, key)) {
            obj[key] = utils.combine(obj[key], val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
    var leaf = valuesParsed ? val : parseArrayValue(val, options);

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!options.parseArrays && cleanRoot === '') {
                obj = { 0: leaf };
            } else if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = options.depth > 0 && brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

    return {
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (str, opts) {
    var options = normalizeParseOptions(opts);

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
        obj = utils.merge(obj, newObj, options);
    }

    return utils.compact(obj);
};

},{"./utils":37}],36:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var formats = require('./formats');
var has = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    comma: 'comma',
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var isArray = Array.isArray;
var push = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats['default'];
var defaults = {
    addQueryPrefix: false,
    allowDots: false,
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    encodeValuesOnly: false,
    format: defaultFormat,
    formatter: formats.formatters[defaultFormat],
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
    return typeof v === 'string'
        || typeof v === 'number'
        || typeof v === 'boolean'
        || typeof v === 'symbol'
        || typeof v === 'bigint';
};

var stringify = function stringify(
    object,
    prefix,
    generateArrayPrefix,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    format,
    formatter,
    encodeValuesOnly,
    charset
) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (generateArrayPrefix === 'comma' && isArray(obj)) {
        obj = utils.maybeMap(obj, function (value) {
            if (value instanceof Date) {
                return serializeDate(value);
            }
            return value;
        });
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
        }

        obj = '';
    }

    if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (generateArrayPrefix === 'comma' && isArray(obj)) {
        // we need to join elements in
        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : undefined }];
    } else if (isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];
        var value = typeof key === 'object' && key.value !== undefined ? key.value : obj[key];

        if (skipNulls && value === null) {
            continue;
        }

        var keyPrefix = isArray(obj)
            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(prefix, key) : prefix
            : prefix + (allowDots ? '.' + key : '[' + key + ']');

        pushToArray(values, stringify(
            value,
            keyPrefix,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            format,
            formatter,
            encodeValuesOnly,
            charset
        ));
    }

    return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.encoder !== null && opts.encoder !== undefined && typeof opts.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var charset = opts.charset || defaults.charset;
    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    var format = formats['default'];
    if (typeof opts.format !== 'undefined') {
        if (!has.call(formats.formatters, opts.format)) {
            throw new TypeError('Unknown format option provided.');
        }
        format = opts.format;
    }
    var formatter = formats.formatters[format];

    var filter = defaults.filter;
    if (typeof opts.filter === 'function' || isArray(opts.filter)) {
        filter = opts.filter;
    }

    return {
        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
        filter: filter,
        format: format,
        formatter: formatter,
        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
        sort: typeof opts.sort === 'function' ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (object, opts) {
    var obj = object;
    var options = normalizeStringifyOptions(opts);

    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (opts && opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
    } else if (opts && 'indices' in opts) {
        arrayFormat = opts.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (options.sort) {
        objKeys.sort(options.sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (options.skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify(
            obj[key],
            key,
            generateArrayPrefix,
            options.strictNullHandling,
            options.skipNulls,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.format,
            options.formatter,
            options.encodeValuesOnly,
            options.charset
        ));
    }

    var joined = keys.join(options.delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (options.charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('✓')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};

},{"./formats":33,"./utils":37}],37:[function(require,module,exports){
'use strict';

var formats = require('./formats');

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    /* eslint no-param-reassign: 0 */
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (isArray(target)) {
            target.push(source);
        } else if (target && typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (!target || typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (isArray(target) && !isArray(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (isArray(target) && isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                var targetItem = target[i];
                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                    target[i] = merge(targetItem, item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var encode = function encode(str, defaultEncoder, charset, kind, format) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = str;
    if (typeof str === 'symbol') {
        string = Symbol.prototype.toString.call(str);
    } else if (typeof str !== 'string') {
        string = String(str);
    }

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
            || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
    if (isArray(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
            mapped.push(fn(val[i]));
        }
        return mapped;
    }
    return fn(val);
};

module.exports = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    maybeMap: maybeMap,
    merge: merge
};

},{"./formats":33}],38:[function(require,module,exports){
'use strict';

var Request = require('./base-request');

var DEFAULT_HOST = 'accounts.spotify.com',
  DEFAULT_PORT = 443,
  DEFAULT_SCHEME = 'https';

module.exports.builder = function() {
  return Request.builder()
    .withHost(DEFAULT_HOST)
    .withPort(DEFAULT_PORT)
    .withScheme(DEFAULT_SCHEME);
};

},{"./base-request":39}],39:[function(require,module,exports){
'use strict';

var Request = function(builder) {
  if (!builder) {
    throw new Error('No builder supplied to constructor');
  }

  this.host = builder.host;
  this.port = builder.port;
  this.scheme = builder.scheme;
  this.queryParameters = builder.queryParameters;
  this.bodyParameters = builder.bodyParameters;
  this.headers = builder.headers;
  this.path = builder.path;
};

Request.prototype._getter = function(key) {
  return function() {
    return this[key];
  };
};

Request.prototype.getHost = Request.prototype._getter('host');

Request.prototype.getPort = Request.prototype._getter('port');

Request.prototype.getScheme = Request.prototype._getter('scheme');

Request.prototype.getPath = Request.prototype._getter('path');

Request.prototype.getQueryParameters = Request.prototype._getter(
  'queryParameters'
);

Request.prototype.getBodyParameters = Request.prototype._getter(
  'bodyParameters'
);

Request.prototype.getHeaders = Request.prototype._getter('headers');

Request.prototype.getURI = function() {
  if (!this.scheme || !this.host || !this.port) {
    throw new Error('Missing components necessary to construct URI');
  }
  var uri = this.scheme + '://' + this.host;
  if (
    (this.scheme === 'http' && this.port !== 80) ||
    (this.scheme === 'https' && this.port !== 443)
  ) {
    uri += ':' + this.port;
  }
  if (this.path) {
    uri += this.path;
  }
  return uri;
};

Request.prototype.getURL = function() {
  var uri = this.getURI();
  if (this.getQueryParameters()) {
    return uri + this.getQueryParameterString(this.getQueryParameters());
  } else {
    return uri;
  }
};

Request.prototype.getQueryParameterString = function() {
  var queryParameters = this.getQueryParameters();
  if (queryParameters) {
    return (
      '?' +
      Object.keys(queryParameters)
        .filter(function(key) {
          return queryParameters[key] !== undefined;
        })
        .map(function(key) {
          return key + '=' + queryParameters[key];
        })
        .join('&')
    );
  }
};

Request.prototype.execute = function(method, callback) {
  if (callback) {
    method(this, callback);
    return;
  }
  var _self = this;

  return new Promise(function(resolve, reject) {
    method(_self, function(error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

var Builder = function() {};

Builder.prototype._setter = function(key) {
  return function(value) {
    this[key] = value;
    return this;
  };
};

Builder.prototype.withHost = Builder.prototype._setter('host');

Builder.prototype.withPort = Builder.prototype._setter('port');

Builder.prototype.withScheme = Builder.prototype._setter('scheme');

Builder.prototype.withPath = Builder.prototype._setter('path');

Builder.prototype._assigner = function(key) {
  return function() {
    for (var i = 0; i < arguments.length; i++) {
      this[key] = this._assign(this[key], arguments[i]);
    }
    
    return this;
  };
};

Builder.prototype.withQueryParameters = Builder.prototype._assigner(
  'queryParameters'
);

Builder.prototype.withBodyParameters = Builder.prototype._assigner(
  'bodyParameters'
);

Builder.prototype.withHeaders = Builder.prototype._assigner('headers');

Builder.prototype.withAuth = function(accessToken) {
  if (accessToken) {
    this.withHeaders({ Authorization: 'Bearer ' + accessToken });
  }
  return this;
};

Builder.prototype._assign = function(src, obj) {
  if (obj && Array.isArray(obj)) {
    return obj;
  }
  if (obj && typeof obj === 'string') {
    return obj;
  }
  if (obj && Object.keys(obj).length > 0) {
    return Object.assign(src || {}, obj);
  }
  return src;
};

Builder.prototype.build = function() {
  return new Request(this);
};

module.exports.builder = function() {
  return new Builder();
};

},{}],40:[function(require,module,exports){
module.exports = require('./spotify-web-api');

},{"./spotify-web-api":43}],41:[function(require,module,exports){
'use strict';

var superagent = require('superagent'),
  { TimeoutError, 
    WebapiError, 
    WebapiRegularError, 
    WebapiAuthenticationError,
    WebapiPlayerError 
  } =  require('./response-error');

var HttpManager = {};

/* Create superagent options from the base request */
var _getParametersFromRequest = function(request) {
  var options = {};

  if (request.getQueryParameters()) {
    options.query = request.getQueryParameters();
  }

  if (request.getHeaders() && request.getHeaders()['Content-Type'] === 'application/json') {
    options.data = JSON.stringify(request.getBodyParameters());
  } else if (request.getBodyParameters()) {
    options.data = request.getBodyParameters();
  }

  if (request.getHeaders()) {
    options.headers = request.getHeaders();
  }
  return options;
};

var _toError = function(response) {
  if (typeof response.body === 'object' && response.body.error && typeof response.body.error === 'object' && response.body.error.reason) {
    return new WebapiPlayerError(response.body, response.headers, response.statusCode);
  }

  if (typeof response.body === 'object' && response.body.error && typeof response.body.error === 'object') {
    return new WebapiRegularError(response.body, response.headers, response.statusCode);
  }

  if (typeof response.body === 'object' && response.body.error && typeof response.body.error === 'string') {
    return new WebapiAuthenticationError(response.body, response.headers, response.statusCode);
  }
  
  /* Other type of error, or unhandled Web API error format */
  return new WebapiError(response.body, response.headers, response.statusCode, response.body);
};

/* Make the request to the Web API */
HttpManager._makeRequest = function(method, options, uri, callback) {
  var req = method.bind(superagent)(uri);

  if (options.query) {
    req.query(options.query);
  }

  if (options.headers) {
    req.set(options.headers);
  }

  if (options.data) {
    req.send(options.data);
  }

  req.end(function(err, response) {
    if (err) {
      if (err.timeout) {
        return callback(new TimeoutError());
      } else if (err.response) {
        return callback(_toError(err.response));
      } else {
        return callback(err);
      }
    }

    return callback(null, {
      body: response.body,
      headers: response.headers,
      statusCode: response.statusCode
    });
  });
};

/**
 * Make a HTTP GET request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.get = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = superagent.get;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP POST request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.post = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = superagent.post;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP DELETE request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.del = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = superagent.del;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP PUT request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.put = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = superagent.put;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

module.exports = HttpManager;
},{"./response-error":42,"superagent":46}],42:[function(require,module,exports){
/* Timeout */
class NamedError extends Error {
  get name() {
    return this.constructor.name;
  }  
}

class TimeoutError extends NamedError {
  constructor() {
    const message = 'A timeout occurred while communicating with Spotify\'s Web API.';
    super(message);
  }

}

/* Web API Parent and fallback error */
class WebapiError extends NamedError {
  constructor(body, headers, statusCode, message) {
    super(message);
    this.body = body;
    this.headers = headers;
    this.statusCode = statusCode;
  }

}

/** 
 * Regular Error
 * { status : <integer>, message : <string> }
 */
class WebapiRegularError extends WebapiError {
  constructor(body, headers, statusCode) {
    const message = 'An error occurred while communicating with Spotify\'s Web API.\n' +
    'Details: ' + body.error.message + '.';

    super(body, headers, statusCode, message);
  }
}

/**
 * Authentication Error 
 * { error : <string>, error_description : <string> }
 */
class WebapiAuthenticationError extends WebapiError {
  constructor(body, headers, statusCode) {
    const message = 'An authentication error occurred while communicating with Spotify\'s Web API.\n' +
    'Details: ' + body.error + (body.error_description ? ' ' + body.error_description + '.' : '.');

    super(body, headers, statusCode, message);
  }
}

/**
 * Player Error 
 * { status : <integer>, message : <string>, reason : <string> }
 */
class WebapiPlayerError extends WebapiError {
  constructor(body, headers, statusCode) {
    const message = 'An error occurred while communicating with Spotify\'s Web API.\n' +
    'Details: ' + body.error.message + (body.error.reason ? ' ' + body.error.reason + '.' : '.');

    super(body, headers, statusCode, message);
  }
}

module.exports = { WebapiError, TimeoutError, WebapiRegularError, WebapiAuthenticationError, WebapiPlayerError };
},{}],43:[function(require,module,exports){
'use strict';

var AuthenticationRequest = require('./authentication-request'),
  WebApiRequest = require('./webapi-request'),
  HttpManager = require('./http-manager');

function SpotifyWebApi(credentials) {
  this._credentials = credentials || {};
}

SpotifyWebApi.prototype = {
  setCredentials: function(credentials) {
    for (var key in credentials) {
      if (credentials.hasOwnProperty(key)) {
        this._credentials[key] = credentials[key];
      }
    }
  },

  getCredentials: function() {
    return this._credentials;
  },

  resetCredentials: function() {
    this._credentials = null;
  },

  setClientId: function(clientId) {
    this._setCredential('clientId', clientId);
  },

  setClientSecret: function(clientSecret) {
    this._setCredential('clientSecret', clientSecret);
  },

  setAccessToken: function(accessToken) {
    this._setCredential('accessToken', accessToken);
  },

  setRefreshToken: function(refreshToken) {
    this._setCredential('refreshToken', refreshToken);
  },

  setRedirectURI: function(redirectUri) {
    this._setCredential('redirectUri', redirectUri);
  },

  getRedirectURI: function() {
    return this._getCredential('redirectUri');
  },

  getClientId: function() {
    return this._getCredential('clientId');
  },

  getClientSecret: function() {
    return this._getCredential('clientSecret');
  },

  getAccessToken: function() {
    return this._getCredential('accessToken');
  },

  getRefreshToken: function() {
    return this._getCredential('refreshToken');
  },

  resetClientId: function() {
    this._resetCredential('clientId');
  },

  resetClientSecret: function() {
    this._resetCredential('clientSecret');
  },

  resetAccessToken: function() {
    this._resetCredential('accessToken');
  },

  resetRefreshToken: function() {
    this._resetCredential('refreshToken');
  },

  resetRedirectURI: function() {
    this._resetCredential('redirectUri');
  },

  _setCredential: function(credentialKey, value) {
    this._credentials = this._credentials || {};
    this._credentials[credentialKey] = value;
  },

  _getCredential: function(credentialKey) {
    if (!this._credentials) {
      return;
    } else {
      return this._credentials[credentialKey];
    }
  },

  _resetCredential: function(credentialKey) {
    if (!this._credentials) {
      return;
    } else {
      this._credentials[credentialKey] = null;
    }
  },

  /**
   * Look up a track.
   * @param {string} trackId The track's ID.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getTrack('3Qm86XLflmIXVm1wcwkgDK').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the track. Not returned if a callback is given.
   */
  getTrack: function(trackId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/tracks/' + trackId)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up several tracks.
   * @param {string[]} trackIds The IDs of the artists.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtists(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the artists. Not returned if a callback is given.
   */
  getTracks: function(trackIds, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/tracks')
      .withQueryParameters(
        {
          ids: trackIds.join(',')
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up an album.
   * @param {string} albumId The album's ID.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAlbum('0sNOF9WDwhWunNAHPD3Baj').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the album. Not returned if a callback is given.
   */
  getAlbum: function(albumId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/albums/' + albumId)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up several albums.
   * @param {string[]} albumIds The IDs of the albums.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAlbums(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the albums. Not returned if a callback is given.
   */
  getAlbums: function(albumIds, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/albums')
      .withQueryParameters(
        {
          ids: albumIds.join(',')
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up an artist.
   * @param {string} artistId The artist's ID.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example api.getArtist('1u7kkVrr14iBvrpYnZILJR').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the artist. Not returned if a callback is given.
   */
  getArtist: function(artistId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/artists/' + artistId)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up several artists.
   * @param {string[]} artistIds The IDs of the artists.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtists(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the artists. Not returned if a callback is given.
   */
  getArtists: function(artistIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/artists')
      .withQueryParameters({
        ids: artistIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Search for music entities of certain types.
   * @param {string} query The search query.
   * @param {string[]} types An array of item types to search across.
   * Valid types are: 'album', 'artist', 'playlist', 'track', 'show', and 'episode'.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example search('Abba', ['track', 'playlist'], { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  search: function(query, types, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/search/')
      .withQueryParameters(
        {
          type: types.join(','),
          q: query
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Search for an album.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchAlbums('Space Oddity', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchAlbums: function(query, options, callback) {
    return this.search(query, ['album'], options, callback);
  },

  /**
   * Search for an artist.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchArtists('David Bowie', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchArtists: function(query, options, callback) {
    return this.search(query, ['artist'], options, callback);
  },

  /**
   * Search for a track.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchTracks('Mr. Brightside', { limit : 3, offset : 2 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchTracks: function(query, options, callback) {
    return this.search(query, ['track'], options, callback);
  },

  /**
   * Search for playlists.
   * @param {string} query The search query.
   * @param {Object} options The possible options.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchPlaylists('workout', { limit : 1, offset : 0 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchPlaylists: function(query, options, callback) {
    return this.search(query, ['playlist'], options, callback);
  },

  /**
   * Get an artist's albums.
   * @param {string} artistId The artist's ID.
   * @options {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtistAlbums('0oSGxfWSnnOXhD2fKuz2Gy', { album_type : 'album', country : 'GB', limit : 2, offset : 5 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the albums
   *          for the given artist. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  getArtistAlbums: function(artistId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/artists/' + artistId + '/albums')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the tracks of an album.
   * @param albumId the album's ID.
   * @options {Object} [options] The possible options, e.g. limit.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAlbumTracks('41MnTivkwTO3UUJ8DrqEJJ', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *                    tracks in the album. The result is paginated. If the promise is rejected.
   *                    it contains an error object. Not returned if a callback is given.
   */
  getAlbumTracks: function(albumId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/albums/' + albumId + '/tracks')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get an artist's top tracks.
   * @param {string} artistId The artist's ID.
   * @param {string} country The country/territory where the tracks are most popular. (format: ISO 3166-1 alpha-2)
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtistTopTracks('0oSGxfWSnnOXhD2fKuz2Gy', 'GB').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          artist's top tracks in the given country. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  getArtistTopTracks: function(artistId, country, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/artists/' + artistId + '/top-tracks')
      .withQueryParameters({
        country: country
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get related artists.
   * @param {string} artistId The artist's ID.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtistRelatedArtists('0oSGxfWSnnOXhD2fKuz2Gy').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          related artists. If the promise is rejected, it contains an error object. Not returned if a callback is given.
   */
  getArtistRelatedArtists: function(artistId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/artists/' + artistId + '/related-artists')
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get information about a user.
   * @param userId The user ID.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getUser('thelinmichael').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the user. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  getUser: function(userId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/users/' + encodeURIComponent(userId))
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get information about the user that has signed in (the current user).
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getMe().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the user. The amount of information
   *          depends on the permissions given by the user. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  getMe: function(callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me')
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get a user's playlists.
   * @param {string} userId An optional id of the user. If you know the Spotify URI it is easy
   * to find the id (e.g. spotify:user:<here_is_the_id>). If not provided, the id of the user that granted
   * the permissions will be used.
   * @param {Object} [options] The options supplied to this request.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getUserPlaylists('thelinmichael').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          a list of playlists. If rejected, it contains an error object. Not returned if a callback is given.
   */
  getUserPlaylists: function(userId, options, callback) {
    var path;
    if (typeof userId === 'string') {
      path = '/v1/users/' + encodeURIComponent(userId) + '/playlists';
    } else if (typeof userId === 'object') {
      callback = options;
      options = userId;
      path = '/v1/me/playlists';
    } /* undefined */ else {
      path = '/v1/me/playlists';
    }

    return WebApiRequest.builder(this.getAccessToken())
      .withPath(path)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get a playlist.
   * @param {string} playlistId The playlist's ID.
   * @param {Object} [options] The options supplied to this request.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getPlaylist('3EsfV6XzCHU8SPNdbnFogK').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          the playlist. If rejected, it contains an error object. Not returned if a callback is given.
   */
  getPlaylist: function(playlistId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get tracks in a playlist.
   * @param {string} playlistId The playlist's ID.
   * @param {Object} [options] Optional options, such as fields.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getPlaylistTracks('3ktAYNcRHpazJ9qecm3ptn').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object that containing
   * the tracks in the playlist. If rejected, it contains an error object. Not returned if a callback is given.
   */
  getPlaylistTracks: function(playlistId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Create a playlist.
   * @param {string} [name] The name of the playlist.
   * @param {Object} [options] The possible options, being description, collaborative and public.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example createPlaylist('My playlist', {''description': 'My description', 'collaborative' : false, 'public': true}).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing information about the
   *          created playlist. If rejected, it contains an error object. Not returned if a callback is given.
   */
  createPlaylist: function(name, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/playlists')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters({
        name : name,
      }, options)
      .build()
      .execute(HttpManager.post, callback);
  },

  /**
   * Follow a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {Object} [options] The possible options, currently only public.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  followPlaylist: function(playlistId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/followers')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(options)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Unfollow a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  unfollowPlaylist: function(playlistId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/followers')
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Change playlist details.
   * @param {string} playlistId The playlist's ID
   * @param {Object} [options] The possible options, e.g. name, public.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example changePlaylistDetails('3EsfV6XzCHU8SPNdbnFogK', {name: 'New name', public: true}).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  changePlaylistDetails: function(playlistId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId)
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(options)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Replace the image used to represent a specific playlist.
   * @param {string} playlistId The playlist's ID
   * @param {string} base64URI Base64 encoded JPEG image data, maximum payload size is 256 KB
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example uploadCustomPlaylistCoverImage('3EsfV6XzCHU8SPNdbnFogK', 'longbase64uri').then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  uploadCustomPlaylistCoverImage: function(playlistId, base64URI, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/images')
      .withHeaders({ 'Content-Type': 'image/jpeg' })
      .withBodyParameters(base64URI)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Add tracks to a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {string[]} tracks URIs of the tracks to add to the playlist.
   * @param {Object} [options] Options, position being the only one.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example addTracksToPlaylist('3EsfV6XzCHU8SPNdbnFogK',
              '["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", "spotify:track:1301WleyT98MSxVHPZCA6M"]').then(...)
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  addTracksToPlaylist: function(playlistId, tracks, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withQueryParameters(options)
      .withBodyParameters({
        uris: tracks
      })
      .build()
      .execute(HttpManager.post, callback);
  },

  /**
   * Remove tracks from a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {Object[]} tracks An array of objects containing a property called uri with the track URI (String), and
   * an optional property called positions (int[]), e.g. { uri : "spotify:track:491rM2JN8KvmV6p0oDDuJT", positions : [0, 15] }
   * @param {Object} options Options, snapshot_id being the only one.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  removeTracksFromPlaylist: function(playlistId, tracks, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(
        {
          tracks: tracks
        }, 
        options
      )
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Remove tracks from a playlist by position instead of specifying the tracks' URIs.
   * @param {string} playlistId The playlist's ID
   * @param {int[]} positions The positions of the tracks in the playlist that should be removed
   * @param {string} snapshot_id The snapshot ID, or version, of the playlist. Required
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  removeTracksFromPlaylistByPosition: function(
    playlistId,
    positions,
    snapshotId,
    callback
  ) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters({
        positions: positions,
        snapshot_id: snapshotId
      })
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Replace tracks in a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {Object[]} uris An array of track URIs (strings)
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  replaceTracksInPlaylist: function(playlistId, uris, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters({
        uris: uris
      })
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Reorder tracks in a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {int} rangeStart The position of the first track to be reordered.
   * @param {int} insertBefore The position where the tracks should be inserted.
   * @param {Object} options Optional parameters, i.e. range_length and snapshot_id.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  reorderTracksInPlaylist: function(
    playlistId,
    rangeStart,
    insertBefore,
    options,
    callback
  ) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(
        {
          range_start: rangeStart,
          insert_before: insertBefore
        },
        options
      )
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Get audio features for a single track identified by its unique Spotify ID.
   * @param {string} trackId The track ID
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAudioFeaturesForTrack('38P3Q4QcdjQALGF2Z92BmR').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the audio features. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  getAudioFeaturesForTrack: function(trackId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/audio-features/' + trackId)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get audio analysis for a single track identified by its unique Spotify ID.
   * @param {string} trackId The track ID
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAudioAnalysisForTrack('38P3Q4QcdjQALGF2Z92BmR').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the audio analysis. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  getAudioAnalysisForTrack: function(trackId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/audio-analysis/' + trackId)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get audio features for multiple tracks identified by their unique Spotify ID.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAudioFeaturesForTracks(['38P3Q4QcdjQALGF2Z92BmR', '2HO2bnoMrpnZUbUqiilLHi']).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the audio features for the tracks. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  getAudioFeaturesForTracks: function(trackIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/audio-features')
      .withQueryParameters({
        ids: trackIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Create a playlist-style listening experience based on seed artists, tracks and genres.
   * @param {Object} [options] The options supplied to this request.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getRecommendations({ min_energy: 0.4, seed_artists: ['6mfK6Q2tzLMEchAr0e9Uzu', '4DYFVNKZ1uixa6SQTvzQwJ'], min_popularity: 50 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          a list of tracks and a list of seeds. If rejected, it contains an error object. Not returned if a callback is given.
   */
  getRecommendations: function(options, callback) {
    var _opts = {};
    var optionsOfTypeArray = ['seed_artists', 'seed_genres', 'seed_tracks'];
    for (var option in options) {
      if (options.hasOwnProperty(option)) {
        if (
          optionsOfTypeArray.indexOf(option) !== -1 &&
          Object.prototype.toString.call(options[option]) === '[object Array]'
        ) {
          _opts[option] = options[option].join(',');
        } else {
          _opts[option] = options[option];
        }
      }
    }

    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/recommendations')
      .withQueryParameters(_opts)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve a list of available genres seed parameter values for recommendations.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAvailableGenreSeeds().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          a list of available genres to be used as seeds for recommendations.
   *          If rejected, it contains an error object. Not returned if a callback is given.
   */
  getAvailableGenreSeeds: function(callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/recommendations/available-genre-seeds')
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve the tracks that are saved to the authenticated users Your Music library.
   * @param {Object} [options] Options, being market, limit, and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which in turn contains
   *          playlist track objects. Not returned if a callback is given.
   */
  getMySavedTracks: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/tracks')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Check if one or more tracks is already saved in the current Spotify user’s “Your Music” library.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   * of the returned array's elements correspond to the track ID in the request.
   * The boolean value of true indicates that the track is part of the user's library, otherwise false.
   * Not returned if a callback is given.
   */
  containsMySavedTracks: function(trackIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/tracks/contains')
      .withQueryParameters({
        ids: trackIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Remove a track from the authenticated user's Your Music library.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error.
   * Not returned if a callback is given.
   */
  removeFromMySavedTracks: function(trackIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters({ ids: trackIds })
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Add a track from the authenticated user's Your Music library.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error. Not returned if a callback is given.
   */
  addToMySavedTracks: function(trackIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters({ ids: trackIds })
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Remove an album from the authenticated user's Your Music library.
   * @param {string[]} albumIds The album IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error.
   * Not returned if a callback is given.
   */
  removeFromMySavedAlbums: function(albumIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/albums')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(albumIds)
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Add an album from the authenticated user's Your Music library.
   * @param {string[]} albumIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error. Not returned if a callback is given.
   */
  addToMySavedAlbums: function(albumIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/albums')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(albumIds)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Retrieve the albums that are saved to the authenticated users Your Music library.
   * @param {Object} [options] Options, being market, limit, and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which in turn contains
   *          playlist album objects. Not returned if a callback is given.
   */
  getMySavedAlbums: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/albums')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Check if one or more albums is already saved in the current Spotify user’s “Your Music” library.
   * @param {string[]} albumIds The album IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   * of the returned array's elements correspond to the album ID in the request.
   * The boolean value of true indicates that the album is part of the user's library, otherwise false.
   * Not returned if a callback is given.
   */
  containsMySavedAlbums: function(albumIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/albums/contains')
      .withQueryParameters({
        ids: albumIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the current user's top artists based on calculated affinity.
   * @param {Object} [options] Options, being time_range, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of artists,
   *          otherwise an error. Not returned if a callback is given.
   */
  getMyTopArtists: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/top/artists')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the current user's top tracks based on calculated affinity.
   * @param {Object} [options] Options, being time_range, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
   *          otherwise an error. Not returned if a callback is given.
   */
  getMyTopTracks: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/top/tracks')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the Current User's Recently Played Tracks
   * @param {Object} [options] Options, being type, after, limit, before.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of play history objects,
   *          otherwise an error. Not returned if a callback is given. Note that the response will be empty
   *          in case the user has enabled private session.
   */
  getMyRecentlyPlayedTracks: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/recently-played')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Add track or episode to device queue
   * @param {string} [uri] uri of the track or episode to add
   * @param {Object} [options] Options, being device_id.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
   *          otherwise an error. Not returned if a callback is given.
   */
  addToQueue: function(uri, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/queue')
      .withQueryParameters(
        {
          uri: uri
        },
        options
      )
      .build()
      .execute(HttpManager.post, callback);
  },


  /** 
   * Get the Current User's Available Devices
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of device objects,
   *          otherwise an error. Not returned if a callback is given.
   */
  getMyDevices: function(callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/devices')
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the Current User's Currently Playing Track.
   * @param {Object} [options] Options, being market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
   *          otherwise an error. Not returned if a callback is given.
   */
  getMyCurrentPlayingTrack: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/currently-playing')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get Information About The User's Current Playback State
   * @param {Object} [options] Options, being market and additional_types.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
   *          otherwise an error. Not returned if a callback is given.
   */
  getMyCurrentPlaybackState: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Transfer a User's Playback
   * @param {string[]} [deviceIds] An _array_ containing a device ID on which playback should be started/transferred. 
   * (NOTE: The API is currently only supporting a single device ID.)
   * @param {Object} [options] Options, the only one being 'play'.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  transferMyPlayback: function(deviceIds, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(
        {
          device_ids: deviceIds,
        },
        options
      )
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Starts o Resumes the Current User's Playback
   * @param {Object} [options] Options, being device_id, context_uri, offset, uris, position_ms.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example play({context_uri: 'spotify:album:5ht7ItJgpBH7W6vJ5BqpPr'}).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  play: function(options, callback) {
    /*jshint camelcase: false */
    var _options = options || {};
    var queryParams = _options.device_id
      ? { device_id: _options.device_id }
      : null;
    var postData = {};
    ['context_uri', 'uris', 'offset', 'position_ms'].forEach(function(field) {
      if (field in _options) {
        postData[field] = _options[field];
      }
    });
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/play')
      .withQueryParameters(queryParams)
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(postData)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Pauses the Current User's Playback
   * @param {Object} [options] Options, being device_id. If left empty will target the user's currently active device.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example pause().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  pause: function(options, callback) {
    return (
      WebApiRequest.builder(this.getAccessToken())
        .withPath('/v1/me/player/pause')
        /*jshint camelcase: false */
        .withQueryParameters(
          options && options.device_id ? { device_id: options.device_id } : null
        )
        .withHeaders({ 'Content-Type': 'application/json' })
        .build()
        .execute(HttpManager.put, callback)
    );
  },

  /**
   * Skip the Current User's Playback To Previous Track
   * @param {Object} [options] Options, being device_id. If left empty will target the user's currently active device.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example skipToPrevious().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  skipToPrevious: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/previous')
      .withQueryParameters(
        options && options.device_id ? { device_id: options.device_id } : null
      )
      .build()
      .execute(HttpManager.post, callback);
  },

  /**
   * Skip the Current User's Playback To Next Track
   * @param {Object} [options] Options, being device_id. If left empty will target the user's currently active device.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example skipToNext().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  skipToNext: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/next')
      .withQueryParameters(
        options && options.device_id ? { device_id: options.device_id } : null
      )
      .build()
      .execute(HttpManager.post, callback);
  },

  /**
   * Seeks to the given position in the user’s currently playing track.
   *
   * @param {number} positionMs The position in milliseconds to seek to. Must be a positive number.
   * @param {Object} options Options, being device_id. If left empty will target the user's currently active device.
   * @param {function(Object,Object)} callback An optional callback that receives 2 parameters. The first
   * one is the error object (null if no error), and the second is the value if the request succeeded.
   * @return {Object} Null if a callback is provided, a `Promise` object otherwise
   */
  seek: function(positionMs, options, callback) {
    var params = {
      /* jshint camelcase: false */
      position_ms: positionMs
    };
    if (options && 'device_id' in options) {
      /* jshint camelcase: false */
      params.device_id = options.device_id;
    }
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/seek')
      .withQueryParameters(params)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Set Repeat Mode On The Current User's Playback
   * @param {string} [state] State (track, context, or off)
   * @param {Object} [options] Options, being device_id. If left empty will target the user's currently active device.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example setRepeat('context', {}).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  setRepeat: function(state, options, callback) {
    var params = {
      state: state
    };
    if (options && 'device_id' in options) {
      /* jshint camelcase: false */
      params.device_id = options.device_id;
    }
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/repeat')
      .withQueryParameters(params)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Set Shuffle Mode On The Current User's Playback
   * @param {boolean} [state] State 
   * @param {Object} [options] Options, being device_id. If left empty will target the user's currently active device.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example setShuffle({state: 'false'}).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  setShuffle: function(state, options, callback) {
    var params = {
      state: state
    };
    if (options && 'device_id' in options) {
      /* jshint camelcase: false */
      params.device_id = options.device_id;
    }
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/shuffle')
      .withQueryParameters(params)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Set the volume for the user’s current playback device.
   * @param {number} volumePercent The volume to set. Must be a value from 0 to 100.
   * @param {Object} options Options, being device_id. If left empty will target the user's currently active device.
   * @param {function(Object,Object)} callback An optional callback that receives 2 parameters. The first
   * one is the error object (null if no error), and the second is the value if the request succeeded.
   * @return {Object} Null if a callback is provided, a `Promise` object otherwise
   */
  setVolume: function(volumePercent, options, callback) {
    var params = {
      /* jshint camelcase: false */
      volume_percent: volumePercent
    };
    if (options && 'device_id' in options) {
      /* jshint camelcase: false */
      params.device_id = options.device_id;
    }
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/volume')
      .withQueryParameters(params)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Add the current user as a follower of one or more other Spotify users.
   * @param {string[]} userIds The IDs of the users to be followed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example followUsers(['thelinmichael', 'wizzler']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  followUsers: function(userIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: userIds.join(','),
        type: 'user'
      })
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Add the current user as a follower of one or more artists.
   * @param {string[]} artistIds The IDs of the artists to be followed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example followArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  followArtists: function(artistIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: artistIds.join(','),
        type: 'artist'
      })
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Remove the current user as a follower of one or more other Spotify users.
   * @param {string[]} userIds The IDs of the users to be unfollowed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example unfollowUsers(['thelinmichael', 'wizzler']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  unfollowUsers: function(userIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: userIds.join(','),
        type: 'user'
      })
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Remove the current user as a follower of one or more artists.
   * @param {string[]} artistIds The IDs of the artists to be unfollowed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example unfollowArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  unfollowArtists: function(artistIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: artistIds.join(','),
        type: 'artist'
      })
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Check to see if the current user is following one or more other Spotify users.
   * @param {string[]} userIds The IDs of the users to check if are followed by the current user.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example isFollowingUsers(['thelinmichael', 'wizzler']).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   *          of the returned array's elements correspond to the users IDs in the request.
   *          The boolean value of true indicates that the user is following that user, otherwise is not.
   *          Not returned if a callback is given.
   */
  isFollowingUsers: function(userIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following/contains')
      .withQueryParameters({
        ids: userIds.join(','),
        type: 'user'
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the current user's followed artists.
   * @param {Object} [options] Options, being after and limit.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
   * album objects. Not returned if a callback is given.
   */
  getFollowedArtists: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following')
      .withQueryParameters(
        {
          type: 'artist'
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Check if users are following a playlist.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {String[]} User IDs of the following users
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an array of booleans. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  areFollowingPlaylist: function(userId, playlistId, followerIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath(
        '/v1/users/' +
          encodeURIComponent(userId) +
          '/playlists/' +
          playlistId +
          '/followers/contains'
      )
      .withQueryParameters({
        ids: followerIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Check to see if the current user is following one or more artists.
   * @param {string[]} artistIds The IDs of the artists to check if are followed by the current user.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example isFollowingArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   *          of the returned array's elements correspond to the artists IDs in the request.
   *          The boolean value of true indicates that the user is following that artist, otherwise is not.
   *          Not returned if a callback is given.
   */
  isFollowingArtists: function(artistIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following/contains')
      .withQueryParameters({
        ids: artistIds.join(','),
        type: 'artist'
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve new releases
   * @param {Object} [options] Options, being country, limit and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
   * album objects. Not returned if a callback is given.
   */
  getNewReleases: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/browse/new-releases')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve featured playlists
   * @param {Object} [options] Options, being country, locale, timestamp, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
   * featured playlists. Not returned if a callback is given.
   */
  getFeaturedPlaylists: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/browse/featured-playlists')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve a list of categories used to tag items in Spotify (e.g. in the 'Browse' tab)
   * @param {Object} [options] Options, being country, locale, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object of categories.
   * Not returned if a callback is given.
   */
  getCategories: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/browse/categories')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve a category.
   * @param {string} categoryId The id of the category to retrieve.
   * @param {Object} [options] Options, being country, locale.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a category object.
   * Not returned if a callback is given.
   */
  getCategory: function(categoryId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/browse/categories/' + categoryId)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve playlists for a category.
   * @param {string} categoryId The id of the category to retrieve playlists for.
   * @param {Object} [options] Options, being country, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to a paging object containing simple playlists.
   * Not returned if a callback is given.
   */
  getPlaylistsForCategory: function(categoryId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/browse/categories/' + categoryId + '/playlists')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get a show.
   * @param {string} showId The show's ID.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getShow('3Qm86XLflmIXVm1wcwkgDK').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the show. Not returned if a callback is given.
   */
  getShow: function(showId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
    .withPath('/v1/shows/' + showId)
    .withQueryParameters(options)
    .build()
    .execute(HttpManager.get, callback);
  },

  /**
   * Look up several shows.
   * @param {string[]} showIds The IDs of the shows.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getShows(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the shows. Not returned if a callback is given.
   */
  getShows: function(showIds, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/shows')
      .withQueryParameters(
        {
          ids: showIds.join(',')
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Check if one or more shows is already saved in the current Spotify user’s “Your Music” library.
   * @param {string[]} showIds The show IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   * of the returned array's elements correspond to the show ID in the request.
   * The boolean value of true indicates that the show is part of the user's library, otherwise false.
   * Not returned if a callback is given.
   */
  containsMySavedShows: function(showIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/shows/contains')
      .withQueryParameters({
        ids: showIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Remove an show from the authenticated user's Your Music library.
   * @param {string[]} showIds The show IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error.
   * Not returned if a callback is given.
   */
  removeFromMySavedShows: function(showIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/shows')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(showIds)
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Add a show from the authenticated user's Your Music library.
   * @param {string[]} showIds The show IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error. Not returned if a callback is given.
   */
  addToMySavedShows: function(showIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/shows')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(showIds)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Retrieve the shows that are saved to the authenticated users Your Music library.
   * @param {Object} [options] Options, being market, limit, and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which in turn contains
   *          playlist show objects. Not returned if a callback is given.
   */
  getMySavedShows: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/shows')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the episodes of an show.
   * @param showId the show's ID.
   * @options {Object} [options] The possible options, being limit, offset, and market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getShowEpisodes('41MnTivkwTO3UUJ8DrqEJJ', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *                    episodes in the album. The result is paginated. If the promise is rejected.
   *                    it contains an error object. Not returned if a callback is given.
   */
  getShowEpisodes: function(showId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/shows/' + showId + '/episodes')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Search for a show.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchShows('Space Oddity', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchShows: function(query, options, callback) {
    return this.search(query, ['show'], options, callback);
  },

  /**
   * Search for an episode.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchEpisodes('Space Oddity', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchEpisodes: function(query, options, callback) {
    return this.search(query, ['episode'], options, callback);
  },

 /**
   * Look up an episode.
   * @param {string} episodeId The episode's ID.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getEpisode('3Qm86XLflmIXVm1wcwkgDK').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the episode. Not returned if a callback is given.
   */
  getEpisode: function(episodeId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/episodes/' + episodeId)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up several episodes.
   * @param {string[]} episodeIds The IDs of the episodes.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getEpisodes(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the episodes. Not returned if a callback is given.
   */
  getEpisodes: function(episodeIds, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/episodes')
      .withQueryParameters(
        {
          ids: episodeIds.join(',')
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },
};

SpotifyWebApi._addMethods = function(methods) {
  for (var i in methods) {
    if (methods.hasOwnProperty(i)) {
      this.prototype[i] = methods[i];
    }
  }
};

module.exports = SpotifyWebApi;

},{"./authentication-request":38,"./http-manager":41,"./webapi-request":44}],44:[function(require,module,exports){
'use strict';

var Request = require('./base-request');

var DEFAULT_HOST = 'api.spotify.com',
  DEFAULT_PORT = 443,
  DEFAULT_SCHEME = 'https';

module.exports.builder = function(accessToken) {
  return Request.builder()
    .withHost(DEFAULT_HOST)
    .withPort(DEFAULT_PORT)
    .withScheme(DEFAULT_SCHEME)
    .withAuth(accessToken);
};

},{"./base-request":39}],45:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function Agent() {
  this._defaults = [];
}

['use', 'on', 'once', 'set', 'query', 'type', 'accept', 'auth', 'withCredentials', 'sortQuery', 'retry', 'ok', 'redirects', 'timeout', 'buffer', 'serialize', 'parse', 'ca', 'key', 'pfx', 'cert', 'disableTLSCerts'].forEach(function (fn) {
  // Default setting for all requests from this agent
  Agent.prototype[fn] = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    this._defaults.push({
      fn: fn,
      args: args
    });

    return this;
  };
});

Agent.prototype._setDefaults = function (req) {
  this._defaults.forEach(function (def) {
    req[def.fn].apply(req, _toConsumableArray(def.args));
  });
};

module.exports = Agent;

},{}],46:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Root reference for iframes.
 */
var root;

if (typeof window !== 'undefined') {
  // Browser window
  root = window;
} else if (typeof self === 'undefined') {
  // Other environments
  console.warn('Using browser-only version of superagent in non-browser environment');
  root = void 0;
} else {
  // Web Worker
  root = self;
}

var Emitter = require('component-emitter');

var safeStringify = require('fast-safe-stringify');

var qs = require('qs');

var RequestBase = require('./request-base');

var isObject = require('./is-object');

var ResponseBase = require('./response-base');

var Agent = require('./agent-base');
/**
 * Noop.
 */


function noop() {}
/**
 * Expose `request`.
 */


module.exports = function (method, url) {
  // callback
  if (typeof url === 'function') {
    return new exports.Request('GET', method).end(url);
  } // url first


  if (arguments.length === 1) {
    return new exports.Request('GET', method);
  }

  return new exports.Request(method, url);
};

exports = module.exports;
var request = exports;
exports.Request = Request;
/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest && (!root.location || root.location.protocol !== 'file:' || !root.ActiveXObject)) {
    return new XMLHttpRequest();
  }

  try {
    return new ActiveXObject('Microsoft.XMLHTTP');
  } catch (_unused) {}

  try {
    return new ActiveXObject('Msxml2.XMLHTTP.6.0');
  } catch (_unused2) {}

  try {
    return new ActiveXObject('Msxml2.XMLHTTP.3.0');
  } catch (_unused3) {}

  try {
    return new ActiveXObject('Msxml2.XMLHTTP');
  } catch (_unused4) {}

  throw new Error('Browser-only version of superagent could not find XHR');
};
/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */


var trim = ''.trim ? function (s) {
  return s.trim();
} : function (s) {
  return s.replace(/(^\s*|\s*$)/g, '');
};
/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) pushEncodedKeyValuePair(pairs, key, obj[key]);
  }

  return pairs.join('&');
}
/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */


function pushEncodedKeyValuePair(pairs, key, val) {
  if (val === undefined) return;

  if (val === null) {
    pairs.push(encodeURI(key));
    return;
  }

  if (Array.isArray(val)) {
    val.forEach(function (v) {
      pushEncodedKeyValuePair(pairs, key, v);
    });
  } else if (isObject(val)) {
    for (var subkey in val) {
      if (Object.prototype.hasOwnProperty.call(val, subkey)) pushEncodedKeyValuePair(pairs, "".concat(key, "[").concat(subkey, "]"), val[subkey]);
    }
  } else {
    pairs.push(encodeURI(key) + '=' + encodeURIComponent(val));
  }
}
/**
 * Expose serialization method.
 */


request.serializeObject = serialize;
/**
 * Parse the given x-www-form-urlencoded `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');

    if (pos === -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] = decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}
/**
 * Expose parser.
 */


request.parseString = parseString;
/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'text/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  form: 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};
/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

request.serialize = {
  'application/x-www-form-urlencoded': qs.stringify,
  'application/json': safeStringify
};
/**
 * Default parsers.
 *
 *     superagent.parse['application/xml'] = function(str){
 *       return { object parsed from str };
 *     };
 *
 */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};
/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');

    if (index === -1) {
      // could be empty line, just skip it
      continue;
    }

    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}
/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */


function isJSON(mime) {
  // should match /json or +json
  // but not /json-seq
  return /[/+]json($|[^-\w])/i.test(mime);
}
/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */


function Response(req) {
  this.req = req;
  this.xhr = this.req.xhr; // responseText is accessible only if responseType is '' or 'text' and on older browsers

  this.text = this.req.method !== 'HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text') || typeof this.xhr.responseType === 'undefined' ? this.xhr.responseText : null;
  this.statusText = this.req.xhr.statusText;
  var status = this.xhr.status; // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request

  if (status === 1223) {
    status = 204;
  }

  this._setStatusProperties(status);

  this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  this.header = this.headers; // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.

  this.header['content-type'] = this.xhr.getResponseHeader('content-type');

  this._setHeaderProperties(this.header);

  if (this.text === null && req._responseType) {
    this.body = this.xhr.response;
  } else {
    this.body = this.req.method === 'HEAD' ? null : this._parseBody(this.text ? this.text : this.xhr.response);
  }
} // eslint-disable-next-line new-cap


ResponseBase(Response.prototype);
/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function (str) {
  var parse = request.parse[this.type];

  if (this.req._parser) {
    return this.req._parser(this, str);
  }

  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }

  return parse && str && (str.length > 0 || str instanceof Object) ? parse(str) : null;
};
/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */


Response.prototype.toError = function () {
  var req = this.req;
  var method = req.method;
  var url = req.url;
  var msg = "cannot ".concat(method, " ").concat(url, " (").concat(this.status, ")");
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;
  return err;
};
/**
 * Expose `Response`.
 */


request.Response = Response;
/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case

  this._header = {}; // coerces header names to lowercase

  this.on('end', function () {
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch (err_) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = err_; // issue #675: return the raw response if the response parsing fails

      if (self.xhr) {
        // ie9 doesn't have 'response' property
        err.rawResponse = typeof self.xhr.responseType === 'undefined' ? self.xhr.responseText : self.xhr.response; // issue #876: return the http status code if the response parsing fails

        err.status = self.xhr.status ? self.xhr.status : null;
        err.statusCode = err.status; // backwards-compat only
      } else {
        err.rawResponse = null;
        err.status = null;
      }

      return self.callback(err);
    }

    self.emit('response', res);
    var new_err;

    try {
      if (!self._isResponseOK(res)) {
        new_err = new Error(res.statusText || res.text || 'Unsuccessful HTTP response');
      }
    } catch (err_) {
      new_err = err_; // ok() callback can throw
    } // #1000 don't catch errors from the callback to avoid double calling it


    if (new_err) {
      new_err.original = err;
      new_err.response = res;
      new_err.status = res.status;
      self.callback(new_err, res);
    } else {
      self.callback(null, res);
    }
  });
}
/**
 * Mixin `Emitter` and `RequestBase`.
 */
// eslint-disable-next-line new-cap


Emitter(Request.prototype); // eslint-disable-next-line new-cap

RequestBase(Request.prototype);
/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function (type) {
  this.set('Content-Type', request.types[type] || type);
  return this;
};
/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.accept = function (type) {
  this.set('Accept', request.types[type] || type);
  return this;
};
/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} [pass] optional in case of using 'bearer' as type
 * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.auth = function (user, pass, options) {
  if (arguments.length === 1) pass = '';

  if (_typeof(pass) === 'object' && pass !== null) {
    // pass is optional and can be replaced with options
    options = pass;
    pass = '';
  }

  if (!options) {
    options = {
      type: typeof btoa === 'function' ? 'basic' : 'auto'
    };
  }

  var encoder = function encoder(string) {
    if (typeof btoa === 'function') {
      return btoa(string);
    }

    throw new Error('Cannot use basic auth, btoa is not a function');
  };

  return this._auth(user, pass, options, encoder);
};
/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.query = function (val) {
  if (typeof val !== 'string') val = serialize(val);
  if (val) this._query.push(val);
  return this;
};
/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.attach = function (field, file, options) {
  if (file) {
    if (this._data) {
      throw new Error("superagent can't mix .send() and .attach()");
    }

    this._getFormData().append(field, file, options || file.name);
  }

  return this;
};

Request.prototype._getFormData = function () {
  if (!this._formData) {
    this._formData = new root.FormData();
  }

  return this._formData;
};
/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */


Request.prototype.callback = function (err, res) {
  if (this._shouldRetry(err, res)) {
    return this._retry();
  }

  var fn = this._callback;
  this.clearTimeout();

  if (err) {
    if (this._maxRetries) err.retries = this._retries - 1;
    this.emit('error', err);
  }

  fn(err, res);
};
/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */


Request.prototype.crossDomainError = function () {
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;
  err.status = this.status;
  err.method = this.method;
  err.url = this.url;
  this.callback(err);
}; // This only warns, because the request is still likely to work


Request.prototype.agent = function () {
  console.warn('This is not supported in browser version of superagent');
  return this;
};

Request.prototype.ca = Request.prototype.agent;
Request.prototype.buffer = Request.prototype.ca; // This throws, because it can't send/receive data as expected

Request.prototype.write = function () {
  throw new Error('Streaming is not supported in browser version of superagent');
};

Request.prototype.pipe = Request.prototype.write;
/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * @param {Object} obj host object
 * @return {Boolean} is a host object
 * @api private
 */

Request.prototype._isHost = function (obj) {
  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
  return obj && _typeof(obj) === 'object' && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
};
/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.end = function (fn) {
  if (this._endCalled) {
    console.warn('Warning: .end() was called twice. This is not supported in superagent');
  }

  this._endCalled = true; // store callback

  this._callback = fn || noop; // querystring

  this._finalizeQueryString();

  this._end();
};

Request.prototype._setUploadTimeout = function () {
  var self = this; // upload timeout it's wokrs only if deadline timeout is off

  if (this._uploadTimeout && !this._uploadTimeoutTimer) {
    this._uploadTimeoutTimer = setTimeout(function () {
      self._timeoutError('Upload timeout of ', self._uploadTimeout, 'ETIMEDOUT');
    }, this._uploadTimeout);
  }
}; // eslint-disable-next-line complexity


Request.prototype._end = function () {
  if (this._aborted) return this.callback(new Error('The request has been aborted even before .end() was called'));
  var self = this;
  this.xhr = request.getXHR();
  var xhr = this.xhr;
  var data = this._formData || this._data;

  this._setTimeouts(); // state change


  xhr.onreadystatechange = function () {
    var readyState = xhr.readyState;

    if (readyState >= 2 && self._responseTimeoutTimer) {
      clearTimeout(self._responseTimeoutTimer);
    }

    if (readyState !== 4) {
      return;
    } // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"


    var status;

    try {
      status = xhr.status;
    } catch (_unused5) {
      status = 0;
    }

    if (!status) {
      if (self.timedout || self._aborted) return;
      return self.crossDomainError();
    }

    self.emit('end');
  }; // progress


  var handleProgress = function handleProgress(direction, e) {
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;

      if (e.percent === 100) {
        clearTimeout(self._uploadTimeoutTimer);
      }
    }

    e.direction = direction;
    self.emit('progress', e);
  };

  if (this.hasListeners('progress')) {
    try {
      xhr.addEventListener('progress', handleProgress.bind(null, 'download'));

      if (xhr.upload) {
        xhr.upload.addEventListener('progress', handleProgress.bind(null, 'upload'));
      }
    } catch (_unused6) {// Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
      // Reported here:
      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
    }
  }

  if (xhr.upload) {
    this._setUploadTimeout();
  } // initiate request


  try {
    if (this.username && this.password) {
      xhr.open(this.method, this.url, true, this.username, this.password);
    } else {
      xhr.open(this.method, this.url, true);
    }
  } catch (err) {
    // see #1149
    return this.callback(err);
  } // CORS


  if (this._withCredentials) xhr.withCredentials = true; // body

  if (!this._formData && this.method !== 'GET' && this.method !== 'HEAD' && typeof data !== 'string' && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];

    var _serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];

    if (!_serialize && isJSON(contentType)) {
      _serialize = request.serialize['application/json'];
    }

    if (_serialize) data = _serialize(data);
  } // set header fields


  for (var field in this.header) {
    if (this.header[field] === null) continue;
    if (Object.prototype.hasOwnProperty.call(this.header, field)) xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  } // send stuff


  this.emit('request', this); // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined

  xhr.send(typeof data === 'undefined' ? null : data);
};

request.agent = function () {
  return new Agent();
};

['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT', 'DELETE'].forEach(function (method) {
  Agent.prototype[method.toLowerCase()] = function (url, fn) {
    var req = new request.Request(method, url);

    this._setDefaults(req);

    if (fn) {
      req.end(fn);
    }

    return req;
  };
});
Agent.prototype.del = Agent.prototype.delete;
/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.get = function (url, data, fn) {
  var req = request('GET', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.head = function (url, data, fn) {
  var req = request('HEAD', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.options = function (url, data, fn) {
  var req = request('OPTIONS', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * DELETE `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


function del(url, data, fn) {
  var req = request('DELETE', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
}

request.del = del;
request.delete = del;
/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.patch = function (url, data, fn) {
  var req = request('PATCH', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.post = function (url, data, fn) {
  var req = request('POST', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.put = function (url, data, fn) {
  var req = request('PUT', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./agent-base":45,"./is-object":47,"./request-base":48,"./response-base":49,"component-emitter":31,"fast-safe-stringify":32,"qs":34}],47:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
function isObject(obj) {
  return obj !== null && _typeof(obj) === 'object';
}

module.exports = isObject;

},{}],48:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');
/**
 * Expose `RequestBase`.
 */


module.exports = RequestBase;
/**
 * Initialize a new `RequestBase`.
 *
 * @api public
 */

function RequestBase(object) {
  if (object) return mixin(object);
}
/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */


function mixin(object) {
  for (var key in RequestBase.prototype) {
    if (Object.prototype.hasOwnProperty.call(RequestBase.prototype, key)) object[key] = RequestBase.prototype[key];
  }

  return object;
}
/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.clearTimeout = function () {
  clearTimeout(this._timer);
  clearTimeout(this._responseTimeoutTimer);
  clearTimeout(this._uploadTimeoutTimer);
  delete this._timer;
  delete this._responseTimeoutTimer;
  delete this._uploadTimeoutTimer;
  return this;
};
/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */


RequestBase.prototype.parse = function (fn) {
  this._parser = fn;
  return this;
};
/**
 * Set format of binary response body.
 * In browser valid formats are 'blob' and 'arraybuffer',
 * which return Blob and ArrayBuffer, respectively.
 *
 * In Node all values result in Buffer.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.responseType = function (value) {
  this._responseType = value;
  return this;
};
/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */


RequestBase.prototype.serialize = function (fn) {
  this._serializer = fn;
  return this;
};
/**
 * Set timeouts.
 *
 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
 * - upload is the time  since last bit of data was sent or received. This timeout works only if deadline timeout is off
 *
 * Value of 0 or false means no timeout.
 *
 * @param {Number|Object} ms or {response, deadline}
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.timeout = function (options) {
  if (!options || _typeof(options) !== 'object') {
    this._timeout = options;
    this._responseTimeout = 0;
    this._uploadTimeout = 0;
    return this;
  }

  for (var option in options) {
    if (Object.prototype.hasOwnProperty.call(options, option)) {
      switch (option) {
        case 'deadline':
          this._timeout = options.deadline;
          break;

        case 'response':
          this._responseTimeout = options.response;
          break;

        case 'upload':
          this._uploadTimeout = options.upload;
          break;

        default:
          console.warn('Unknown timeout option', option);
      }
    }
  }

  return this;
};
/**
 * Set number of retry attempts on error.
 *
 * Failed requests will be retried 'count' times if timeout or err.code >= 500.
 *
 * @param {Number} count
 * @param {Function} [fn]
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.retry = function (count, fn) {
  // Default to 1 if no count passed or true
  if (arguments.length === 0 || count === true) count = 1;
  if (count <= 0) count = 0;
  this._maxRetries = count;
  this._retries = 0;
  this._retryCallback = fn;
  return this;
}; //
// NOTE: we do not include ESOCKETTIMEDOUT because that is from `request` package
//       <https://github.com/sindresorhus/got/pull/537>
//
// NOTE: we do not include EADDRINFO because it was removed from libuv in 2014
//       <https://github.com/libuv/libuv/commit/02e1ebd40b807be5af46343ea873331b2ee4e9c1>
//       <https://github.com/request/request/search?q=ESOCKETTIMEDOUT&unscoped_q=ESOCKETTIMEDOUT>
//
//
// TODO: expose these as configurable defaults
//


var ERROR_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'EADDRINUSE', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN']);
var STATUS_CODES = new Set([408, 413, 429, 500, 502, 503, 504, 521, 522, 524]); // TODO: we would need to make this easily configurable before adding it in (e.g. some might want to add POST)
// const METHODS = new Set(['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE']);

/**
 * Determine if a request should be retried.
 * (Inspired by https://github.com/sindresorhus/got#retry)
 *
 * @param {Error} err an error
 * @param {Response} [res] response
 * @returns {Boolean} if segment should be retried
 */

RequestBase.prototype._shouldRetry = function (err, res) {
  if (!this._maxRetries || this._retries++ >= this._maxRetries) {
    return false;
  }

  if (this._retryCallback) {
    try {
      var override = this._retryCallback(err, res);

      if (override === true) return true;
      if (override === false) return false; // undefined falls back to defaults
    } catch (err_) {
      console.error(err_);
    }
  } // TODO: we would need to make this easily configurable before adding it in (e.g. some might want to add POST)

  /*
  if (
    this.req &&
    this.req.method &&
    !METHODS.has(this.req.method.toUpperCase())
  )
    return false;
  */


  if (res && res.status && STATUS_CODES.has(res.status)) return true;

  if (err) {
    if (err.code && ERROR_CODES.has(err.code)) return true; // Superagent timeout

    if (err.timeout && err.code === 'ECONNABORTED') return true;
    if (err.crossDomain) return true;
  }

  return false;
};
/**
 * Retry request
 *
 * @return {Request} for chaining
 * @api private
 */


RequestBase.prototype._retry = function () {
  this.clearTimeout(); // node

  if (this.req) {
    this.req = null;
    this.req = this.request();
  }

  this._aborted = false;
  this.timedout = false;
  this.timedoutError = null;
  return this._end();
};
/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} [reject]
 * @return {Request}
 */


RequestBase.prototype.then = function (resolve, reject) {
  var _this = this;

  if (!this._fullfilledPromise) {
    var self = this;

    if (this._endCalled) {
      console.warn('Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises');
    }

    this._fullfilledPromise = new Promise(function (resolve, reject) {
      self.on('abort', function () {
        if (_this._maxRetries && _this._maxRetries > _this._retries) {
          return;
        }

        if (_this.timedout && _this.timedoutError) {
          reject(_this.timedoutError);
          return;
        }

        var err = new Error('Aborted');
        err.code = 'ABORTED';
        err.status = _this.status;
        err.method = _this.method;
        err.url = _this.url;
        reject(err);
      });
      self.end(function (err, res) {
        if (err) reject(err);else resolve(res);
      });
    });
  }

  return this._fullfilledPromise.then(resolve, reject);
};

RequestBase.prototype.catch = function (cb) {
  return this.then(undefined, cb);
};
/**
 * Allow for extension
 */


RequestBase.prototype.use = function (fn) {
  fn(this);
  return this;
};

RequestBase.prototype.ok = function (cb) {
  if (typeof cb !== 'function') throw new Error('Callback required');
  this._okCallback = cb;
  return this;
};

RequestBase.prototype._isResponseOK = function (res) {
  if (!res) {
    return false;
  }

  if (this._okCallback) {
    return this._okCallback(res);
  }

  return res.status >= 200 && res.status < 300;
};
/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */


RequestBase.prototype.get = function (field) {
  return this._header[field.toLowerCase()];
};
/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */


RequestBase.prototype.getHeader = RequestBase.prototype.get;
/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.set = function (field, value) {
  if (isObject(field)) {
    for (var key in field) {
      if (Object.prototype.hasOwnProperty.call(field, key)) this.set(key, field[key]);
    }

    return this;
  }

  this._header[field.toLowerCase()] = value;
  this.header[field] = value;
  return this;
};
/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field field name
 */


RequestBase.prototype.unset = function (field) {
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};
/**
 * Write the field `name` and `val`, or multiple fields with one object
 * for "multipart/form-data" request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 *
 * request.post('/upload')
 *   .field({ foo: 'bar', baz: 'qux' })
 *   .end(callback);
 * ```
 *
 * @param {String|Object} name name of field
 * @param {String|Blob|File|Buffer|fs.ReadStream} val value of field
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.field = function (name, value) {
  // name should be either a string or an object.
  if (name === null || undefined === name) {
    throw new Error('.field(name, val) name can not be empty');
  }

  if (this._data) {
    throw new Error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObject(name)) {
    for (var key in name) {
      if (Object.prototype.hasOwnProperty.call(name, key)) this.field(key, name[key]);
    }

    return this;
  }

  if (Array.isArray(value)) {
    for (var i in value) {
      if (Object.prototype.hasOwnProperty.call(value, i)) this.field(name, value[i]);
    }

    return this;
  } // val should be defined now


  if (value === null || undefined === value) {
    throw new Error('.field(name, val) val can not be empty');
  }

  if (typeof value === 'boolean') {
    value = String(value);
  }

  this._getFormData().append(name, value);

  return this;
};
/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request} request
 * @api public
 */


RequestBase.prototype.abort = function () {
  if (this._aborted) {
    return this;
  }

  this._aborted = true;
  if (this.xhr) this.xhr.abort(); // browser

  if (this.req) this.req.abort(); // node

  this.clearTimeout();
  this.emit('abort');
  return this;
};

RequestBase.prototype._auth = function (user, pass, options, base64Encoder) {
  switch (options.type) {
    case 'basic':
      this.set('Authorization', "Basic ".concat(base64Encoder("".concat(user, ":").concat(pass))));
      break;

    case 'auto':
      this.username = user;
      this.password = pass;
      break;

    case 'bearer':
      // usage would be .auth(accessToken, { type: 'bearer' })
      this.set('Authorization', "Bearer ".concat(user));
      break;

    default:
      break;
  }

  return this;
};
/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */


RequestBase.prototype.withCredentials = function (on) {
  // This is browser-only functionality. Node side is no-op.
  if (on === undefined) on = true;
  this._withCredentials = on;
  return this;
};
/**
 * Set the max redirects to `n`. Does nothing in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.redirects = function (n) {
  this._maxRedirects = n;
  return this;
};
/**
 * Maximum size of buffered response body, in bytes. Counts uncompressed size.
 * Default 200MB.
 *
 * @param {Number} n number of bytes
 * @return {Request} for chaining
 */


RequestBase.prototype.maxResponseSize = function (n) {
  if (typeof n !== 'number') {
    throw new TypeError('Invalid argument');
  }

  this._maxResponseSize = n;
  return this;
};
/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */


RequestBase.prototype.toJSON = function () {
  return {
    method: this.method,
    url: this.url,
    data: this._data,
    headers: this._header
  };
};
/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */
// eslint-disable-next-line complexity


RequestBase.prototype.send = function (data) {
  var isObject_ = isObject(data);
  var type = this._header['content-type'];

  if (this._formData) {
    throw new Error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObject_ && !this._data) {
    if (Array.isArray(data)) {
      this._data = [];
    } else if (!this._isHost(data)) {
      this._data = {};
    }
  } else if (data && this._data && this._isHost(this._data)) {
    throw new Error("Can't merge these send calls");
  } // merge


  if (isObject_ && isObject(this._data)) {
    for (var key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) this._data[key] = data[key];
    }
  } else if (typeof data === 'string') {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];
    if (type) type = type.toLowerCase().trim();

    if (type === 'application/x-www-form-urlencoded') {
      this._data = this._data ? "".concat(this._data, "&").concat(data) : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!isObject_ || this._isHost(data)) {
    return this;
  } // default to json


  if (!type) this.type('json');
  return this;
};
/**
 * Sort `querystring` by the sort function
 *
 *
 * Examples:
 *
 *       // default order
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery()
 *         .end(callback)
 *
 *       // customized sort function
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery(function(a, b){
 *           return a.length - b.length;
 *         })
 *         .end(callback)
 *
 *
 * @param {Function} sort
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.sortQuery = function (sort) {
  // _sort default to true but otherwise can be a function or boolean
  this._sort = typeof sort === 'undefined' ? true : sort;
  return this;
};
/**
 * Compose querystring to append to req.url
 *
 * @api private
 */


RequestBase.prototype._finalizeQueryString = function () {
  var query = this._query.join('&');

  if (query) {
    this.url += (this.url.includes('?') ? '&' : '?') + query;
  }

  this._query.length = 0; // Makes the call idempotent

  if (this._sort) {
    var index = this.url.indexOf('?');

    if (index >= 0) {
      var queryArray = this.url.slice(index + 1).split('&');

      if (typeof this._sort === 'function') {
        queryArray.sort(this._sort);
      } else {
        queryArray.sort();
      }

      this.url = this.url.slice(0, index) + '?' + queryArray.join('&');
    }
  }
}; // For backwards compat only


RequestBase.prototype._appendQueryString = function () {
  console.warn('Unsupported');
};
/**
 * Invoke callback with timeout error.
 *
 * @api private
 */


RequestBase.prototype._timeoutError = function (reason, timeout, errno) {
  if (this._aborted) {
    return;
  }

  var err = new Error("".concat(reason + timeout, "ms exceeded"));
  err.timeout = timeout;
  err.code = 'ECONNABORTED';
  err.errno = errno;
  this.timedout = true;
  this.timedoutError = err;
  this.abort();
  this.callback(err);
};

RequestBase.prototype._setTimeouts = function () {
  var self = this; // deadline

  if (this._timeout && !this._timer) {
    this._timer = setTimeout(function () {
      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
    }, this._timeout);
  } // response timeout


  if (this._responseTimeout && !this._responseTimeoutTimer) {
    this._responseTimeoutTimer = setTimeout(function () {
      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
    }, this._responseTimeout);
  }
};

},{"./is-object":47}],49:[function(require,module,exports){
"use strict";

/**
 * Module dependencies.
 */
var utils = require('./utils');
/**
 * Expose `ResponseBase`.
 */


module.exports = ResponseBase;
/**
 * Initialize a new `ResponseBase`.
 *
 * @api public
 */

function ResponseBase(obj) {
  if (obj) return mixin(obj);
}
/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */


function mixin(obj) {
  for (var key in ResponseBase.prototype) {
    if (Object.prototype.hasOwnProperty.call(ResponseBase.prototype, key)) obj[key] = ResponseBase.prototype[key];
  }

  return obj;
}
/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */


ResponseBase.prototype.get = function (field) {
  return this.header[field.toLowerCase()];
};
/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */


ResponseBase.prototype._setHeaderProperties = function (header) {
  // TODO: moar!
  // TODO: make this a util
  // content-type
  var ct = header['content-type'] || '';
  this.type = utils.type(ct); // params

  var params = utils.params(ct);

  for (var key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) this[key] = params[key];
  }

  this.links = {}; // links

  try {
    if (header.link) {
      this.links = utils.parseLinks(header.link);
    }
  } catch (_unused) {// ignore
  }
};
/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */


ResponseBase.prototype._setStatusProperties = function (status) {
  var type = status / 100 | 0; // status / class

  this.statusCode = status;
  this.status = this.statusCode;
  this.statusType = type; // basics

  this.info = type === 1;
  this.ok = type === 2;
  this.redirect = type === 3;
  this.clientError = type === 4;
  this.serverError = type === 5;
  this.error = type === 4 || type === 5 ? this.toError() : false; // sugar

  this.created = status === 201;
  this.accepted = status === 202;
  this.noContent = status === 204;
  this.badRequest = status === 400;
  this.unauthorized = status === 401;
  this.notAcceptable = status === 406;
  this.forbidden = status === 403;
  this.notFound = status === 404;
  this.unprocessableEntity = status === 422;
};

},{"./utils":50}],50:[function(require,module,exports){
"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
exports.type = function (str) {
  return str.split(/ *; */).shift();
};
/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */


exports.params = function (val) {
  var obj = {};

  var _iterator = _createForOfIteratorHelper(val.split(/ *; */)),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var str = _step.value;
      var parts = str.split(/ *= */);
      var key = parts.shift();

      var _val = parts.shift();

      if (key && _val) obj[key] = _val;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return obj;
};
/**
 * Parse Link header fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */


exports.parseLinks = function (val) {
  var obj = {};

  var _iterator2 = _createForOfIteratorHelper(val.split(/ *, */)),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var str = _step2.value;
      var parts = str.split(/ *; */);
      var url = parts[0].slice(1, -1);
      var rel = parts[1].split(/ *= */)[1].slice(1, -1);
      obj[rel] = url;
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  return obj;
};
/**
 * Strip content related fields from `header`.
 *
 * @param {Object} header
 * @return {Object} header
 * @api private
 */


exports.cleanHeader = function (header, changesOrigin) {
  delete header['content-type'];
  delete header['content-length'];
  delete header['transfer-encoding'];
  delete header.host; // secuirty

  if (changesOrigin) {
    delete header.authorization;
    delete header.cookie;
  }

  return header;
};

},{}],51:[function(require,module,exports){
(function (process){(function (){
const SpotifyWebApi = require('spotify-web-api-node')
const axios = require('axios')

let roomID

const socket = io()

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
})

getAccessToken()

function getAccessToken() {
    axios.get('/access')
        .then(res => {
            spotifyApi.setAccessToken(res.data.accessToken)
        }).catch((err) => {
            console.log(err)
        })
}

roomID = window.location.pathname.substring(1,)

if (!roomID) {
    document.getElementById("join").addEventListener("submit", function (e) {
        e.preventDefault()

        let param = document.querySelector('input[name="room"]').value

        window.location = param.toUpperCase()
    })
}
else {
    socket.emit('userconnect', roomID, "player")

    socket.on('playerconnect', (name) => {
        console.log(name)
    })

    socket.on('addtrack', (id) => {
        const iframe = document.createElement('iframe')
        iframe.setAttribute('src', "https://open.spotify.com/embed/track/" + id + "?utm_source=generator&theme=0")
        iframe.setAttribute('height', "80")
        iframe.setAttribute('width', "100%")
        iframe.setAttribute('allow', "clipboard-write; encrypted-media")
        iframe.setAttribute('frameBorder', "0")
        document.getElementById('show').appendChild(iframe)
    })

    function debounce(callback, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(function () { callback.apply(this, args); }, wait);
        };
    }

    document.getElementById("search").addEventListener('keyup', debounce(() => {
        let search = document.getElementById("search").value
        if (search) {
            document.getElementById('show').style.display = 'none'
            getAccessToken()
            spotifyApi.searchTracks(search).then(res => {
                document.getElementById('results').innerHTML = ""
                res.body.tracks.items.forEach(track => {
                    const template = document.querySelector('#r')
                    const result = template.content.cloneNode(true)
                    result.querySelector('img').src = track.album.images[2].url
                    result.querySelector('h3').innerHTML = track.name
                    result.querySelector('.song').onclick = () => {
                        socket.emit('puttrack', roomID, track.id)
                        document.getElementById('results').innerHTML = ""
                        document.getElementById("search").value = ''
                        document.getElementById('show').style.display = 'block'
                    }
                    document.getElementById('results').appendChild(result)
                })
            }).catch(err => {
                console.log(err)
            })
        }
        else {
            document.getElementById('results').innerHTML = ""
        }
    }, 100))

    document.getElementById("message").addEventListener("submit", function (e) {
        e.preventDefault()

        let message = document.querySelector('input[name="message"]').value
        document.querySelector('input[name="message"]').value = ''

        socket.emit('message', roomID, message)
    })

    document.getElementById("leaveroom").addEventListener("click", () => {
        window.location = "/"
    })
}

(function () {
    window.onpageshow = function (event) {
        if (event.persisted) {
            window.location.reload();
        }
    };
})();
}).call(this)}).call(this,require('_process'))
},{"_process":1,"axios":2,"spotify-web-api-node":40}]},{},[51]);
