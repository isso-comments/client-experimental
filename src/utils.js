'use strict';
/*
Uses:
(none)

One-time setup:
- localStorageImpl
  -> should only be called once and then return a handle

Functions:
- cookie
- detext
- localStorageImpl
- normalize_bcp47
- pad
- text
*/

var pad = function(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

var HTMLEntity = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;',
  "/": '&#x2F;'
};

var escape = function(html) {
  return String(html).replace(/[&<>"'\/]/g, function(s) {
    return HTMLEntity[s];
  });
};

// DOM dependent
// should be removed since it just causes headaches with indented code
var text = function(html) {
  var _ = document.createElement("div");
  _.innerHTML = html.replace(/<div><br><\/div>/gi, '<br>')
    .replace(/<div>/gi, '<br>')
    .replace(/<br>/gi, '\n')
    .replace(/&nbsp;/gi, ' ');
  return _.textContent.trim();
};

// DOM dependent
// should be removed since it just causes headaches with indented code
var detext = function(text) {
  text = escape(text);
  return text.replace(/\n\n/gi, '<br><div><br></div>')
    .replace(/\n/gi, '<br>');
};

// Normalize a BCP47 language tag.
// Quoting https://tools.ietf.org/html/bcp47 :
//   An implementation can reproduce this format without accessing
//   the registry as follows.  All subtags, including extension
//   and private use subtags, use lowercase letters with two
//   exceptions: two-letter and four-letter subtags that neither
//   appear at the start of the tag nor occur after singletons.
//   Such two-letter subtags are all uppercase (as in the tags
//   "en-CA-x-ca" or "sgn-BE-FR") and four-letter subtags are
//   titlecase (as in the tag "az-Latn-x-latn").
// We also map underscores to dashes.
var normalizeBCP47 = function(tag) {
  var subtags = tag.toLowerCase().split(/[_-]/);
  var afterSingleton = false;
  for (var i = 0; i < subtags.length; i++) {
    if (subtags[i].length === 1) {
      afterSingleton = true;
    } else if (afterSingleton || i === 0) {
      afterSingleton = false;
    } else if (subtags[i].length === 2) {
      subtags[i] = subtags[i].toUpperCase();
    } else if (subtags[i].length === 4) {
      subtags[i] = subtags[i].charAt(0).toUpperCase() +
        subtags[i].substr(1);
    }
  }
  return subtags.join("-");
};

// DOM dependent
// Safari private browsing mode supports localStorage, but throws QUOTA_EXCEEDED_ERR
var localStorageImpl = function() {
  try {
    localStorage.setItem("x", "y");
    localStorage.removeItem("x");
    return localStorage;
  } catch (ex) {
    localStorageFallback = (function(storage) {
      return {
        setItem: function(key, val) {
          storage[key] = val;
        },
        getItem: function(key) {
          return typeof(storage[key]) !== 'undefined' ? storage[key] : null;
        },
        removeItem: function(key) {
          delete storage[key];
        }
      };
    })({});
    return localStorageFallback;
  }
};

// DOM dependent
var endpoint = function() {
  var js = document.getElementsByTagName("script");
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

    var script = js[js.length - 1];
    url = script.src.substring(0, script.src.length - "/js/embed.min.js".length);
  }

  //  strip trailing slash
  if (url[url.length - 1] === "/") {
    url = url.substring(0, url.length - 1);
  }

  return url;
};

// DOM dependent
// In the future, might return full URL, not just path component
var location = function() {
  return window.location.pathname;
};

var threadId = function() {
  var thread = document.getElementById('isso-thread');
  if (!thread) {
    //console.log("abort, #isso-thread is missing");
    return null;
  }
  return thread.getAttribute("data-isso-id") || location();
};

// DOM dependent
var cookie = (function() {
  return {
    // return `cookie` string if set (e.g. `isso-1=foo`)
    get: function (cookie) {
      return (document.cookie.match('(^|; )' + cookie + '=([^;]*)') || 0)[2];
    },
    set: function(cookie) {
      document.cookie = cookie;
    },
  };
})();

module.exports = {
  detext: detext,
  cookie: cookie,
  endpoint: endpoint,
  location: location,
  localStorageImpl: localStorageImpl,
  normalizeBCP47: normalizeBCP47,
  pad: pad,
  text: text,
  threadId: threadId,
};
