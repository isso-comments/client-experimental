'use strict';
/*
Uses:
- DOM/jquery $ impl
  -> functional

One-time setup:

Functions:

Functions (DOM-dependent):

Functions (dependent on config):
*/

var $ = require('lib/dom');
var api = require('api');
var config = require('config');
var counter = require('counter');
var i18n = require('i18n');
var svg = require('svg');
var template = require('template');
var utils = require('utils');

// Not sure tracking state of these belongs in app.js?
var Q = require('lib/promise');
var doc = require('lib/document');
var offset = require('offset');

// Helper for rendering comment area below postbox
var commentHelper = require('comment');
// Helper for rendering Postboxes
var postboxHelper = require('postbox');

var extensions = require('extensions');

// Dependent on offset module with global state
var updateTimeOffset = function(date) {
  // is `offset` instance available when run through listener?
  offset.update(new Date(date));
};

var App = function() {
  var self = this; // Preserve App object instance context

  self.ext = new extensions();
  self.registerExtensions();

  self.api = new api.API(
    doc.getLocation(),
    doc.getEndpoint(),
    self.ext,
    { 'updateCookie': doc.updateCookie, 'updateTimeOffset': updateTimeOffset }
  );

  self._conf = new config.Config();
  self._conf.init();
  self.config = self._conf.config;
  self.defaultConfig = config.defaultConfig;

  self.i18n = new i18n.I18n();
  self.i18n.config = self.config;
  self.i18n.initTranslations();

  self.counter = new counter.Counter();
  self.counter.api = self.api;
  self.counter.i18n = self.i18n;

  self.localStorage = utils.localStorageImpl();
  self.template = new template.Template();

  self.template.templateVars["conf"] = self.config;
  self.template.templateVars["i18n"] = self.i18n;
  self.template.templateVars["svg"] = svg;

  // Own DOM elements
  this.issoRoot = null;
  this.issoThread = null;
  this.heading = null;

  // Signals other components that config has been fetched from server
  // and that init is done
  self.initDone = Q.waitFor();
};

App.prototype.registerExtensions = function() {
  var self = this; // Preserve App object instance context
  if (!(window.Isso && window.Isso.Ext)) {
    return;
  }
  try {
    self.ext.registerHooks(window.Isso.Ext.hooks);
  } catch (ex) {
    console.log("Error registering extensions:", ex);
  }
}

App.prototype.initWidget = function() {
  var self = this; // Preserve App object instance context

  self.initDone.reset();

  self.api.config().then(
    function(rv) {
      self.mergeConfigs(rv);

      self.issoThread = $('#isso-thread');
      if (!self.issoThread) {
        // Perhaps throw something here instead?
        return console.log("abort, #isso-thread is missing");
      }
      self.heading = $.new("h4.isso-thread-heading");
      self.issoThread.append(self.heading);
      self.insertStyles();
      self.counter.setCommentCounts();
      self.insertFeed();

      self.issoThread.append(self.createPostbox(null));
      self.issoThread.append('<div id="isso-root"></div>');

      // Fire registered listeners, e.g. pending fetchComments()
      self.initDone.onReady();
    },
    function(err) {
      console.log("Error fetching config from server");
    }
  );
};

App.prototype.insertStyles = function() {
  var self = this; // Preserve App object instance context
  if (self.config["css"] && $("style#isso-style") === null) {
    var style = $.new("link");
    style.id = "isso-style";
    style.rel ="stylesheet";
    style.type = "text/css";
    style.href = self.config["css-url"]
      ? self.config["css-url"]
      : self.api.endpoint + "/css/isso.css";
    $("head").append(style);
  }
}

App.prototype.insertFeed = function() {
  var self = this; // Preserve App object instance context
  if (self.config["feed"]) {
    var feedLink = $.new('a', self.i18n.translate('atom-feed'));
    var feedLinkWrapper = $.new('span.isso-feedlink');
    // What if data-isso-id not set? Fetch from server?
    var tid = self.issoThread.getAttribute("data-isso-id");
    feedLink.href = self.api.feed(tid);
    feedLinkWrapper.appendChild(feedLink);
    self.issoThread.append(feedLinkWrapper);
  }
};

App.prototype.fetchComments = function() {
  var self = this; // Preserve App object instance context

  if (!(self.initDone.isReady())) {
    self.initDone.register(self.fetchComments.bind(self));
    return;
  }

  if (!$('#isso-root')) {
    // Perhaps throw something here instead?
    return console.log("abort, #isso-root is missing");
  }
  self.issoRoot = $('#isso-root');
  self.issoRoot.textContent = '';

  var tid = self.issoThread.getAttribute("data-isso-id") || doc.getLocation();

  self.api.fetch(tid, self.config["max-comments-top"],
                 self.config["max-comments-nested"]).then(
    function (rv) {
      if (rv.total_replies === 0) {
        self.heading.textContent = self.i18n.translate("no-comments");
        return;
      }

      var lastCreated = 0;
      var count = rv.total_replies;
      rv.replies.forEach(function(comment) {
        self.insertComment(comment, false);
        if (comment.created > lastCreated) {
          lastCreated = comment.created;
        }
        count = count + comment.total_replies;
      });
      self.heading.textContent = self.i18n.pluralize("num-comments", count);

      if (rv.hidden_replies > 0) {
        self.createCommentObj().insertLoader(rv, lastcreated);
      }

      self.scrollToHash();
    },
    function(err) {
      console.log("Failed to fetch comments from server");
    }
  );
};

App.prototype.scrollToHash = function() {
  if (window.location.hash.length > 0 &&
      window.location.hash.match("^#isso-[0-9]+$")) {
    try {
      $(window.location.hash).scrollIntoView();
    } catch (ex) {
      // No elements with #hash, meh
    };
  }
};

App.prototype.mergeConfigs = function(rv) {
  var self = this; // Preserve App object instance context
  for (var setting in rv.config) {
    if (setting in self.config
          && self.config[setting] != self.defaultConfig[setting]
          && self.config[setting] != rv.config[setting]) {
        console.log("Isso: Client value '%s' for setting '%s' overridden by server value '%s'.\n" +
                    "Since Isso version 0.12.6, certain configuration options like 'data-isso-%s' " +
                    "that need to match a server setting are only configured via the server " +
                    "to keep both in sync",
                    self.config[setting], setting, rv.config[setting], setting);
    }
    self.config[setting] = rv.config[setting]
  }
  // Changing config again from now on is venturing into undefined territory...
  // -> but calling initWidget() again will result in new configs fetched from server,
  //    so don't freeze the obj
  //Object.freeze(self.config);
  return self.config;
};

App.prototype.createPostbox = function(parent) {
  var self = this; // Preserve App object instance context
  var _postbox = new postboxHelper.Postbox(parent, self.api, self, self.config,
      self.localStorage, self.template);
  return _postbox;
};

// Comment object scaffold, does not contain any actual data yet
// Also does not touch DOM yet
App.prototype.createCommentObj = function() {
  var self = this; // Preserve App object instance context
  var _comment = new commentHelper.Comment(self.api, self, self.config,
      self.i18n, self.template);
  return _comment;
};

// "Hydrate" and insert into DOM (either at #isso-root or below parent, if given)
App.prototype.insertComment = function(comment, scrollIntoView) {
  var self = this; // Preserve App object instance context
  var _comment = self.createCommentObj();
  _comment.insertComment(comment, scrollIntoView);
};

module.exports = {
  App: App,
};
