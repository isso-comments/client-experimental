var $ = require('lib/dom');

// DOM dependent
var editorify = function(el) {
  el = $.htmlify(el);
  el.setAttribute("contentEditable", true);
  // Save placeholder "Type comment here" text
  // Note: dataset does not allow dashes for member names...
  //el.dataset["postboxtext"] = el.textContent;

  el.on("focus", function() {
    if (el.classList.contains("isso-placeholder")) {
      el.innerHTML = "";
      el.classList.remove("isso-placeholder");
    }
  });

  el.on("blur", function() {
    if (el.textContent.length === 0) {
      el.textContent = el.dataset["textplaceholder"] || "";
      el.classList.add("isso-placeholder");
    }
  });

  return el;
};

module.exports = editorify;
