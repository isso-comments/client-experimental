const api = require('api');

const request = JSON.stringify({
  "author": "asdlkj",
  "email": null,
  "notification": 0,
  "parent": null,
  "text": "asdasd",
  "title": "Isso Test",
  "website": "https://s.org",
});
const responseBody = JSON.stringify({
  "id": 2,
  "parent": null,
  "created": 1652997196.133298,
  "modified": null,
  "mode": 1,
  "text": "<p>asdasd</p>",
  "author": "asdlkj",
  "website": "https://s.org",
  "likes": 0,
  "dislikes": 0,
  "notification": 0,
  "hash": "4505c1eeda98",
});

test('timeouts', () => {
  const spy = jest.spyOn(window, 'setTimeout');
  spy.mockImplementation((func, timeout) => func());

  const Q = require('lib/promise');
  let deferred = Q.defer();

  jest.spyOn(deferred.promise, "then");
  let cb = jest.fn((rv) => "foo");
  deferred.promise.then((rv) => cb(rv));
  deferred.resolve("foobar");

  expect(deferred.promise.then).toHaveBeenCalled();
  expect(window.setTimeout)
    .toHaveBeenCalledWith(expect.any(Function), 0);
  expect(cb).toHaveBeenCalledWith("foobar");
  spy.mockRestore();
})

test('create', () => {

  const origFunc = setTimeout;
  jest.spyOn(window, 'setTimeout')
  //jest.spyOn(window, 'setTimeout')
  //  .mockImplementation((func, timeout) => origFunc(func, 10));
  //const spy = jest.spyOn(window, 'setTimeout');
  //spy.mockImplementation((func, timeout) => func());

  jest.useFakeTimers();

  let API = api.API;
  API.prototype.curl = jest.fn((method, url, data, resolve, reject) => {
    resolve({status: 201, body: responseBody});
  });
  let apiObj = new API();

  jest.spyOn(apiObj, "create");

  //apiObj.create(1, null).then((comment) => callback(comment));
  let promise = apiObj.create(1, null)
  let thenFunc = jest.fn((rv) => "foo");
  promise.then(thenFunc, thenFunc);

  expect(promise.success).toEqual([thenFunc]);
  expect(promise.errors).toEqual([thenFunc]);

  jest.runAllTimers();

  // Does not work due to fake promise and setTimeout oddities
  // I think the culprit is that the promises are resolved before any success
  // functions via .then() are set
  //expect(window.setTimeout).toHaveBeenCalled();
  //  //.toHaveBeenCalledWith(expect.any(Function), 0);

  expect(API.prototype.curl).toHaveBeenCalled();

  jest.useRealTimers();
  //spy.mockRestore();
});
