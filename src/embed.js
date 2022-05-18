'use strict';

var app = require('app');
var domready = require('lib/ready');

var appObj = null;

// init() should set up Isso, fetch configs & insert Postbox
//
// also insert comment counters for links to threads on page?
// -> IMO belongs into fetchComments? -> shove into own func
function init() {
  appObj = new app.App();
  appObj.initWidget();
};

// fetchComments() should.. fetch comments and insert them (or "load more")
function fetchComments() {
  appObj.fetchComments();
};

// count() should set/update _all_ comment counters, including the one above the Postbox
function count() {
  // Already part of initWidget() and thus init()
  appObj.counter.setCommentCounts();
};

domready(function() {
  init();
  fetchComments();

  window.Isso = {
    init: init,
    fetchComments: fetchComments,
    count: count,
    // DEBUG only!
    // -> does not seem to work because init() has not been called at time of
    // assignment to window.Isso, thus appObj == null
    // -> move window.Isso assignment into domread... yuck!
    app: appObj,
  };
});
