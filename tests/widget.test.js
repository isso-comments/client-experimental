/* Test the full Isso widet
 * This test might be a bit too heavy to set up, but is quite powerful
 * */


const $ = require('lib/dom');
const app = require('app');
const offset = require('offset');

const fakeThread = require('fixtures/comment-thread');

const mockExtract = jest.fn(() => []);

var issoApp = null;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mock('counter', () => {
    const originalModule = jest.requireActual('counter');
    return {
      ...originalModule,
      extractThreads: mockExtract,
      //Counter: {
      //  count: jest.fn((objs, cb) => cb([4])),
      //  setCounter: originalModule.setCounter,
      //},
    }
  });
  document.body.innerHTML =
    '<div id=isso-thread></div>' +
    '<script src="http://isso.api/js/embed.min.js"'
          + 'data-isso="/"'
          + 'data-isso-id="1"></script>';

  issoApp = new app.App();
  // Mock svg icons (Jest doesn't read `require`-ed files correctly)
  issoApp.template.templateVars["svg"] = {
    'arrow-up': '<svg></svg>',
    'arrow-down': '<svg></svg>'
  };

  // Fake a server response with date header
  // Normally, this would be used to compute offset between server and client
  // (i.e. translating server time to client time, which may be in a different
  // timezone) -> dunno why server doesn't just reply with UTC? Or does it already?
  const fakeDate = new Date('2022-05-05T11:00:00.000Z'); // comment date + 1h
  offset.update(fakeDate);
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

  // Mock api.config.then(onSuccess(rv), onFailure(err))
  // Return immediately instead of invoking any promise setTimeout funcs
  const fakeConfigThen = jest.fn(
    (onSuccess, onError) => {onSuccess.call(issoApp, {config: {'require-author': false}})}
  );
  jest.spyOn(issoApp.api, 'config')
    .mockImplementationOnce(() => ({then: fakeConfigThen}));
  const resetSpy = jest.spyOn(issoApp.initDone, 'reset')
  const onReadySpy = jest.spyOn(issoApp.initDone, 'onReady')
  const mergeSpy = jest.spyOn(issoApp, 'mergeConfigs')

  // Mock counter API implementation, return count of 4 comments
  const fakeCountThen = jest.fn(
    (onSuccess, onError) => {onSuccess.call(issoApp, [4])}
  );
  jest.spyOn(issoApp.api, 'count')
    .mockImplementationOnce(() => ({then: fakeCountThen}));
  const counterSpy = jest.spyOn(issoApp.counter, 'count');
  //  .mockImplementationOnce((threads, cb) => cb([4]));

  issoApp.initWidget.call(issoApp);

  expect(counterSpy).toHaveBeenCalledTimes(1);

  // initWidget should call initDone.reset() immediately
  expect(resetSpy).toHaveBeenCalledTimes(1);

  expect(fakeConfigThen).toHaveBeenCalledTimes(1);
  // issoApp.mergeConfigs should be invoked once config has been fetched
  expect(mergeSpy)
    .toHaveBeenCalledTimes(1)
  expect(mergeSpy)
    .toHaveBeenCalledWith({config: {'require-author': false}});
  expect(issoApp.config['require-author']).toBe(false);

  expect(onReadySpy).toHaveBeenCalledTimes(1);
  expect(issoApp.initDone.isReady()).toBeTruthy();

  // Somehow doesn't mock, uses original module...
  //expect(mockExtract).toHaveBeenCalledTimes(1);
  //expect(mockExtract).toHaveReturnedWith([]);

  // Mock api.fetch.then(onSuccess(rv), onFailure(err))
  // Return immediately instead of invoking any promise setTimeout funcs
  const fakeFetchThen = jest.fn(
    (onSuccess, onError) => {onSuccess.call(issoApp, fakeThread)}
    //(onSuccess, onError) => {onSuccess.call(issoApp, {replies: [comment]})}
  );
  jest.spyOn(issoApp.api, 'fetch')
    .mockImplementationOnce(() => ({then: fakeFetchThen}));
  const fetchSpy = jest.spyOn(issoApp, 'fetchComments');

  issoApp.fetchComments.call(issoApp);

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fakeFetchThen).toHaveBeenCalledTimes(1);

  expect(issoApp.issoThread.innerHTML).toMatchSnapshot();
});
