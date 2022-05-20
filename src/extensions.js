'use strict';

var Extensions = function() {
  this.hooks = {};
  this.ALLOWED_HOOKS = [
    'api.curl.xhr',
  ];
};

/* Example:
  function addAuthHeader(xhr) {xhr.setRequestHeader("Auth-Foo", "foo")};
  [...]
  window.Isso.Ext.hooks = {
    "api.curl.xhr": [addAuthHeader, addBearerToken],
    "postbox.pre-submit": [clearHiddenForm],
    [...]
  };
  window.Isso.registerHooks();
*/

Extensions.prototype.registerHook = function(hookedEvent, hook) {
  var self = this;
  if (!hookedEvent in self.ALLOWED_HOOKS) {
    console.log("Extension hook '", hookedEvent, "' not allowed, skipping");
    return;
  }
  if (hookedEvent in self.hooks) {
    self.hooks[hookedEvent].push(hook);
  } else {
    self.hooks[hookedEvent] = [hook];
  }
}

Extensions.prototype.registerHooks = function(hooks) {
  var self = this;
  // hooks is a dict of hook names to lists of functions
  for (var hookName in hooks) {
    for (var i = 0; i < hooks[hookName].length; i++) {
      self.registerHook(hookName, hooks[hookName][i]);
    }
  }
}

Extensions.prototype.runHooks = function(hookedEvent, val) {
  var self = this;
  for (var hook in self.hooks) {
    if (hook === hookedEvent) {
      // Run all hooks registered for hookedEvent
      for (var i = 0; i < self.hooks[hook].length; i++) {
        self.hooks[hook][i](val);
      }
    }
  }
}

var extensions = new Extensions();

module.exports = extensions;
