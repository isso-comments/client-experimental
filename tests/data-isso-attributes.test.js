/*
 * Test out data-isso-* script tag attributes and their effects on the page
 * This is a fairly heavy test, but it has the benefit of having a common
 * setup for each function.
 * Does NOT vary depending on (mocked) server response
 */

const $ = require('lib/dom');
const app = require('app');
const offset = require('offset');

const fakeThread = require('fixtures/comment-thread');

var issoApp = null;
var scriptTag = null;

// Set up spies for API functions
// These return immediately instead of invoking any promise setTimeout funcs
const fakeConfigThen = jest.fn(
  // Return empty config
  (onSuccess, onError) => {onSuccess.call(issoApp, {config: {}})}
);
const fakeCountThen = jest.fn(
  // Return comment count of 4
  (onSuccess, onError) => {onSuccess.call(issoApp, [4])}
);
const fakeFetchThen = jest.fn(
  // Return the fake thread from fixtures/comment-thread.js
  (onSuccess, onError) => {onSuccess.call(issoApp, fakeThread)}
);
// Pass through issoApp object via `.bind(this)`
// Split into own functions to be observable
const mockConfig = jest.fn(() => ({then: fakeConfigThen.bind(this)}));
const mockCount = jest.fn(() => ({then: fakeCountThen.bind(this)}));
const mockFetch = jest.fn(() => ({then: fakeFetchThen.bind(this)}));

beforeEach(() => {
  jest.restoreAllMocks();
  // Clear script tag, reset body and (re)-insert relevant elements
  document.getElementsByTagName('head')[0].innerHTML = "";
  document.body.innerHTML =
    '<div id=isso-thread></div>' +
    '<script src="http://isso.api/js/embed.min.js"'
          + 'data-isso="/"'
          + 'data-isso-id="1"></script>';
  scriptTag = document.getElementsByTagName('script')[0];

  issoApp = new app.App();
  // Mock svg icons (Jest doesn't read `require`-ed files correctly)
  issoApp.template.templateVars["svg"] = {
    'arrow-up': '<svg></svg>',
    'arrow-down': '<svg></svg>'
  };
  // Set system time to a fake time so that the calculated offset to comment
  // creation date stays the same irrespective of when the test is being run
  const fakeDate = new Date('2022-05-05T11:00:00.000Z'); // comment date + 1h
  offset.update(fakeDate);

  // Reset call table for e.g. toHaveBeenCalledWith()
  mockConfig.mockClear();
  mockCount.mockClear();
  mockFetch.mockClear();

  jest.spyOn(issoApp.api, 'config')
    .mockImplementationOnce(mockConfig.bind(issoApp));
  jest.spyOn(issoApp.api, 'count')
    .mockImplementationOnce(mockCount.bind(issoApp));
  jest.spyOn(issoApp.api, 'fetch')
    .mockImplementationOnce(mockFetch.bind(issoApp));
});

const run = () => {
  // Re-initialize reading of data-isso-* attributes
  issoApp._conf.init.call(issoApp._conf);
  issoApp.i18n.initTranslations.call(issoApp.i18n);
  // Render postbox and fetch fake thread comments
  issoApp.initWidget.call(issoApp);
  issoApp.fetchComments.call(issoApp);
};

// Different data-isoo-* config settings

test('No client CSS: data-isso-css=false', () => {
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link').length).toBe(0);
});

test('Custom client CSS URL: data-isso-css-url', () => {
  scriptTag.setAttribute('data-isso-css-url', 'https://cdn.example.com/css/isso-custom.css');
  run();
  expect(document.getElementById('isso-style').href)
    .toContain("isso-custom.css");
});

test('Client language override', () => {
  scriptTag.setAttribute('data-isso-lang', 'uk');
  run();
  expect($('h4.isso-thread-heading').textContent).toBe("4 коментарі");
});

test('Default language fallback if no user agent lang detected', () => {
  scriptTag.setAttribute('data-isso-default-lang', 'uk');

  const languagesSpy = jest.spyOn(navigator, 'languages', 'get')
  languagesSpy.mockReturnValue([]);
  const languageSpy = jest.spyOn(navigator, 'language', 'get')
  languageSpy.mockReturnValue(null);

  run();

  expect(languagesSpy).toHaveBeenCalledTimes(2);
  expect(languageSpy).toHaveBeenCalledTimes(1);
  languagesSpy.mockRestore();
  languageSpy.mockRestore();

  expect($('h4.isso-thread-heading').textContent).toBe("4 коментарі");
});

test('Email required', () => {
  // (Would normally be set by server but we want to mock behavior here anyway)
  scriptTag.setAttribute('data-isso-require-email', 'true');
  run();
  // Instead of 'E-mail (optional)'
  expect($("[for='isso-postbox-email']").textContent).toBe('E-mail');
});

test('Author required', () => {
  // (Would normally be set by server but we want to mock behavior here anyway)
  scriptTag.setAttribute('data-isso-require-author', 'true');
  run();
  // Instead of 'Name (optional)'
  expect($("[for='isso-postbox-author']").textContent).toBe('Name');
});

test('Reply notifications enabled - opt-in', () => {
  // (Would normally be set by server but we want to mock behavior here anyway)
  scriptTag.setAttribute('data-isso-reply-notifications', 'true');
  run();
  //const offerSpy = jest.spyOn(postbox.Postbox, 'offerNotifications');
  // Fake text input
  let email = document.querySelector("[name='email']");
  email.value = 'foo@example.com';
  email.dispatchEvent(new Event('input', {bubbles:true}));
  //expect(offerSpy).toHaveBeenCalledTimes(1);
  expect(document.querySelector('.isso-notification-section').style.display).toBe('block');
  expect($('.isso-notification-section input[type="checkbox"]').checked()).toBe(false);
});

test('Reply notifications enabled, pre-checked by default - opt-out', () => {
  scriptTag.setAttribute('data-isso-reply-notifications', 'true');
  scriptTag.setAttribute('data-isso-reply-notifications-default-enabled', 'true');
  run();
  // Fake text input
  let email = document.querySelector("[name='email']");
  email.value = 'foo@example.com';
  email.dispatchEvent(new Event('input', {bubbles:true}));
  expect($('.isso-notification-section input[type="checkbox"]').checked()).toBe(true);
});

test('Max. toplevel comments = 1', () => {
  scriptTag.setAttribute('data-isso-max-comments-top', 1);
  run();
  expect(mockFetch).toHaveBeenCalledWith(
    "/", // tid             Thread id
    1,   // limit           Max fetched comments
    5,   // nested_limit    Max nested comments
  );
});

test('Max. nested comments = 1', () => {
  scriptTag.setAttribute('data-isso-max-comments-nested', 1);
  run();
  expect(mockFetch).toHaveBeenCalledWith(
    "/",   // tid             Thread id
    "inf", // limit           Max fetched comments
    1,     // nested_limit    Max nested comments
  );
});

test('Comments to load upon clicking "more" link = 1', () => {
  scriptTag.setAttribute('data-isso-reveal-on-click', 1);
  const loaderSpy = jest.spyOn(issoApp, 'insertLoader');
  run();
  expect(loaderSpy).toHaveBeenCalledTimes(1);
  // Fake thread has `total_replies=4` and `hidden_replies=2` for top-level
  expect($('.isso-comment-loader').textContent).toContain("2 Hidden");
});

test('Gravatar enabled', () => {
  // (Would normally be set by server but we want to mock behavior here anyway)
  // Also need to fetch mocked gravatar URL
  // Need to make sure that there aren't two avatars side-by-side
  scriptTag.setAttribute('data-isso-gravatar', 'true');
  // Server would automatically send avatar=false if gravatar=true
  scriptTag.setAttribute('data-isso-avatar', 'false');
  run();
  // Gravatar URL hash should match first top-level comment `gravatar_image`
  expect($('.isso-avatar img')[0].obj.src).toContain("4eec8ecba9d91f00de594fa5267d1c88");
  // Regular avatars should be disabled
  expect($('.isso-avatar svg')).toBe(null);
});

test('Avatars disabled', () => {
  scriptTag.setAttribute('data-isso-avatar', 'false');
  run();
  expect($('.isso-avatar')).toBe(null);
});

// Meh, this should really be tested in a specialized test for `lib/identicons.js`
test.skip('Avatar background', () => {
  scriptTag.setAttribute('data-isso-avatar-bg', 'false');
  run();
});
test.skip('Avatar foreground', () => {
  scriptTag.setAttribute('data-isso-avatar-fg', 'false');
  run();
});

test('Voting disabled', () => {
  scriptTag.setAttribute('data-isso-vote', 'false');
  run();
  expect($('.isso-upvote')).toBe(null);
});

test('Vote levels = [-5, 1, 3, 5]', () => {
  // Will result in 5 vote levels (class names start at 0)
  // x<-5, -5<=x<1, 1<=x<3, x=3, x>=4
  scriptTag.setAttribute('data-isso-vote-levels', [-5, 1, 3, 5]);
  run();
  // Comments votes:
  // - comment-1: -2 + 7 = 5
  //    - comment-3: 0 + 1 = 1
  //    - comment-4: -10 + 3 = -7
  // - comment-2: 0 + 4 = 4
  let one = $('#isso-1');
  let three = $('#isso-3');
  let four = $('#isso-4');
  let two = $('#isso-2');
  expect(one.classList).toContain('isso-vote-level-4');
  expect(three.classList).toContain('isso-vote-level-2');
  expect(four.classList).toContain('isso-vote-level-0');
  expect(two.classList).toContain('isso-vote-level-3');
  expect($('.isso-vote-level-1')).toBe(null);
});

test('Atom feed enabled', () => {
  scriptTag.setAttribute('data-isso-feed', true);
  run();
  expect($('.isso-feedlink a').textContent).toBe("Atom feed");
  expect($('.isso-feedlink a').obj.href)
    .toEqual('http://localhost/feed?uri=%2F');
});

test.skip('Highlighted page author comments', () => {
  scriptTag.setAttribute('data-isso-page-author-hashes', []);
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
