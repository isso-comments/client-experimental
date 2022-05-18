/*
Uses:
- promises/Q
  -> functional
- globals
  -> stateful

One-time setup:
- salt
  -> constant
- location
  -> DOM dependent
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
var globals = require('globals');

var salt = "Eech7co8Ohloopo9Ol6baimi";

// DOM dependent
var getLocation = function() {
  return window.location.pathname;
};

// DOM dependent
var getEndpoint = function() {
  var js = document.getElementsByTagName("script");
  var script;
  var url;

  // prefer `data-isso="//host/api/endpoint"` if provided
  for (var i = 0; i < js.length; i++) {
    if (js[i].hasAttribute("data-isso")) {
      url = js[i].getAttribute("data-isso");
      break;
    }
  }

  // if no async-script is embedded, use the last script tag of `js`
  if (!url) {
    for (i = 0; i < js.length; i++) {
      if (js[i].getAttribute("async") || js[i].getAttribute("defer")) {
        throw "Isso's automatic configuration detection failed, please " +
              "refer to https://github.com/posativ/isso#client-configuration " +
              "and add a custom `data-isso` attribute.";
      }
    }

    script = js[js.length - 1];
    url = script.src.substring(0, script.src.length - "/js/embed.min.js".length);
  }

  //  strip trailing slash
  if (url[url.length - 1] === "/") {
    url = url.substring(0, url.length - 1);
  }

  return url;
};

// DOM dependent
// Split into own function to allow mocking
var _updateTimeOffset = function(date) {
  globals.offset.update(new Date(date));
};

// DOM dependent
// Split into own function to allow mocking
var _updateCookie = function(cookie) {
  document.cookie = cookie;
};

var _curl = function(method, url, data, resolve, reject) {
  var xhr = new XMLHttpRequest();
  function onload() {
    var date = xhr.getResponseHeader("Date");
    if (date !== null) {
      _updateTimeOffset(new Date(date));
    }
    var cookie = xhr.getResponseHeader("X-Set-Cookie");
    if (cookie && cookie.match(/^isso-/)) {
      _updateCookie(cookie);
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

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        onload();
      }
    };
  } catch (exception) {
    (reject || console.log)(exception.message);
  }
  xhr.send(data);
};

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


var API = function() {
  this.location = null;
  this.endpoint = null;
}

API.prototype.create = function(tid, data) {
  var deferred = Q.defer();
  var self = this; // Preserve Object context
  _curl("POST", self.endpoint + "/new?" + _qs({uri: tid || self.location}), JSON.stringify(data),
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
  var deferred = Q.defer();
  var self = this; // Preserve Object context
  _curl("PUT", self.endpoint + "/id/" + id, JSON.stringify(data), function (rv) {
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
  var deferred = Q.defer();
  var self = this; // Preserve Object context
  _curl("DELETE", self.endpoint + "/id/" + id, null, function(rv) {
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
  var deferred = Q.defer();
  var self = this; // Preserve Object context
  _curl("GET", self.endpoint + "/id/" + id + "?" + _qs({plain: plain}), null,
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
  var self = this; // Preserve Object context

  if (typeof(limit) === 'undefined') { limit = "inf"; }
  if (typeof(nested_limit) === 'undefined') { nested_limit = "inf"; }
  if (typeof(parent) === 'undefined') { parent = null; }

  var query_dict = {uri: tid || self.location, after: lastcreated, parent: parent};

  if(limit !== "inf") {
    query_dict['limit'] = limit;
  }
  if(nested_limit !== "inf"){
    query_dict['nested_limit'] = nested_limit;
  }

  var deferred = Q.defer();
  _curl("GET", self.endpoint + "/?" +
    _qs(query_dict), null, function(rv) {
      if (rv.status === 200) {
        deferred.resolve(JSON.parse(rv.body));
      } else if (rv.status === 404) {
        deferred.resolve({total_replies: 0});
      } else {
        deferred.reject(rv.body);
      }
    });
  return deferred.promise;
};

API.prototype.count = function(urls) {
  var self = this; // Preserve Object context
  var deferred = Q.defer();
  _curl("POST", self.endpoint + "/count", JSON.stringify(urls), function(rv) {
    if (rv.status === 200) {
      deferred.resolve(JSON.parse(rv.body));
    } else {
      deferred.reject(rv.body);
    }
  });
  return deferred.promise;
};

API.prototype.like = function(id) {
  var self = this; // Preserve Object context
  var deferred = Q.defer();
  _curl("POST", self.endpoint + "/id/" + id + "/like", null, function(rv) {
    if (rv.status === 200) {
      deferred.resolve(JSON.parse(rv.body));
    } else {
      deferred.reject(rv.body);
    }
  });
  return deferred.promise;
};

API.prototype.dislike = function(id) {
  var self = this; // Preserve Object context
  var deferred = Q.defer();
  _curl("POST", self.endpoint + "/id/" + id + "/dislike", null, function(rv) {
    if (rv.status === 200) {
      deferred.resolve(JSON.parse(rv.body));
    } else {
      deferred.reject(rv.body);
    }
  });
  return deferred.promise;
};

API.prototype.feed = function(tid) {
  return this.endpoint + "/feed?" + _qs({uri: tid || location()});
};

API.prototype.preview = function(text) {
  var self = this; // Preserve Object context
  var deferred = Q.defer();
  _curl("POST", self.endpoint + "/preview", JSON.stringify({text: text}),
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
  salt: salt,
  getLocation: getLocation,
  getEndpoint: getEndpoint,
};
