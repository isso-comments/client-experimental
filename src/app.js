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
var extensions = require('extensions');
var i18n = require('i18n');
var svg = require('svg');
var template = require('template');
var utils = require('utils');

// Not sure tracking state of these belongs in app.js?
//var events = require('events');
var event = require('event');
var offset = require('offset');

// Helper for rendering comment area below postbox
var commentHelper = require('comment');
// Helper for rendering Postboxes
var postboxHelper = require('postbox');

var AGO_TIMEOUT = 60*1000; // 60 seconds
var COOKIE_REFRESH_TIMEOUT = 15 * 1000; // 15 seconds

// Dependent on offset module with global state
var updateTimeOffset = function(date) {
  // is `offset` instance available when run through listener?
  // -> apparently yes, but still, test out with different TZs set on client
  //    and server, respectively
  offset.update(new Date(date));
};

var App = function() {
  var self = this; // Preserve App object instance context

  self.ext = new extensions();
  self.registerExtensions();

  self.api = new api.API(
    utils.endpoint(),
    self.ext,
    { 'updateCookie': utils.cookie.set, 'updateTimeOffset': updateTimeOffset }
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
  // Do we need `new` here? I think calling the func always returns a new obj, no?
  self.initDone = event.waitFor();

  // Set up functions that need to be run in recurring intervals
  self.fastLoop = event.loop(COOKIE_REFRESH_TIMEOUT); // 15 seconds
  self.loop = event.loop(AGO_TIMEOUT); // 60 seconds
  self.fastLoop.start();
  self.loop.start();
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

      // this is massively overcomplicated, just have
      // the server return dict ´{'url1': count, 'url2': count}` instead of array
      var threads = counter.extractThreads();

      var tid = utils.threadId();
      var pos = null;
      if (tid in threads) {
        pos = Object.keys(threads).indexOf(tid);
      } else {
        threads[tid] = {textContent: null};
        pos = Object.keys(threads).length - 1
      }

      self.counter.count(
        threads,
        function(counts) {
          if (counts[pos] === 0) {
            self.heading.textContent = self.i18n.translate("no-comments");
            return;
          }
          self.heading.textContent = self.i18n.pluralize("num-comments", counts[pos]);
        }.bind(self)
      );

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
    var tid = utils.threadId();
    feedLink.href = self.api.feed(tid);
    feedLinkWrapper.appendChild(feedLink);
    self.issoThread.append(feedLinkWrapper);
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

App.prototype.insertReplies = function(comment) {
  var self = this; // Preserve App object instance context
  var lastCreated = 0;
  var count = comment.total_replies;
  comment.replies.forEach(function(replyObject) {
    self.insertComment(replyObject, false);
    if(replyObject.created > lastCreated) {
      lastCreated = replyObject.created;
    }
    count = count + replyObject.total_replies;
  });
  if(comment.hidden_replies > 0) {
    self.insertLoader(comment, lastCreated);
  }
  return count;
};

App.prototype.fetchComments = function() {
  var self = this; // Preserve App object instance context

  // If config not yet fetched, wait for it
  if (!(self.initDone.isReady())) {
    self.initDone.register(self.fetchComments.bind(self));
    return;
  }

  self.issoRoot = $('#isso-root');
  if (!self.issoRoot) {
    // Perhaps throw something here instead?
    return console.log("abort, #isso-root is missing");
  }
  // should we also clear `.value` here? clean slate after re-init?
  self.issoRoot.textContent = '';

  var tid = utils.threadId();
  self.api.fetch(tid, self.config["max-comments-top"],
                 self.config["max-comments-nested"]).then(
    function (rv) {

      var count = self.insertReplies(rv);

      if (count === 0) {
        //self.heading.textContent = self.i18n.translate("no-comments");
        return;
      }

      // TODO this count should be handled differently
      // We already hit the /count endpoint setCommentCounts(), so re-use it
      //self.heading.textContent = self.i18n.pluralize("num-comments", count);

      self.scrollToHash();
    },
    function(err) {
      console.log("Failed to fetch comments from server");
    }
  );
};

// Insert a "X Hidden" element that loads more comments on clicking
App.prototype.insertLoader = function(comment, lastCreated) {
  var self = this; // Preserve App object instance context
  var entrypoint;
  if (comment.id === null) {
    entrypoint = $("#isso-root");
    comment.name = 'null';
  } else {
    entrypoint = $("#isso-" + comment.id + " > .isso-follow-up");
    comment.name = comment.id;
  }

  var loader = $.htmlify(self.template.render("comment-loader", {"comment": comment}));
  entrypoint.append(loader);
  $("a.isso-load-hidden", self.loader).on("click", function() {
    self.loadHidden(loader);
  });
};

// Action when clicking on "X Hidden" to load more
App.prototype.loadHidden = function(loader) {
  var self = this; // Preserve App object instance context

  loader.remove();

  var tid = utils.threadId();
  self.api.fetch(tid, self.config["reveal-on-click"],
      self.config["max-comments-nested"], comment.id, lastCreated).then(
    function(rv) {
      if (rv.total_replies === 0) {
          return;
      }
      self.insertReplies(comment);
    },
    function(err) {
      console.log(err);
    });
};

App.prototype.createPostbox = function(parent) {
  var self = this; // Preserve App object instance context
  return new postboxHelper.Postbox(parent, self.api, self, self.config,
      self.localStorage, self.template);
};

// Comment object scaffold, does not contain any actual data yet
// Also does not touch DOM yet
App.prototype.createCommentObj = function() {
  var self = this; // Preserve App object instance context
  return new commentHelper.Comment(self.api, self, self.config,
      self.i18n, self.template, self.thread);
};

// "Hydrate" and insert into DOM (either at #isso-root or below parent, if given)
App.prototype.insertComment = function(comment, scrollIntoView) {
  var self = this; // Preserve App object instance context
  var comment_ = self.createCommentObj();
  comment_.insertComment(comment, scrollIntoView);
};

module.exports = {
  App: App,
  updateTimeOffset: updateTimeOffset,
};
