/* Test the full Isso widet
 * This test might be a bit too heavy to set up, but is quite powerful
 * */


const $ = require('lib/dom');
const app = require('app');
const offset = require('offset');

var issoApp = null;

beforeEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML =
    '<div id=isso-thread></div>' +
    '<script src="http://isso.api/js/embed.min.js"'
          + 'data-isso="/"'
          + 'data-isso-id="1"></script>';
  issoApp = new app.App();
});

test.skip('Fetch mocked config', () => {
  let fakefetchConfig = jest.fn(() =>
    issoApp.mergeConfigs({config: {avatar: false}}),
  );
  jest.spyOn(issoApp, 'fetchConfig')
    .mockImplementation(() => fakefetchConfig());
  issoApp.fetchConfig();
  expect(fakefetchConfig).toHaveBeenCalled();
  expect(issoApp.config.avatar).toBe(false);
});

test('Render whole widget', () => {

  let comment = {
    "id": 2,
    "created": 1651744800.0, // = 2022-05-05T10:00:00.000Z
    "mode": 1,
    "text": "<p>A comment with</p>\n<pre><code>code blocks\nNew line: preformatted\n\nDouble newline\n</code></pre>",
    "author": "John",
    "website": "http://website.org",
    "hash": "4505c1eeda98",
    "parent": null,
  }

  const fakeThen = jest.fn((onSuccess, onError) => onSuccess.call(issoApp, {replies: [comment]}));
  jest.spyOn(issoApp.api, 'fetch')
    .mockImplementation(() => {
      return {
        then: fakeThen,
      };
    });

  let fakeDate = new Date('2022-05-05T11:00:00.000Z'); // comment date + 1h
  offset.update(fakeDate);

  /*
  jest.spyOn(issoApp.configFetched, 'loaded')
    .mockImplementation(() => true);
  */

  /*
  jest.spyOn(issoApp, 'fetchConfig')
    .mockImplementation(() => {
      return {
        then: (onSuccess, onError) => {
          onSuccess.call(issoApp, {config: {avatar: false}});
        }
      }
    });
  */

  issoApp.initWidget.call(issoApp);

  expect(issoApp.config.avatar).toBeFalse;

  expect(issoApp.configFetched.isReady()).toBeTrue;

  issoApp.fetchComments.call(issoApp);

  expect(fakeThen).toHaveBeenCalledTimes(1);

  expect(issoApp.issoThread.innerHTML).toMatchSnapshot();
});

