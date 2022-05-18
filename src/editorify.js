//var $ = require('dom');
var $ = function(){};

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
};
