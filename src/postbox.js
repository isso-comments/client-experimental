'use strict';
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


var Postbox = function(parent, api, app, config, localStorage, template) {

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
  self.offerNotifications();
  $("[name='email']", self.element).on("input", self.offerNotifications);
  $("[name='preview']", self.element).on("click", self.preview.bind(self));
  $("[name='edit']", self.element).on("click", self.edit.bind(self));
  $(".isso-preview", self.element).on("click", self.edit.bind(self));
  $("[type=submit]", self.element).on("click", self.submit.bind(self));

  var email = $("[name='email']", self.element)
  email.on("focus", function() {email.classList.remove('isso-validation-error')});
  var author = $("[name='author']", self.element);
  author.on("focus", function() {author.classList.remove('isso-validation-error')});
  var textarea = $(".isso-textarea", self.element);
  textarea.on("focus", function() {textarea.classList.remove('isso-validation-error')});

  //editorify($(".isso-textarea", self.element));
  editorify(textarea);

  return self.element;
};

Postbox.prototype.validate = function() {
  var self = this; // Preserve Object context
  var reasons = [];

  if (utils.text($(".isso-textarea", self.element).innerHTML).length < 3 ||
    $(".isso-textarea", self.element).classList.contains("isso-placeholder"))
  {
    //$(".isso-textarea", self.element).focus();
    reasons.push(ValidationError.TEXT_TOO_SHORT);
  }
  if (self.config["require-email"]
      && $("[name='email']", self.element).value.length <= 0)
  {
    //$("[name='email']", self.element).focus();
    reasons.push(ValidationError.EMAIL_MISSING);
  }
  if (self.config["require-author"]
      && $("[name='author']", self.element).value.length <= 0)
  {
    //$("[name='author']", self.element).focus();
    reasons.push(ValidationError.AUTHOR_MISSING);
  }
  return reasons;
};

Postbox.prototype.offerNotifications = function() {
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
  self.api.preview(utils.text($(".isso-textarea", self.element).innerHTML)).then(
    function(html) {
      $(".isso-preview .isso-text", self.element).innerHTML = html;
      self.element.classList.add('isso-preview-mode');
    });
};

Postbox.prototype.edit = function() {
  var self = this; // Preserve Object context
  $(".isso-preview .isso-text", self.element).innerHTML = '';
  self.element.classList.remove('isso-preview-mode');
};

Postbox.prototype.showErrors = function(errors) {
  var self = this; // Preserve Object context
  console.log("showErrors: ", errors);
  for (var err in errors) {
    switch (errors[err]) {
      case ValidationError.EMAIL_MISSING:
        console.log("EMAIL_MISSING:", errors[err]);
        $("[name='email']", self.element).classList.add('isso-validation-error');
      case ValidationError.AUTHOR_MISSING:
        console.log("AUTHOR_MISSING:", errors[err]);
        $("[name='author']", self.element).classList.add('isso-validation-error');
      case ValidationError.TEXT_TOO_SHORT:
        console.log("TEXT_TOO_SHORT:", errors[err]);
        $(".isso-textarea", self.element).classList.add('isso-validation-error');
        console.log($(".isso-textarea", self.element));
      default:
        return null;
    }
  }
};

Postbox.prototype.submit = function() {
  var self = this; // Preserve Object context
  self.edit(self);
  self.showErrors(self.element.validate.call(self));
  if (self.element.validate.call(self).length) {
    // TODO: handle and display ValidationError
    return;
  }

  var author = $("[name=author]", self.element).value || null;
  var email = $("[name=email]", self.element).value || null;
  var website = $("[name=website]", self.element).value || null;

  self.localStorage.setItem("isso-author", JSON.stringify(author));
  self.localStorage.setItem("isso-email", JSON.stringify(email));
  self.localStorage.setItem("isso-website", JSON.stringify(website));

  var tid = utils.threadId();
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

    if (self.parent !== null) {
      // Remove postbox again if it's not the top-level one
      self.element.onsuccess();
    }
  });
};

module.exports = {
  Postbox: Postbox,
  ValidationError: ValidationError,
};
