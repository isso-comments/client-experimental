var utils = require('utils');
var $ = function(){};
var identicons = function(){};
var globals = function(){};

var Comment = function() {
  this.api = null;
  this.config = null;
  this.element = null;
  this.i18n = null;
  this.template = null;
  this.widget = null;
}

Comment.prototype.constructor = function(api, config, i18n, template, widget) {
  this.api = api;
  this.config = config;
  this.i18n = i18n;
  this.template = template;
  this.widget = widget;
};

Comment.prototype.insert= function(comment, scrollIntoView) {
  var self = this; // Preserve Object context

  self.element = $.htmlify(template.render("comment", {"comment": comment}));

  // Update datetime every 60 seconds
  self.refreshForever();

  if (self.config["avatar"]) {
    $(".isso-avatar > svg", el).replace(
        identicons.generate(comment.hash, 4, 48, self.config));
  }

  var entrypoint;
  if (comment.parent === null) {
    entrypoint = $("#isso-root");
  } else {
    entrypoint = $("#isso-" + comment.parent + " > .isso-follow-up");
  }

  entrypoint.append(self.element);

  if (scrollIntoView) {
    self.element.scrollIntoView();
  }

  var footer = $("#isso-" + comment.id + " > .isso-text-wrapper > .isso-comment-footer");
  var header = $("#isso-" + comment.id + " > .isso-text-wrapper > .isso-comment-header");
  var text   = $("#isso-" + comment.id + " > .isso-text-wrapper > .isso-text");
};

Comment.prototype.refresh= function() {
  var self = this; // Preserve Object context
  $(".isso-permalink > time", self.element).textContent = i18n.ago(
      globals.offset.localTime(),
      new Date(parseInt(comment.created, 10) * 1000));
};
Comment.prototype.refreshForever= function() {
  var self = this; // Preserve Object context
  self.refresh();
  // TODO Create only one (global) timer, not per-comment
  setTimeout(self.refreshForever, 60*1000);
};

// On clicking reply/close, insert/remove ("toggle") Postbox below comment
Comment.prototype.toggle= function(toggler, form, footer) {
  function(toggler) {
    form = footer.insertAfter(new Postbox(comment.parent === null ? comment.id : comment.parent));
    form.onsuccess = function() { toggler.next(); };
    $(".isso-textarea", form).focus();
    $("a.isso-reply", footer).textContent = i18n.translate("comment-close");
  },
  function() {
    form.remove();
    $("a.isso-reply", footer).textContent = i18n.translate("comment-reply");
  }
};

Comment.prototype.insertLoader = function(comment, lastCreated) {
  var self = this; // Preserve Object context
  var entrypoint;
  if (comment.id === null) {
    entrypoint = $("#isso-root");
    comment.name = 'null';
  } else {
    entrypoint = $("#isso-" + comment.id + " > .isso-follow-up");
    comment.name = comment.id;
  }
  self.element = $.htmlify(template.render("comment-loader", {"comment": comment}));

  entrypoint.append(self.element);

  $("a.isso-load-hidden", self.element).on("click", self.loadHidden);
};

Comment.prototype.loadHidden = function() {
  var self = this; // Preserve Object context

  self.element.remove();

  var tid = $("#isso-thread").getAttribute("data-isso-id") || null;
  self.api.fetch(tid, self.config["reveal-on-click"],
      self.config["max-comments-nested"], comment.id, lastCreated).then(
    function(rv) {
      if (rv.total_replies === 0) {
          return;
      }

      var lastCreated = 0;
      rv.replies.forEach(function(commentObject) {
        self.insertComment(commentObject, false);
        if(commentObject.created > lastCreated) {
          lastCreated = commentObject.created;
        }
      });

      if(rv.hidden_replies > 0) {
        self.insertLoader(rv, lastCreated);
      }
    },
    function(err) {
      console.log(err);
    });
};
