'use strict';

/* Module that provides listener-based functionality */

// Check if something is ready, and if not, register self as listener to be
// triggered once it is ready
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

// Things that need to be run at vaguely fixed intervals, e.g. updating a
// field with "x minutes ago" every 60 seconds
// Listeners need to re-register themselves upon every tick completion so
// that dead listeners can be sorted out
var loop = function(interval) {
  //var interval = interval;
  var listeners = [];
  var processTick = function() {
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
    // (Re-)arm timeout
    setTimeout(processTick, interval);
    //setTimeout(processTick.bind(this), interval);
  }
  return {
    // note: listener needs to be self-bound with .bind(app, comment...)!
    register: function(listener) {
      // Ignore duplicate listeners
      if (listeners.indexOf(listener) < 0) {
        listeners.push(listener);
      };
    },
    start: function() {
      setTimeout(processTick, interval);
    },
  }
}

module.exports = {
  waitFor: waitFor,
  loop: loop,
};
