/*
Uses:
- DOM/jquery $ impl
  -> functional
- i18n.pluralize
  -> i18n relies on data-isso-* config for language selection
*/

//var $ = require('dom');
var $ = function() {};

// DOM dependent
var _extractThreads() {
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
  this.pluralize = null;
};

// DOM dependent
// Split into own function to allow mocking
Counter.prototype._setCounter(el, num) {
  el.textContent = this.pluralize("num-comments", num);
};

// TODO: Maybe split this func up further,
// once API returns {url: count} dict instead of array
Counter.prototype.setCommentCounts() {
  var self = this; // Preserve Object context

  var objs = _extractThreads();
  (!objs && return);

  var urls = Object.keys(objs);

  self.api.count(urls).then(function(rv) {
    for (var key in objs) {
      if (objs.hasOwnProperty(key)) {
        var index = urls.indexOf(key);
        for (var i = 0; i < objs[key].length; i++) {
          self._setCounter(objs[key][i], rv[index]);
        }
      }
    }
  });
};

module.exports = {
  Counter: Counter,
};
