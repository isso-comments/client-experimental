'use strict';

var app = require('app');
var domready = require('lib/ready');

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

if (!window.Isso) { window.Isso = {} }
window.Isso.init = init;
window.Isso.fetchComments = fetchComments;
window.Isso.count = count;
window.Isso.registerExtensions = issoApp.registerExtensions.bind(issoApp);
// Called "unstable" because app internals are subject to change!
window.Isso.unstableApp = issoApp;

domready(function() {
  // Allow sites to prevent loading the Isso widget and instead
  // call init()/fetchComments() on their own
  if (window.Isso.preventInit === true) {
    return;
  }
  init();
  fetchComments();
});
