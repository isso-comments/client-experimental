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
var api = require('api');
var config = require('config');
//var $ = require('lib/ready');
var domready = function(){};
var i18n = require('i18n');
//var svg = require('svg');
var template = require('template');

var commentHelper = require('comment');
var postbox = require('postbox');

var App = function() {
  this.api = null;
  this.config = null;
  this.i18n = null;
  this.localStorage = null;
  this.template = null;
};

App.prototype.constructor = function() {
  var self = this; // Preserve App object instance context

  self.api = new api.API();
  self.api.location = api.getLocation();
  self.api.endpoint = api.getEndpoint();

  self.config = new config.Config;
  self.config.init();

  self.i18n = new i18n.I18n();
  self.i18n.setLangs();

  self.localStorage = utils.localStorageImpl();
  self.template = new template.Template();

  self.template.set("conf", self.config);
  self.template.set("i18n", self.i18n.translate);
  self.template.set("pluralize", self.i18n.pluralize);
  self.template.set("svg", svg);
};

App.prototype.createPostbox = function(parent) {
  var self = this; // Preserve App object instance context
  var _postbox = new postbox.Postbox(parent, self.api, self.config,
      self.localStorage, self.template, self);
  return _postbox;
};

App.prototype.createComment = function() {
  var self = this; // Preserve App object instance context
  var _comment = new commentHelper.Comment(self.api, self.config, self.i18n,
      self.template, self);
  return _comment;
};

App.prototype.insertComment = function(comment, scrollIntoView) {
  var self = this; // Preserve App object instance context
  var _comment = self.createComment();
  _comment.insert(comment, scrollIntoView);
};

module.exports = {
  App: App,
};
