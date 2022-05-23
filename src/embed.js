'use strict';

var app = require('app');
var counter = require('counter');
var domready = require('lib/domready');

var issoApp = null;

// init() should set up Isso, fetch configs & insert Postbox
// (at the moment does not fetch configs and no postbox)
function init() {
  issoApp.initWidget();
};

// fetchComments() should.. fetch comments and insert them (or "load more")
function fetchComments() {
  issoApp.fetchComments();
};

// count() should set/update _all_ comment counters, including the one above the Postbox
function count() {
  // Already part of initWidget() and thus init()
  issoApp.counter.count(counter.extractThreads(), null);
};

if (!window.Isso) { window.Isso = {} }

domready(function() {
  issoApp = new app.App();

  window.Isso.init = init;
  window.Isso.fetchComments = fetchComments;
  window.Isso.count = count;
  window.Isso.registerExtensions = issoApp.registerExtensions.bind(issoApp);
  // Called "unstable" because app internals are subject to change!
  window.Isso.unstableApp = issoApp;

  // Allow sites to prevent loading the Isso widget and instead
  // call init()/fetchComments() on their own
  if (window.Isso.preventInit === true) {
    return;
  }

  init();
  fetchComments();
});
