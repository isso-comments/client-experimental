/*
Uses:
- DOM/jquery $ impl
  -> functional

One-time setup:

Functions:

Functions (DOM-dependent):

Functions (dependent on config):
*/

//var $ = require('dom');
var $ = function(){};

var commentHelper = require('comment');
var postbox = require('postbox');


var App = function() {
  this.api = null;
  this.config = null;
  this.i18n = null;
  this.localStorage = null;
  this.template = null;
};

App.prototype.constructor = function(api, config, i18n, localStorage, template) {
  this.api = api;
  this.config = config;
  this.i18n = i18n;
  this.localStorage = localStorage;
  this.template = template;
};

App.prototype.createPostbox = function(parent) {
  var self = this; // Preserve Object context
  var _postbox = new postbox.Postbox(parent, self.api, self.config,
      self.localStorage, self.template, self);
  return _postbox;
};

App.prototype.createComment = function() {
  var self = this; // Preserve Object context
  var _comment = new commentHelper.Comment(self.api, self.config, self.i18n,
      self.template, self);
  return _comment;
};

App.prototype.insertComment = function(comment, scrollIntoView) {
  var self = this; // Preserve Object context
  var _comment = self.createComment();
  _comment.insert(comment, scrollIntoView);
};

module.exports = {
  App: App,
};
