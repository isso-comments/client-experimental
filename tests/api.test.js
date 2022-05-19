const api = require('api');

beforeAll(()=> {
});

test('performRequest', () => {

  function performRequest(callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://example.com/');
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4 || xhr.status !== 200) return;
      callback(xhr.response);
    };
    xhr.responseType = 'json';
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.send(null);
  };

  jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
  const callback = jest.fn();
  performRequest(callback);

  expect(xhrMock.open).toBeCalledWith('GET', 'https://example.com/');
  expect(xhrMock.setRequestHeader).toBeCalledWith('Accept', 'application/json');
  (xhrMock.onreadystatechange)(new Event(''));
  expect(callback.mock.calls).toEqual([['Hello World!']]);
});

/*
Request.
{
  "author": "asdlkj",
  "email": null,
  "notification": 0,
  "parent": null,
  "text": "asdasd",
  "title": "Isso Test",
  "website": "https://s.org"
}
Response:
{
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
  "hash": "4505c1eeda98"
}
 */

test.only('create', () => {
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
  let API = api.API;
  API.prototype.curl = jest.fn((method, url, data, resolve, reject) => {
    resolve({status: 201, body: responseBody});
  });
  let apiObj = new API();
  //apiObj.create(1, null).then((comment) => expect(comment).toBe(null));
  let callback = jest.fn((comment) => comment === "foo");
  jest.useFakeTimers();
  apiObj.create(1, null).then((comment) => callback(comment));
  jest.runAllTimers();
  jest.useRealTimers();
  //expect(callback).toHaveBeenCalled();
  expect(API.prototype.curl).toHaveBeenCalled();
  /*
  jest.mock('api', () => {
    const originalModule = jest.requireActual('api');
    return {
      ...originalModule,
      curl: jest.fn(() => xhrMock),
    };
  }
  */
});

/*
  global.languages = jest.spyOn(navigator, "languages", "get")
  global.languages.mockReturnValue([]);
  global.language = jest.spyOn(navigator, "language", "get")
  global.language.mockReturnValue(null);
*/
