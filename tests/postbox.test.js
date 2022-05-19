const $ = require('lib/dom');
const i18n = require('i18n');
const template = require('template');

test('Create Postbox', () => {
  // Set up our document body
  document.body.innerHTML =
    '<div id=isso-thread></div>' +
    // Note: `src` and `data-isso` need to be set,
    // else `api` fails to initialize!
    '<script src="http://isso.api/js/embed.min.js" data-isso="/"></script>';

  const postbox = require('postbox');

  const conf = {
    "langs": ["en-US", "en", "en", "en"],
    "reply-notifications-default-enabled": false,
  }

  let i18n_ = new i18n.I18n();
  i18n_.config = conf;
  i18n_.setLangs();

  let template_ = new template.Template();
  template_.templateVars["conf"] = conf;
  template_.templateVars["i18n"] = i18n_;

  var isso_thread = $('#isso-thread');
  isso_thread.append('<div id="isso-root"></div>');

  let box = new postbox.Postbox(null, null, null, conf,
    window.localStorage, template_);
  isso_thread.append(box);

  expect(isso_thread.innerHTML).toMatchSnapshot();
});

