'use strict';
/*
Uses:
- promises/Q
  -> functional
- globals
  -> stateful

One-time setup:
- endpoint
  -> DOM dependent

(Private) helper functions:
- curl
  -> also updates globals offset on every server response, should probably not do that?
  -> should probably be window.Isso.globals.offset?
- qs

Functions, rely on endpoint:
- create
- modify
- remove
- view
- fetch
- count
- like
- dislike
- feed
- preview
*/

var Q = require('lib/promise');

var API_TIMEOUT = 5000; // 5 seconds
var API_RETRIES = 3; // 3 retries, then abort curl()

// Encode URI
var _qs = function(params) {
  var rv = "";
  for (var key in params) {
    if (params.hasOwnProperty(key) &&
      params[key] !== null && typeof(params[key]) !== "undefined") {
      rv += key + "=" + encodeURIComponent(params[key]) + "&";
    }
  }
  return rv.substring(0, rv.length - 1);  // chop off trailing "&"
};


var API = function(endpoint, ext, listeners) {
  this.endpoint = endpoint;
  this.ext = ext;
  this.listeners = listeners;
}

API.prototype.curl = function(method, url, data, resolve, reject, retries=0) {
  var self = this;

  var xhr = new XMLHttpRequest();
  function onload() {
    // Run extension hooks
    try {
      self.ext.runHooks("api.curl.onload", xhr);
    } catch (ex) {
      console.log("Error running API extension hooks: ", ex);
    }

    var date = xhr.getResponseHeader("Date");
    if (date !== null) {
      self.listeners.updateTimeOffset(new Date(date));
    }
    var cookie = xhr.getResponseHeader("X-Set-Cookie");
    if (cookie && cookie.match(/^isso-/)) {
      self.listeners.updateCookie(cookie);
    }
    if (xhr.status >= 500) {
      if (reject) {
        reject(xhr.body);
      }
    } else {
      resolve({status: xhr.status, body: xhr.responseText});
    }
  }

  try {
    xhr.open(method, url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.timeout = API_TIMEOUT; // time out after 5 seconds

    // Run extension hooks
    try {
      self.ext.runHooks("api.curl.pre", xhr);
    } catch (ex) {
      console.log("Error running API extension hooks: ", ex);
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        onload();
      }
    };
    xhr.ontimeout = function () {
      if (retries >= API_RETRIES) {
        (reject || console.log)("Request timed out too many times, aborting");
        return;
      }
      self.curl(method, url, data, resolve, reject, ++retries);
    };
  } catch (ex) {
    (reject || console.log)(ex.message);
  }
  xhr.send(data);
};

API.prototype.create = function(tid, data) {
  var self = this;
  var deferred = Q.defer();
  self.curl("POST", self.endpoint + "/new?" + _qs({uri: tid}), JSON.stringify(data),
    function (rv) {
      if (rv.status === 201 || rv.status === 202) {
        deferred.resolve(JSON.parse(rv.body));
      } else {
        deferred.reject(rv.body);
      }
    });
  return deferred.promise;
};

API.prototype.modify = function(id, data) {
  var self = this;
  var deferred = Q.defer();
  self.curl("PUT", self.endpoint + "/id/" + id, JSON.stringify(data), function (rv) {
    if (rv.status === 403) {
      deferred.reject("Not authorized to modify this comment!");
    } else if (rv.status === 200) {
      deferred.resolve(JSON.parse(rv.body));
    } else {
      deferred.reject(rv.body);
    }
  });
  return deferred.promise;
};

API.prototype.remove = function(id) {
  var self = this;
  var deferred = Q.defer();
  self.curl("DELETE", self.endpoint + "/id/" + id, null, function(rv) {
    if (rv.status === 403) {
      deferred.reject("Not authorized to remove this comment!");
    } else if (rv.status === 200) {
      deferred.resolve(JSON.parse(rv.body) === null);
    } else {
      deferred.reject(rv.body);
    }
  });
  return deferred.promise;
};

API.prototype.view = function(id, plain) {
  var self = this;
  var deferred = Q.defer();
  self.curl("GET", self.endpoint + "/id/" + id + "?" + _qs({plain: plain}), null,
    function(rv) {
      if (rv.status === 200) {
        deferred.resolve(JSON.parse(rv.body));
      } else {
        deferred.reject(rv.body);
      }
    });
  return deferred.promise;
};

API.prototype.fetch = function(tid, limit, nested_limit, parent, lastcreated) {
  var self = this;

  if (typeof(limit) === 'undefined') { limit = "inf"; }
  if (typeof(nested_limit) === 'undefined') { nested_limit = "inf"; }
  if (typeof(parent) === 'undefined') { parent = null; }

  var query_dict = {uri: tid, after: lastcreated, parent: parent};

  if(limit !== "inf") {
    query_dict['limit'] = limit;
  }
  if(nested_limit !== "inf"){
    query_dict['nested_limit'] = nested_limit;
  }

  var deferred = Q.defer();
  self.curl("GET", self.endpoint + "/?" +
    _qs(query_dict), null, function(rv) {
      if (rv.status === 200) {
        deferred.resolve(JSON.parse(rv.body));
      } else {
        deferred.reject(rv.body);
      }
    });
  return deferred.promise;
};

API.prototype.config = function() {
  var self = this;
  var deferred = Q.defer();
  self.curl("GET", self.endpoint + "/config", null, function(rv) {
    if (rv.status === 200) {
      deferred.resolve(JSON.parse(rv.body));
    } else {
      deferred.reject(rv.body);
    }
  });
  return deferred.promise;
};

API.prototype.count = function(urls) {
  var self = this;
  var deferred = Q.defer();
  self.curl("POST", self.endpoint + "/count", JSON.stringify(urls), function(rv) {
    if (rv.status === 200) {
      deferred.resolve(JSON.parse(rv.body));
    } else {
      deferred.reject(rv.body);
    }
  });
  return deferred.promise;
};

API.prototype.like = function(id) {
  var self = this;
  var deferred = Q.defer();
  self.curl("POST", self.endpoint + "/id/" + id + "/like", null, function(rv) {
    if (rv.status === 200) {
      deferred.resolve(JSON.parse(rv.body));
    } else {
      deferred.reject(rv.body);
    }
  });
  return deferred.promise;
};

API.prototype.dislike = function(id) {
  var self = this;
  var deferred = Q.defer();
  self.curl("POST", self.endpoint + "/id/" + id + "/dislike", null, function(rv) {
    if (rv.status === 200) {
      deferred.resolve(JSON.parse(rv.body));
    } else {
      deferred.reject(rv.body);
    }
  });
  return deferred.promise;
};

// Maybe doesn't need to be part of API module
// Note: Does not return a promise!
API.prototype.feed = function(tid) {
  return this.endpoint + "/feed?" + _qs({uri: tid});
};

API.prototype.preview = function(text) {
  var self = this;
  var deferred = Q.defer();
  self.curl("POST", self.endpoint + "/preview", JSON.stringify({text: text}),
    function(rv) {
       if (rv.status === 200) {
         deferred.resolve(JSON.parse(rv.body).text);
       } else {
         deferred.reject(rv.body);
       }
     });
  return deferred.promise;
};


module.exports = {
  API: API,
};
