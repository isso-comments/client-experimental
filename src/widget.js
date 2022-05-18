/*
Uses:
- DOM/jquery $ impl
  -> functional
- utils
  -> functional
- identicons
  -> functional
- globals
  -> stateful
- template
  -> dependent on i18n+conf
- config
  -> data-isso-* attrs, enriched with conf fetched from server (catch-22)
- api
  -> dependent on data-isso-* attrs, stateful
- i18n
  -> dependent on language selection+conf

One-time setup:

Functions:

Functions (DOM-dependent):

Functions (dependent on config):
*/

var utils = require('utils');
//var $ = require('dom');
var $ = function(){};
var identicons = function(){};
var globals = function(){};


var Widget = function() {
  this.api = null;
  this.config = null;
  this.i18n = null;
  this.localStorage = null;
  this.template = null;
};

// TODO: Widget constructor func?

// DOM dependent
Widget.prototype.editorify = function(el) {
  var self = this; // Preserve Object context

  el = $.htmlify(el);
  el.setAttribute("contentEditable", true);

  el.on("focus", function() {
    if (el.classList.contains("isso-placeholder")) {
      el.innerHTML = "";
      el.classList.remove("isso-placeholder");
    }
  });

  el.on("blur", function() {
    if (el.textContent.length === 0) {
      // TODO drop dep on i18n and instead save original text on focus as dataset
      el.textContent = self.i18n.translate("postbox-text");
      el.classList.add("isso-placeholder");
    }
  });

  return el;
}
