'use strict';

var domready = require('lib/ready');

var _app = require('app');
var app = null;

// init() should set up Isso, fetch configs & insert Postbox
//
// also insert comment counters for links to threads on page?
// -> IMO belongs into fetchComments? -> shove into own func
function init() {
  app = _app.App();
  app.initWidget();
};

// fetchComments() should.. fetch comments and insert them (or "load more")
function fetchComments() {
  app.fetchComments();
};

// count() should set/update _all_ comment counters, including the one above the Postbox
function count() {
  // Already part of initWidget() and thus init()
  app.counter.setCommentCounts();
};

domready(function() {
  init();
  fetchComments();
});

window.Isso = {
  init: init,
  fetchComments: fetchComments,
  count: count,
  // DEBUG only!
  app: app,
};
