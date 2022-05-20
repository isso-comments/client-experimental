const $ = require('lib/dom');
const config = require('config');
const i18n = require('i18n');
const offset = require('offset');
const template = require('template');

const commentHelper = require('comment');

const comment = {
  "id": 2,
  "created": 1651744800.0, // = 2022-05-05T10:00:00.000Z
  "mode": 1,
  "text": "<p>A comment with</p>\n<pre><code>code blocks\nNew line: preformatted\n\nDouble newline\n</code></pre>",
  "author": "John",
  "website": "http://website.org",
  "hash": "4505c1eeda98",
  "parent": null,
}

test('Rendered comment should match snapshot', () => {

  document.body.innerHTML =
    '<div id=isso-thread></div>' +
    '<script src="http://isso.api/js/embed.min.js" data-isso="/"></script>';
  issoThread = $('#isso-thread');
  issoThread.append('<div id="isso-root"></div>');


  let conf = {
    "avatar": true,
    "avatar-bg": "#f0f0f0",
    "avatar-fg": "#9abf88 #5698c4 #e279a3 #9163b6 #be5168 #f19670 #e4bf80 #447c69",
    "css": true,
    "css-url": null,
    "default-lang": "en",
    "feed": false,
    "gravatar": false,
    "lang": "",
    "max-comments-nested": 5,
    "max-comments-top": "inf",
    "page-author-hashes": "",
    "reply-notifications": false,
    "reply-notifications-default-enabled": false,
    "reply-to-self": false,
    "require-author": false,
    "require-email": false,
    "reveal-on-click": 5,
    "vote": true,
    "vote-levels": null
  };

  conf['langs'] = ['en-US', 'en', 'en', 'en'];

  let i18n_ = new i18n.I18n();
  i18n_.config = conf;
  i18n_.initTranslations();

  let template_ = new template.Template();
  template_.templateVars['conf'] = conf;
  template_.templateVars['i18n'] = i18n_;
  template_.templateVars['svg'] = {'arrow-up': '<svg></svg>', 'arrow-down': '<svg></svg>'};

  let fakeDate = new Date('2022-05-05T11:00:00.000Z'); // comment date + 1h
  offset.update(fakeDate);

  let _comment = new commentHelper.Comment(null, null, conf,
    i18n_, template_);
  _comment.insertComment(comment, false);

  expect($('.isso-comment').outerHTML).toMatchSnapshot();
});
