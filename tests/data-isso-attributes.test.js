const $ = require('lib/dom');
const app = require('app');
const offset = require('offset');

const fakeThread = require('fixtures/comment-thread');

var issoApp = null;
var scriptTag = null;

beforeEach(() => {
  jest.clearAllMocks();
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
  const fakeDate = new Date('2022-05-05T11:00:00.000Z'); // comment date + 1h
  offset.update(fakeDate);

  // Return immediately instead of invoking any promise setTimeout funcs
  const fakeConfigThen = jest.fn(
    (onSuccess, onError) => {onSuccess.call(issoApp, {config: {}})}
  );
  jest.spyOn(issoApp.api, 'config')
    .mockImplementationOnce(() => ({then: fakeConfigThen}));
  // Mock empty counter API implementation
  const fakeCountThen = jest.fn(
    (onSuccess, onError) => {onSuccess.call(issoApp, [4])}
  );
  jest.spyOn(issoApp.api, 'count')
    .mockImplementationOnce(() => ({then: fakeCountThen}));
  const fakeFetchThen = jest.fn(
    (onSuccess, onError) => {onSuccess.call(issoApp, fakeThread)}
  );
  jest.spyOn(issoApp.api, 'fetch')
    .mockImplementationOnce(() => ({then: fakeFetchThen}));
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
  scriptTag.setAttribute('require-email', 'true');
  run();
  // Instead of 'E-mail (optional)'
  expect($("[for='isso-postbox-email']").textContent).toBe('E-mail');
});
test('Author required', () => {
  // (Would normally be set by server but we want to mock behavior here anyway)
  scriptTag.setAttribute('require-author', 'true');
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
test('Reply notifications pre-checked by default - opt-out', () => {
  scriptTag.setAttribute('data-isso-reply-notifications', 'true');
  scriptTag.setAttribute('data-isso-reply-notifications-default-enabled', 'false');
  run();
  // Fake text input
  let email = document.querySelector("[name='email']");
  email.value = 'foo@example.com';
  email.dispatchEvent(new Event('input', {bubbles:true}));
  expect(document.querySelector('.isso-notification-section').style.display).toBe('block');
  expect($('.isso-notification-section input[type="checkbox"]').checked()).toBe(false);
});
test.skip('Max. toplevel comments = 2', () => {
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
test.skip('Max. nested comments = 1', () => {
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
test.skip('Comments to load upon clicking "more" link = 1', () => {
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
test.skip('Gravatar enabled', () => {
  // (Would normally be set by server but we want to mock behavior here anyway)
  // Also need to fetch mocked gravatar URL
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
test.skip('Avatars disabled', () => {
  // Overridden by gravatar setting
  // Need to make sure that there aren't two avatars side-by-side
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
test.skip('Avatar background', () => {
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
test.skip('Avatar foreground', () => {
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
test.skip('Voting disabled', () => {
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
test.skip('Vote levels = 2', () => {
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
test.skip('Atom feed enabled', () => {
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
test.skip('Highlighted page author comments', () => {
  scriptTag.setAttribute('data-isso-css', 'false');
  run();
  expect(document.getElementsByTagName('link')).toEqual([]);
});
