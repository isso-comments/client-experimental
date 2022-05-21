/* Get and set information about the current document (window)
 * DOM dependent
 */

// DOM dependent
var getEndpoint = function() {
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
var getLocation = function() {
  return window.location.pathname;
};

// DOM dependent
var updateCookie = function(cookie) {
  document.cookie = cookie;
};

module.exports = {
  getEndpoint: getEndpoint,
  getLocation: getLocation,
  updateCookie: updateCookie,
};
