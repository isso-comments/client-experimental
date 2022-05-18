/*
Uses:
- DOM/jquery $ impl
  -> functional
- utils
  -> functional

One-time setup:

Functions:

Functions (DOM-dependent):

Functions (dependent on config):
*/

var $ = require('lib/dom');
var editorify = require('lib/editorify');
var utils = require('utils');

var ValidationError = {
  TEXT_TOO_SHORT: 1,
  EMAIL_MISSING: 2,
  AUTHOR_MISSING: 3,
};


var Postbox = function() {
  this.api = null;
  this.app = null; // this backref feels yuck
  this.config = null;
  this.element = null;
  this.localStorage = null;
  this.parent = null;
  this.template = null; // does this need to be stateful?
}

Postbox.prototype.constructor = function(parent, api, app, config,
    localStorage, template) {

  var self = this; // Preserve Object context

  self.parent = parent;
  self.api = api;
  self.app = app;
  self.config = config;
  self.localStorage = localStorage;
  self.template = template;

  self.element = $.htmlify(self.template.render("postbox", {
    "author":  JSON.parse(self.localStorage.getItem("isso-author")),
    "email":   JSON.parse(self.localStorage.getItem("isso-email")),
    "website": JSON.parse(self.localStorage.getItem("isso-website")),
    "preview": '',
  }));

  self.element.onsuccess = function() {};
  self.element.validate = self.validate;
  self.checkEmailRequired();
  self.checkAuthorRequired();
  $("[name='email']", self.element).on("input", self.emailEdit);
  $("[name='preview']", self.element).on("click", self.preview);
  $("[name='edit']", self.element).on("click", self.edit);
  $(".isso-preview", self.element).on("click", self.edit);
  $("[type=submit]", self.element).on("click", self.submit);

  editorify($(".isso-textarea", self.element));

  return self.element;
};

Postbox.prototype.validate = function() {
  var self = this; // Preserve Object context
  var reasons = [];

  if (utils.text($(".isso-textarea", self.element).innerHTML).length < 3 ||
    $(".isso-textarea", self.element).classList.contains("isso-placeholder"))
  {
    $(".isso-textarea", self.element).focus();
    reasons.push(ValidationError.TEXT_TOO_SHORT);
  }
  if (self.config["require-email"]
      && $("[name='email']", self.element).value.length <= 0)
  {
    $("[name='email']", self.element).focus();
    reasons.push(ValidationError.EMAIL_MISSING);
  }
  if (self.config["require-author"]
      && $("[name='author']", self.element).value.length <= 0)
  {
    $("[name='author']", self.element).focus();
    reasons.push(ValidationError.AUTHOR_MISSING);
  }
  return reasons;
};

Postbox.prototype.emailEdit = function() {
  var self = this; // Preserve Object context
  if (self.config["reply-notifications"]
      && $("[name='email']", self.element).value.length > 0)
  {
    $(".isso-notification-section", self.element).show();
  } else {
    $(".isso-notification-section", self.element).hide();
  }
};

Postbox.prototype.checkEmailRequired = function() {
  var self = this; // Preserve Object context
  if (self.config["require-email"]) {
      $("[for='isso-postbox-email']", self.element).textContent =
          $("[for='isso-postbox-email']", self.element).textContent.replace(/ \(.*\)/, "");
  }
};
Postbox.prototype.checkAuthorRequired = function() {
  var self = this; // Preserve Object context
  if (self.config["require-author"]) {
    $("[for='isso-postbox-author']", self.element).textContent =
      $("[for='isso-postbox-author']", self.element).textContent.replace(/ \(.*\)/, "");
  }
};

Postbox.prototype.preview = function() {
  var self = this; // Preserve Object context
  $("[name='preview']", self.element).on("click", function() {
    self.api.preview(utils.text($(".isso-textarea", self.element).innerHTML)).then(
      function(html) {
          $(".isso-preview .isso-text", self.element).innerHTML = html;
          self.element.classList.add('isso-preview-mode');
      });
  });
};

Postbox.prototype.edit = function() {
  var self = this; // Preserve Object context
  $(".isso-preview .isso-text", self.element).innerHTML = '';
  self.element.classList.remove('isso-preview-mode');
};

Postbox.prototype.submit = function() {
  var self = this; // Preserve Object context

  self.edit();
  if (self.element.validate().length) {
    // TODO: handle and display ValidationError
    return;
  }

  var author = $("[name=author]", self.element).value || null;
  var email = $("[name=email]", self.element).value || null;
  var website = $("[name=website]", self.element).value || null;

  self.localStorage.setItem("isso-author", JSON.stringify(author));
  self.localStorage.setItem("isso-email", JSON.stringify(email));
  self.localStorage.setItem("isso-website", JSON.stringify(website));

  var tid = $("#isso-thread").getAttribute("data-isso-id") || null;
  var title = $("#isso-thread").getAttribute("data-title") || null;
  var text = utils.text($(".isso-textarea", self.element).innerHTML);

  self.api.create(tid, {
    author: author, email: email, website: website,
    text: text, parent: self.parent || null, title: title,
    notification: $("[name=notification]", self.element).checked() ? 1 : 0,
  }).then(function(comment) {
    $(".isso-textarea", self.element).innerHTML = "";
    $(".isso-textarea", self.element).blur();

    // This backref feels yuck
    self.app.insertComment(comment, true);

    if (parent !== null) {
      self.element.onsuccess();
    }
  });
};

module.exports = {
  Postbox: Postbox,
  ValidationError: ValidationError,
};
