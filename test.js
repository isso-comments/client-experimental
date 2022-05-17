'use strict';

var Test = function() {
  this.foo = null;
};
Test.prototype.setFoo = function(foo) {
  this.foo = foo;
}
var test = new Test();
test.setFoo('bar');
console.log(test.foo);
test.foo = 'baz';
console.log(test.foo);

var Plain = {
  foo: null,
}
Plain.setFoo = function(foo) {
  this.foo = foo;
}
var plain = Plain;
plain.setFoo('bar');
console.log(plain.foo);
