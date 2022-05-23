'use strict';

/*
 * Example extension.
 * Send auth header with every curl() call
 */

var AuthExtension = function() {
  var addAuthHeader = function(xhr) {
    // read auth from somewhere...
    var authHeader = ["Auth-Foo", "foo"];
    // and add it to every XMLHttpRequest:
    xhr.setRequestHeader(authHeader[0], authHeader[1]);
  };
  this.hooks = {
    "curl.xhr.pre": [addAuthHeader],
  };
};

module.exports = AuthExtension;
