'use strict';
var stderr = function(text) {
  console.log(text);
};

var Promise = function() {
  this.success = [];
  this.errors = [];
};

Promise.prototype.then = function(onSuccess, onError) {
  this.success.push(onSuccess);
  if (onError) {
    this.errors.push(onError);
  } else {
    this.errors.push(stderr);
  }
};

var Defer = function() {
  this.promise = new Promise();
};

Defer.prototype = {
  promise: Promise,
  resolve: function(rv) {
    this.promise.success.forEach(function(callback) {
      setTimeout(function() {
        callback(rv);
      }, 0);
    });
  },

  reject: function(error) {
    this.promise.errors.forEach(function(callback) {
      setTimeout(function() {
        callback(error);
      }, 0);
    });
  }
};

var when = function(obj, func) {
  if (obj instanceof Promise) {
    return obj.then(func);
  } else {
    return func(obj);
  }
};

var defer = function() {
  return new Defer();
};

var waitFor = function() {
  var listeners = [];
  var isReady = false;
  return {
    isReady: function(){return isReady},
    register: function(listener) {
      // Ignore duplicate listeners
      if (listeners.indexOf(listener) < 0) {
        listeners.push(listener);
      };
    },
    reset: function() { isReady = false },
    onReady: function() {
      isReady = true;
      for (var listener in listeners) {
        // Ignore dead listeners
        if (!listeners[listener]) {
          continue;
        }
        // Run listener
        listeners[listener]();
      }
      // Clear listeners
      listeners = [];
    },
  };
};

module.exports = {
  defer: defer,
  when: when,
  waitFor: waitFor,
};
