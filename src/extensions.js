'use strict';

var Extensions = function() {
  this.hooks = {};
  this.ALLOWED_HOOKS = [
    'curl.xhr',
  ];
};

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
  for (var hook in hooks) {
    self.registerHook(hook, hooks[hook]);
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
