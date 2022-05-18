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

// DOM dependent
var editorify = function(el) {
  el = $.htmlify(el);
  el.setAttribute("contentEditable", true);
  // Save placeholder "Type comment here" text
  el.dataset["postbox-text"] = el.textContent;

  el.on("focus", function() {
    if (el.classList.contains("isso-placeholder")) {
      el.innerHTML = "";
      el.classList.remove("isso-placeholder");
    }
  });

  el.on("blur", function() {
    if (el.textContent.length === 0) {
      el.textContent = el.dataset["postbox-text"] || "";
      el.classList.add("isso-placeholder");
    }
  });

  return el;
}


var Widget = function() {
  this.api = null;
  this.config = null;
  this.i18n = null;
  this.localStorage = null;
  this.template = null;
};

Widget.prototype.constructor = function(api, config, i18n, localStorage, template) {
  this.api = api;
  this.config = config;
  this.i18n = i18n;
  this.localStorage = localStorage;
  this.template = template;
};

Widget.prototype.createPostbox = function(parent) {
  var self = this; // Preserve Object context
  var _postbox = new postbox.Postbox(parent, self.api, self.config,
      self.localStorage, self.template, self);
  return _postbox;
};

Widget.prototype.createComment = function() {
  var self = this; // Preserve Object context
  var _comment = new commentHelper.Comment(self.api, self.config, self.i18n,
      self.template, self);
  return _comment;
};

Widget.prototype.insertComment = function(comment, scrollIntoView) {
  var self = this; // Preserve Object context
  var _comment = self.createComment();
  _comment.insert(comment, scrollIntoView);
};

module.exports = {
  editorify: editorify,
  Widget: Widget,
};
