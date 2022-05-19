'use strict';
var $ = require('lib/dom');

// DOM dependent
var editorify = function(el) {
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
      // Note: data-text-placeholder gets converted to lowerCamelCase
      el.textContent = el.dataset["textPlaceholder"] || "";
      el.classList.add("isso-placeholder");
    }
  });

  return el;
};

module.exports = editorify;
