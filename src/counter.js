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
var extractThreads = function() {
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
Counter.prototype.count = function(objs, cb) {
  var self = this; // Preserve Object context

  if (!objs) {
    return;
  }
  var urls = Object.keys(objs);

  self.api.count(urls).then(function(rv) {
    if (cb) {
      cb(rv);
    }
    //console.log("objs:", objs);
    for (var key in objs) {
      //console.log("key with objs:", objs, key);
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
  extractThreads: extractThreads,
};
