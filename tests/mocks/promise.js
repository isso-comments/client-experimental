/* Drop-in replacement for `lib/promise`.
 * Only difference is that Defer.resolve/reject execute immediately in
 * sequence, without async behavior through setTimeout
 */

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
      callback(rv);
    });
  },
  reject: function(error) {
    this.promise.errors.forEach(function(callback) {
      callback(error);
    });
  }
};
