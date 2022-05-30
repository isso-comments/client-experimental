'use strict';
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

var $ = require('lib/dom');
var editorify = require('lib/editorify');
var offset = require('offset');
var identicons = require('lib/identicons');
var utils = require('utils');

var Comment = function(api, app, config, i18n, template, thread) {
  this.api = api;
  this.app = app;
  this.config = config;
  this.i18n = i18n;
  this.template = template;

  this.thread = thread;

  // Own DOM elements
  this.element = null;
  this.header = null;
  this.footer = null;
  this.text = null;
};

// Returns cloned obj which already has handles for api, app, config etc.
Comment.prototype.create = function() {
  return new Comment(this.api, this.app, this.config, this.i18n, this.template, this.thread);
}

// "Hydrate" and insert into DOM (either at #isso-root or below parent, if given)
Comment.prototype.insertComment = function(comment, scrollIntoView) {
  var self = this; // Preserve Comment object instance context

  self.element = $.htmlify(self.template.render("comment", {"comment": comment}));

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

  self.footer = $("#isso-" + comment.id + " > .isso-text-wrapper > .isso-comment-footer", self.element);
  self.header = $("#isso-" + comment.id + " > .isso-text-wrapper > .isso-comment-header", self.element);
  self.text   = $("#isso-" + comment.id + " > .isso-text-wrapper > .isso-text", self.element);

  var replyToggler = self.toggleReply(comment);
  $("a.isso-reply", self.footer).on("click", replyToggler);

  $("a.isso-edit", self.footer).toggle("click",
    function(toggler) {
      self.toggleEdit(toggler, comment);
    },
    function(toggler) {
      self.toggleEdit(toggler, comment);
    }
  );

  $("a.isso-delete", self.footer).toggle("click",
    function(toggler) {
      self.toggleDelete(toggler, comment);
    },
    function(toggler) {
      self.toggleDelete(toggler, comment);
    }
  );

  if(comment.hasOwnProperty('replies') && comment.replies.length !== 0) {
    self.app.insertReplies(comment);
  }

  if (self.config["vote"]) {
    $("a.isso-upvote", self.footer).on("click", self.like);
    $("a.isso-downvote", self.footer).on("click", self.dislike);

    self.updateVotes(comment.likes - comment.dislikes);
  }

  // Update calculated offset to comment creation every 60 seconds
  self.updateOffsetLoop(comment.id, comment.created);

  // Remove edit and delete buttons when cookie is expired
  self.editingAvailableLoop(comment, "a.isso-edit");
  self.editingAvailableLoop(comment, "a.isso-delete");
  // Allow replying to self if a) reply-to-self enabled or b) cookie expired
  if (! self.config["reply-to-self"] && utils.cookie.get("isso-" + comment.id)) {
    var reply = $("a.isso-reply", self.footer).detach();
    self.replyToSelfAvailable(reply, comment);
  }
};

// Update calculated offset to comment creation every 60 seconds
Comment.prototype.updateOffset = function(element, id, created) {
  var self = this; // Preserve Comment object instance context
  var time = $("#isso-" + id + " > .isso-text-wrapper .isso-permalink > time", element)
  if (!time) {
    // Element has vanished, no need to keep updating it
    return false;
  }
  time.textContent = self.i18n.ago(offset.localTime(),
      new Date(parseInt(created, 10) * 1000));
  return true;
};
Comment.prototype.updateOffsetLoop = function(id, created) {
  var self = this; // Preserve Comment object instance context
  if (self.updateOffset(self.element, id, created)) {
    self.app.loop.register(function() {
      self.updateOffsetLoop(id, created);
    });
  }
};

// On clicking reply/close, insert/remove ("toggle") Postbox below comment
Comment.prototype.toggleReply = function(comment) {
  var self = this; // Preserve Comment object instance context

  var state = false;
  var form = null;

  return function toggle() {
    if (!state) {
      var parent = comment.parent === null ? comment.id : comment.parent;
      form = self.footer.insertAfter(self.app.createPostbox(parent))
      form.onsuccess = function() { toggle(); };
      $(".isso-textarea", form).focus();
      // TODO Move those i18n calls into pre-rendered datasets in template
      $("a.isso-reply", self.footer).textContent = self.i18n.translate("comment-close");
    } else {
      form.remove();
      $("a.isso-reply", self.footer).textContent = self.i18n.translate("comment-reply");
    }
    state = !state;
  };
};

Comment.prototype.toggleEdit = function(toggler, comment) {
  var self = this; // Preserve Comment object instance context

  var edit = $("a.isso-edit", self.footer);
  var avatar = self.config["avatar"]
      || self.config["gravatar"] ? $(".isso-avatar", self.element, false)[0] : null;

  if (toggler.state) {
    edit.textContent = self.i18n.translate("comment-save");
    edit.insertAfter($.new("a.isso-cancel", self.i18n.translate("comment-cancel")))
      .on("click", function() {
        toggler.canceled = true;
        toggler.next();
      });

    toggler.canceled = false;
    self.api.view(comment.id, 1).then(function(rv) {
      var textarea = $.new("textarea.isso-textarea");
      textarea.setAttribute("rows", 5);
      textarea.setAttribute("minlength", 3);
      textarea.setAttribute("maxlength", 65535);

      textarea.value = rv.text;
      textarea.focus();

      self.text.classList.remove("isso-text");
      self.text.classList.add("isso-textarea-wrapper");

      self.text.textContent = "";
      self.text.append(textarea);
    });

    if (avatar !== null) {
      avatar.hide();
    }
  } else {
    var textarea = $(".isso-textarea", self.text);
    if (! toggler.canceled && textarea !== null) {
      if (textarea.value.length < 3) {
        // TODO remove focus instead of validation layer?
        textarea.focus();
        toggler.wait();
        return;
      } else {
          self.api.modify(comment.id, {"text": textarea.value})
            .then(function(rv) {
              self.text.innerHTML = rv.text;
              comment.text = rv.text;
            });
      }
    } else {
      self.text.innerHTML = comment.text;
    }

    self.text.classList.remove("isso-textarea-wrapper");
    self.text.classList.add("isso-text");

    if (avatar !== null) {
      avatar.show();
    }

    $("a.isso-cancel", self.footer).remove();
    edit.textContent = self.i18n.translate("comment-edit");
  }
};

Comment.prototype.toggleDelete = function(toggler, comment) {
  var self = this; // Preserve Comment object instance context

  var del = $("a.isso-delete", self.footer);
  if (toggler.state) {
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
        $("span.isso-note", self.header).textContent = self.i18n.translate("comment-deleted");
        self.text.innerHTML = "<p>&nbsp;</p>";
        $("a.isso-edit", self.footer).remove();
        $("a.isso-delete", self.footer).remove();
      }
      del.textContent = self.i18n.translate("comment-delete");
    });
  }
};

// Remove edit and delete buttons when cookie is expired
Comment.prototype.editingAvailable = function (comment, button) {
  var self = this; // Preserve Comment object instance context
  if (! utils.cookie.get("isso-" + comment.id)) {
    if ($(button, self.footer) !== null) {
      $(button, self.footer).remove();
      return true;
    }
  }
  return false;
};
// Remove edit and delete buttons when cookie is expired
Comment.prototype.editingAvailableLoop = function(comment, button) {
  var self = this; // Preserve Comment object instance context
  if (!self.editingAvailable(comment, button)) {
    self.app.fastLoop.register(function() {
      self.editingAvailableLoop(comment, button);
    });
  }
};

// Show direct reply to own comment when cookie is max aged
Comment.prototype.replyToSelfAvailable = function(reply, comment) {
  var self = this; // Preserve Comment object instance context
  if (utils.cookie.get("isso-" + comment.id)) {
    self.app.fastLoop.register(function() {
      self.replyToSelfAvailable(reply, comment);
    });
  } else {
    self.footer.append(reply);
  }
};

Comment.prototype.updateVotes = function(value) {
  var self = this; // Preserve Comment object instance context
  var voteLevels = self.config["vote-levels"]; // Shorthand

  var span = $("span.isso-votes", self.footer);
  if (span === null) {
    self.footer.prepend($.new("span.isso-votes", value));
  } else {
    span.textContent = value;
  }
  if (value) {
    self.element.classList.remove('isso-no-votes');
  } else {
    self.element.classList.add('isso-no-votes');
  }
  if (voteLevels) {
    var before = true;
    for (var index = 0; index <= voteLevels.length; index++) {
      if (before && (index >= voteLevels.length || value < voteLevels[index])) {
        self.element.classList.add('isso-vote-level-' + index);
        before = false;
      } else {
        self.element.classList.remove('isso-vote-level-' + index);
      }
    }
  }
};

Comment.prototype.upvote = function() {
  var self = this; // Preserve Comment object instance context
  self.api.like(comment.id).then(function (rv) {
    self.updateVotes(rv.likes - rv.dislikes);
  });
};
Comment.prototype.downvote = function() {
  var self = this; // Preserve Comment object instance context
  self.api.dislike(comment.id).then(function (rv) {
    self.updateVotes(rv.likes - rv.dislikes);
  });
};

module.exports = {
  Comment: Comment,
};
