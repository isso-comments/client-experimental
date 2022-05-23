'use strict';
/*
Uses:
- DOM/jquery $ impl
  -> functional
- i18n.pluralize
  -> i18n relies on data-isso-* config for language selection
*/

var $ = require('lib/dom');

// DOM dependent
var _extractThreads = function() {
  var objs = {};
  $.each("a", function(el) {
    if (! el.href.match || ! el.href.match(/#isso-thread$/)) {
      return;
    }

    var tid = el.getAttribute("data-isso-id") ||
              el.href.match(/^(.+)#isso-thread$/)[1]
                     .replace(/^.*\/\/[^\/]+/, '');

    if (tid in objs) {
      objs[tid].push(el);
    } else {
      objs[tid] = [el];
    }
  });
  return objs;
};


var Counter = function() {
  this.api = null;
  this.i18n = null;
};

// DOM dependent
// Split into own function to allow mocking
Counter.prototype.setCounter = function(el, num) {
  var self = this; // Preserve Counter object instance context
  el.textContent = self.i18n.pluralize("num-comments", num);
};

// TODO: Maybe split this func up further,
// once API returns {url: count} dict instead of array
Counter.prototype.setCommentCounts = function() {
  var self = this; // Preserve Object context

  var objs = _extractThreads();
  if (!objs) {
    return;
  }

  var urls = Object.keys(objs);

  self.api.count(urls).then(function(rv) {
    for (var key in objs) {
      if (objs.hasOwnProperty(key)) {
        var index = urls.indexOf(key);
        for (var i = 0; i < objs[key].length; i++) {
          self.setCounter(objs[key][i], rv[index]);
        }
      }
    }
  },
  function (err) {
    console.log("Failed to fetch comment counts");
  });
};

module.exports = {
  Counter: Counter,
};
