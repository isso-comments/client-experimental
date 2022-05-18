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

var $ = function(){};
var identicons = function(){};
var globals = function(){};

var editorify = require('editorify');

var DEFAULT_COOKIE_TIMEOUT = 15 * 1000; // 15 minutes = Default edit cookie validity

var Comment = function() {
  this.api = null;
  this.config = null;
  this.element = null;
  this.i18n = null;
  this.template = null;
  this.widget = null;
};

Comment.prototype.constructor = function(api, config, i18n, template, widget) {
  this.api = api;
  this.config = config;
  this.i18n = i18n;
  this.template = template;
  this.widget = widget;
};

Comment.prototype.insertComment = function(comment, scrollIntoView) {
  var self = this; // Preserve Object context

  self.element = $.htmlify(template.render("comment", {"comment": comment}));

  if (self.config["avatar"]) {
    $(".isso-avatar > svg", self.element).replace(
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

  var form = null;
  $("a.isso-reply", footer).toggle("click",
    function(toggler) {
      self.toggleReply(toggler, comment, form, footer);
    },
    function(toggler) {
      self.toggleReply(toggler, comment, form, footer);
    }
  );

  $("a.isso-edit", footer).toggle("click",
    function(toggler) {
      self.toggleEdit(toggler, comment, text, footer);
    },
    function(toggler) {
      self.toggleEdit(toggler, comment, text, footer);
    }
  );

  $("a.isso-delete", footer).toggle("click",
    function(toggler) {
      self.toggleDelete(toggler, comment, text, header, footer);
    },
    function(toggler) {
      self.toggleDelete(toggler, comment, text, header, footer);
    }
  );

  if(comment.hasOwnProperty('replies')) {
    self.insertReplies(comment);
  }

  // Beware: Following statements all use setTimeout()!

  // Update calculated offset to comment creation every 60 seconds
  self.updateOffsetLoop();
  // Remove edit and delete buttons when cookie is expired
  self.checkIneditableLoop(comment, footer, "a.isso-edit");
  self.checkIneditableLoop(comment, footer, "a.isso-delete");
  // Allow replying to self if a) reply-to-self enabled or b) cookie expired
  if (! self.config["reply-to-self"] && utils.cookie("isso-" + comment.id)) {
    var reply = $("a.isso-reply", footer).detach();
    showDirectReplyDelayed(reply, comment, footer);
  }
};

Comment.prototype.updateOffset = function() {
  var self = this; // Preserve Object context
  $(".isso-permalink > time", self.element).textContent = i18n.ago(
      globals.offset.localTime(),
      new Date(parseInt(comment.created, 10) * 1000));
};
Comment.prototype.updateOffsetLoop = function() {
  var self = this; // Preserve Object context
  self.updateOffset();
  // TODO Create only one (global) timer, not per-comment
  setTimeout(self.updateOffsetLoop, 60*1000);
};

// On clicking reply/close, insert/remove ("toggle") Postbox below comment
Comment.prototype.toggleReply = function(toggler, comment, form, footer) {
  if (!toggler.state) {
    var parent = comment.parent === null ? comment.id : comment.parent;
    form = footer.insertAfter(self.widget.createPostbox(parent))
    form.onsuccess = function() { toggler.next(); };
    $(".isso-textarea", form).focus();
    // TODO Move those i18n calls into pre-rendered datasets in template
    $("a.isso-reply", footer).textContent = self.i18n.translate("comment-close");
  } else {
    form.remove();
    $("a.isso-reply", footer).textContent = self.i18n.translate("comment-reply");
  }
};

Comment.prototype.toggleEdit = function(toggler, comment, text, footer) {
  var edit = $("a.isso-edit", footer);
  var avatar = self.config["avatar"]
      || self.config["gravatar"] ? $(".isso-avatar", self.element, false)[0] : null;

  if (!toggler.state) {
    edit.textContent = self.i18n.translate("comment-save");
    edit.insertAfter($.new("a.isso-cancel", i18n.translate("comment-cancel")))
      .on("click", function() {
        toggler.canceled = true;
        toggler.next();
      });

    toggler.canceled = false;
    self.api.view(comment.id, 1).then(function(rv) {
      var textarea = editorify($.new("div.isso-textarea"));

      textarea.innerHTML = utils.detext(rv.text);
      textarea.focus();

      text.classList.remove("isso-text");
      text.classList.add("isso-textarea-wrapper");

      text.textContent = "";
      text.append(textarea);
    });

    if (avatar !== null) {
      avatar.hide();
    }
  } else {
    var textarea = $(".isso-textarea", text);
    if (! toggler.canceled && textarea !== null) {
      if (utils.text(textarea.innerHTML).length < 3) {
          textarea.focus();
          toggler.wait();
          return;
      } else {
          self.api.modify(comment.id, {"text": utils.text(textarea.innerHTML)})
              .then(function(rv) {
                text.innerHTML = rv.text;
                comment.text = rv.text;
              });
      }
    } else {
      text.innerHTML = comment.text;
    }

    text.classList.remove("isso-textarea-wrapper");
    text.classList.add("isso-text");

    if (avatar !== null) {
      avatar.show();
    }

    $("a.isso-cancel", footer).remove();
    edit.textContent = self.i18n.translate("comment-edit");
  }
};

Comment.prototype.toggleDelete = function(toggler, comment, text, header, footer) {
  var del = $("a.isso-delete", footer);
  if (!toggler.state) {
    var state = ! toggler.state;

    del.textContent = self.i18n.translate("comment-confirm");
    del.on("mouseout", function() {
      del.textContent = self.i18n.translate("comment-delete");
      toggler.state = state;
      del.onmouseout = null;
    });
  } else {
    self.api.remove(comment.id).then(function(rv) {
      if (rv) {
        self.element.remove();
      } else {
        $("span.isso-note", header).textContent = self.i18n.translate("comment-deleted");
        text.innerHTML = "<p>&nbsp;</p>";
        $("a.isso-edit", footer).remove();
        $("a.isso-delete", footer).remove();
      }
      del.textContent = i18n.translate("comment-delete");
    });
  }
};

// Remove edit and delete buttons when cookie is gone
Comment.prototype.checkIneditable = function (comment, footer, button) {
  if (! utils.cookie("isso-" + comment.id)) {
    if ($(button, footer) !== null) {
      $(button, footer).remove();
      return true;
    }
  }
  return false;
};
Comment.prototype.checkIneditableLoop = function(comment, footer, button) {
  var self = this; // Preserve Object context
  if (!self.ineditable(comment, footer, button)) {
    // TODO Create only one (global) timer, not per-comment
    setTimeout(
      function() { self.checkIneditableLoop(comment, footer, button); },
      DEFAULT_COOKIE_TIMEOUT
    );
  };
};

// Show direct reply to own comment when cookie is max aged
Comment.prototype.showDirectReplyDelayed = function(reply, comment, footer) {
  var self = this; // Preserve Object context
  if (utils.cookie("isso-" + comment.id)) {
    setTimeout(
      function() { self.showDirectReplyDelayed(reply, comment, footer); },
      DEFAULT_COOKIE_TIMEOUT
    );
  } else {
    footer.append(reply);
  }
};

Comment.prototype.insertReplies = function(comment) {
  var lastCreated = 0;
  comment.replies.forEach(function(replyObject) {
    self.insertComment(replyObject, false);
    if(replyObject.created > lastCreated) {
      lastCreated = replyObject.created;
    }
  });
  if(comment.hidden_replies > 0) {
    self.insertLoader(comment, lastCreated);
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

module.exports = {
  Comment: Comment,
};
