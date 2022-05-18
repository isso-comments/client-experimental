'use strict';
/*
Uses:
- utils.pad
  -> functional
- templates/*
  -> rely on passed params:
    - i18n (depends on conf)
    - humanize, datetime (functional)
    - svg (functional)
    - conf (data-isso-* attrs, conf fetched from server)

One-time setup:

Functions:
- _humanize
  -> functional
- _datetime
  -> functional, depends only on utils.pad
*/

var utils = require('utils');

var postbox = require('templates/postbox');
var comment = require('templates/comment');
var commentLoader = require('templates/comment-loader');

var _humanize = function(date) {
  if (typeof date !== "object") {
    date = new Date(parseInt(date, 10) * 1000);
  }
  return date.toString();
};

var _datetime = function(date) {
  if (typeof date !== "object") {
    date = new Date(parseInt(date, 10) * 1000);
  }

  return [
    date.getUTCFullYear(),
    utils.pad(date.getUTCMonth(), 2),
    utils.pad(date.getUTCDay(), 2)
  ].join("-") + "T" + [
    utils.pad(date.getUTCHours(), 2),
    utils.pad(date.getUTCMinutes(), 2),
    utils.pad(date.getUTCSeconds(), 2)
  ].join(":") + "Z";
};


var Template = function() {
  this.templateVars = {
    humanize: _humanize,
    datetime: _datetime,
  };
  this.templates = {
    "postbox": postbox,
    "comment": comment,
    "comment-loader": commentLoader,
  };
};

// Ideally, setTemplateVar should not be used (too much state)
// -> instead, pass locals to render()
Template.prototype.setTemplateVar = function(name, value) {
  this.templateVars[name] = value;
};

// Unused, just set directly instead
Template.prototype.loadTemplate = function(name, templateObj) {
  this.templates[name] = templateObj;
};

Template.prototype.render = function(name, locals) {
  var self = this; // Preserve Object context

  var rv, t = self.templates[name];
  if (! t) {
    throw new Error("Template not found: '" + name + "'");
  }

  locals = locals || {};

  var keys = [];
  for (var key in locals) {
    if (locals.hasOwnProperty(key) && !self.templateVars.hasOwnProperty(key)) {
      keys.push(key);
      self.templateVars[key] = locals[key];
    }
  }

  rv = self.templates[name](self.templateVars);

  for (var i = 0; i < keys.length; i++) {
    delete self.templateVars[keys[i]];
  }

  return rv;
};

module.exports = {
  Template: Template,
};
