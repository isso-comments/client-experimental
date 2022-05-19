'use strict';

var app = require('app');
var domready = require('lib/ready');

// closure, but should not be necessary
/*
var issoApp = function() {
  var appObj = null;
  return {
    var setApp = function(obj) { appObj = obj; },
    var getApp = function() { return appObj; },
  }
};
*/

var authExt = require('ext/auth');
var auth = new authExt();

window.IssoExt = {
  hooks: auth.hooks,
}

var issoApp = new app.App();

// init() should set up Isso, fetch configs & insert Postbox
// (at the moment does not fetch configs and no postbox)
function init() {
  issoApp.initWidget();
  // also insert comment counters for links to threads on page?
  // -> IMO belongs into fetchComments? -> shove into own func
};

// fetchComments() should.. fetch comments and insert them (or "load more")
function fetchComments() {
  issoApp.fetchComments();
};

// count() should set/update _all_ comment counters, including the one above the Postbox
function count() {
  // Already part of initWidget() and thus init()
  issoApp.counter.setCommentCounts();
};

domready(function() {
  init();
  fetchComments();
});

window.Isso = {
  init: init,
  fetchComments: fetchComments,
  count: count,
  // Called "unstable" because app internals are subject to change!
  unstableApp: issoApp,
};
