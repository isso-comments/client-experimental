'use strict';

/* For DEBUG ONLY
 * Various stuff that is only good for figuring out stuff about jest
 * internals and mocking
 */

/*
var appObj = null;
function init() {
  appObj = 1;
  return appObj;
}
console.log(init());
*/

// http://www.adequatelygood.com/JavaScript-Scoping-and-Hoisting.html

//var foo = 'a';
test.skip('this, scope and hoisting', () => {
  //this.foo = foo;
  // Scopy empty
  expect(this).toEqual({});
});

test.skip('instances and prototypes', () => {
  document.body.innerHTML = '<div id="foo">fooText</div>';

  var API = function() {
    this.endpoint = null;
  }
  API.prototype.render = function() {
    return "endpoint: " + this.endpoint
  };
  var api = new API();
  api.endpoint = "foo";

  var Consumer = function(api) {
    this.api = api;
    this.bar = "bar";
  }
  Consumer.prototype.foo = function() {
    var self = this;
    expect(self).toBe("foo");
    var ctx = new Object;
    ctx.api = new Object;
    ctx.api.endpoint = new Object;
    ctx.api.endpoint = "foo";
    ctx.bar = new Object;
    ctx.bar = "bar";
    expect(self).toEqual(ctx);
    var rendered = self.api.render();
    //return this.api.endpoint;
    return rendered;
  }
  var consumer = new Consumer(api);
  expect(consumer.foo()).toBe("endpoint: foo");
});

test.skip('fake timers and click callbacks', () => {

  expect(this).toEqual({});

  var Foo = function() {
    this.runfoo = null;
    //var _foo = function (event) {
    //  return "event: " + event;
    //};
    //this.runfoo = _foo;
  }
  var foo = Foo();

  jest.spyOn(foo.runfoo);
  jest.useFakeTimers();

  var elm = document.getElementById('foo');
  elm.addEventListener('click', function(event) {
    foo.runfoo();
    setTimeout(foo.runfoo, 500);
  });
  elm.click();

  expect(foo.runfoo).toHaveBeenCalledTimes(1);

  jest.runAllTimers();

  expect(foo.runfoo).toHaveBeenCalledTimes(2);
});
