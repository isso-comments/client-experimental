const $ = require('lib/dom');
const i18n = require('i18n');
const template = require('template');

const postbox = require('postbox');

beforeEach(() => {
  document.body.innerHTML =
    '<div id=isso-thread></div>' +
    '<script src="http://isso.api/js/embed.min.js" data-isso="/"></script>';
});

test('Create Postbox', () => {

  let conf = {
    'langs': ['en-US', 'en', 'en', 'en'],
    'reply-notifications-default-enabled': false,
  }

  let i18n_ = new i18n.I18n();
  i18n_.config = conf;
  i18n_.initTranslations();

  let template_ = new template.Template();
  template_.templateVars['conf'] = conf;
  template_.templateVars['i18n'] = i18n_;

  var issoThread = $('#isso-thread');
  issoThread.append('<div id="isso-root"></div>');

  let box = new postbox.Postbox(null, null, null, conf,
    window.localStorage, template_);
  issoThread.append(box);

  expect(issoThread.innerHTML).toMatchSnapshot();
});

test('"(optional)" labels in Postox vanish if require-author/-email set', () => {
  let conf = {
    'langs': ['de', 'en-US', 'en'], // Should fall back to 'en' for placeholders
    'require-author': true,
    'require-email': true,
  }

  let i18n_ = new i18n.I18n();
  i18n_.config = conf;
  i18n_.initTranslations();
  //expect(i18n_).toBe("");

  let template_ = new template.Template();
  template_.templateVars['conf'] = conf;
  template_.templateVars['i18n'] = i18n_;

  var issoThread = $('#isso-thread');
  issoThread.append('<div id="isso-root"></div>');

  let box = new postbox.Postbox(null, null, null, conf,
    window.localStorage, template_);
  issoThread.append(box);

  expect($('#isso-postbox-author').placeholder).toBe('John Doe');
  expect($('#isso-postbox-email').placeholder).toBe('johndoe@example.com');
  // Instead of 'Name (optional)'
  expect($("[for='isso-postbox-author']").textContent).toBe('Name');
  // Instead of 'E-mail (optional)'
  expect($("[for='isso-postbox-email']").textContent).toBe('E-Mail');
});
