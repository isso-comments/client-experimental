'use strict';

var _api = require('api');
var api;

function init() {
  api = new _api.API();
  api.location = _api.getLocation();
  api.endpoint = _api.getEndpoint();
  window.API = api;
};

window.App = {
  init: init,
};
