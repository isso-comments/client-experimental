'use strict';

/*
 * Module that provides listener-based functionality
 *
 * Note: Cannot be called "events" or it will clash with node bulitin ones
 * Might also be called "loop"? "looper"?
 * */


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
        //if (!(listeners.hasOwnProperty(listener) && !listeners[listener])) {
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
  var next = [];
  var current = [];
  var processTick = function() {
    for (var listener in next) {
      current.push(next[listener]);
    }
    next = [];
    for (var listener in current) {
      // Ignore dead listeners
      //if (!(current.hasOwnProperty(listener) && current[listener])) {
      if (!current[listener]) {
        continue;
      }
      // Run listener, listener is expected to re-register itself
      current[listener]();
    }
    current = [];
    // (Re-)arm timeout
    setTimeout(processTick, interval);
  };
  return {
    // note: listener needs to be self-bound with .bind(app, comment...)!
    register: function(listener) {
      // Ignore duplicate listeners
      if (next.indexOf(listener) < 0) {
        next.push(listener);
      };
    },
    start: processTick,
    clear: function() { next = []; },
  };
};

module.exports = {
  waitFor: waitFor,
  loop: loop,
};
