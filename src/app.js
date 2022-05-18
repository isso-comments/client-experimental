'use strict';

var _api = require('api');
var api;

var widget = require('widget');

// init() should set up Isso, fetch configs & insert Postbox
//
// also insert comment counters for links to threads on page?
// -> IMO belongs into fetchComments? -> shove into own func
function init() {
  api = new _api.API();
  api.location = _api.getLocation();
  api.endpoint = _api.getEndpoint();
  window.API = api;
};

// fetchComments() should.. fetch comments and insert them (or "load more")
function fetchComments() {
};

// count() should set/update _all_ comment counters, including the one above the Postbox
function count() {
};

window.App = {
  init: init,
  fetchComments: fetchComments,
  count: count,
};
