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
var i18n = require('i18n');
var svg = require('svg');
var template = require('template');

var commentHelper = require('comment');
var postbox = require('postbox');

var App = function() {
  this.api = null;
  this.config = null;
  this.counter = null;
  this.i18n = null;
  this.localStorage = null;
  this.template = null;

  // Own DOM elements
  this.issoRoot = null;
  this.issoThread = null;
  this.heading = null;
};

App.prototype.constructor = function() {
  var self = this; // Preserve App object instance context

  self.api = new api.API();
  self.api.location = api.getLocation();
  self.api.endpoint = api.getEndpoint();

  self.config = new config.Config();
  self.config.init();

  self.counter = new counter.Counter();
  self.counter.api = self.api;
  self.counter.pluralize = self.i18n.pluralize;

  self.i18n = new i18n.I18n();
  self.i18n.setLangs();

  self.localStorage = utils.localStorageImpl();
  self.template = new template.Template();

  self.template.set("conf", self.config);
  self.template.set("i18n", self.i18n.translate);
  self.template.set("pluralize", self.i18n.pluralize);
  self.template.set("svg", svg);
};

App.prototype.initWidget = function() {
  var self = this; // Preserve App object instance context

  self.issoThread = $('#isso-thread');
  self.heading = $.new("h4");

  self.insertStyles();

  self.counter.setCommentCounts();

  if (!self.issoThread) {
    // Perhaps throw something here instead?
    return console.log("abort, #isso-thread is missing");
  }

  self.insertFeed();

  self.issoThread.append(heading);
  self.issoThread.append('<div id="isso-root"></div>');
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
  if (!$('#isso-root')) {
    // Perhaps throw something here instead?
    return console.log("abort, #isso-root is missing");
  }
  self.issoRoot = $('#isso-root');
  self.issoRoot.textContent = '';

  var tid = self.issoThread.getAttribute("data-isso-id") || self.api.getLocation();

  self.api.fetch(tid, self.config["max-comments-top"],
      self.config["max-comments-nested"]) .then(
    function (rv) {
      self.mergeConfigs(rv);

      self.issoRoot.prepend(self.createPostbox(null));

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
      heading.textContent = i18n.pluralize("num-comments", count);

      if (rv.hidden_replies > 0) {
        self.createCommentObj().insertLoader(rv, lastcreated);
      }

      self.scrollToHash();

    },
    function(err) {
      console.log(err);
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
  for (var setting in rv.config) {
    // TODO: Also check against default values here, see related PR
    if (setting in self.config && self.config[setting] != rv.config[setting]) {
        console.log("Isso: Client value '%s' for setting '%s' overridden by server value '%s'.\n" +
                    "Since Isso version 0.12.6, 'data-isso-%s' is only configured via the server " +
                    "to keep client and server in sync",
                    self.config[setting], setting, rv.config[setting], setting);
    }
    self.config[setting] = rv.config[setting]
  }
};

App.prototype.createPostbox = function(parent) {
  var self = this; // Preserve App object instance context
  var _postbox = new postbox.Postbox(parent, self.api, self.config,
      self.localStorage, self.template, self);
  return _postbox;
};

// Comment object scaffold, does not contain any actual data yet
App.prototype.createCommentObj = function() {
  var self = this; // Preserve App object instance context
  var _comment = new commentHelper.Comment(self.api, self.config, self.i18n,
      self.template, self);
  return _comment;
};

App.prototype.insertComment = function(comment, scrollIntoView) {
  var self = this; // Preserve App object instance context
  var _comment = self.createCommentObj();
  _comment.insert(comment, scrollIntoView);
};

module.exports = {
  App: App,
};
