const $ = require('lib/dom');
const i18n = require('i18n');
const template = require('template');

const postbox = require('postbox');

var i18n_ = null;
var template_ = null;
var issoThread = null;
var conf = null;

beforeEach(() => {
  document.body.innerHTML =
    '<div id=isso-thread></div>' +
    '<script src="http://isso.api/js/embed.min.js" data-isso="/"></script>';
  issoThread = $('#isso-thread');
  issoThread.append('<div id="isso-root"></div>');
  conf = {
    'langs': ['en-US', 'en', 'en', 'en'],
  };
  i18n_ = new i18n.I18n();
  template_ = new template.Template();
});

test('Create Postbox', () => {
  conf.langs = ['en-US', 'en', 'en', 'en'];
  i18n_.config = conf;
  i18n_.initTranslations();
  template_.templateVars['conf'] = conf;
  template_.templateVars['i18n'] = i18n_;

  let box = new postbox.Postbox(null, null, null, conf,
    window.localStorage, template_);
  issoThread.append(box);

  expect(issoThread.innerHTML).toMatchSnapshot();
});

test('"(optional)" labels in Postox vanish if require-author/-email set', () => {
  conf = {
    'langs': ['de', 'en-US', 'en'], // Should fall back to 'en' for placeholders
    'require-author': true,
    'require-email': true,
  };
  i18n_.config = conf;
  i18n_.initTranslations();
  template_.templateVars['conf'] = conf;
  template_.templateVars['i18n'] = i18n_;

  let box = new postbox.Postbox(null, null, null, conf,
    window.localStorage, template_);
  issoThread.append(box);

  expect($('#isso-postbox-author').placeholder).toBe('John Doe');
  expect($('#isso-postbox-email').placeholder).toBe('johndoe@example.com');
  // Instead of 'Name (optional)'
  expect($("[for='isso-postbox-author']").textContent).toBe('Name');
  // Instead of 'E-Mail (optional)'
  // Note: In German, it's `E-Mail` (uppercase M)
  expect($("[for='isso-postbox-email']").textContent).toBe('E-Mail');
});

test('Create Postbox with reply notifications disabled by default', () => {
  conf['reply-notifications-default-enabled'] =  false,
  i18n_.config = conf;
  i18n_.initTranslations();
  template_.templateVars['conf'] = conf;
  template_.templateVars['i18n'] = i18n_;

  let box = new postbox.Postbox(null, null, null, conf,
    window.localStorage, template_);
  issoThread.append(box);

  expect($('.isso-notification-section input[type="checkbox"]',
           issoThread).checked()).toBeFalsy();
});

test('Create Postbox with reply notifications enabled by default', () => {
  conf['reply-notifications-default-enabled'] =  true,
  i18n_.config = conf;
  i18n_.initTranslations();
  template_.templateVars['conf'] = conf;
  template_.templateVars['i18n'] = i18n_;

  let box = new postbox.Postbox(null, null, null, conf,
    window.localStorage, template_);
  issoThread.append(box);

  expect($('.isso-notification-section input[type="checkbox"]',
           issoThread).checked).toBeTruthy();
});
