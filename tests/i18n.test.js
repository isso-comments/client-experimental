const i18n = require('i18n');

test('Fall back to other languages for missing translations', () => {
  let conf = { langs: ['da', 'de', 'uk']};

  let i18n_ = new i18n.I18n();
  i18n_.config = conf;
  i18n_.initTranslations();

  // Danish has English translation (wrongly) copy-pasted here
  expect(i18n_.pluralize('num-comments', 2)).toBe('2 Comments');

  // Danish has no string here, falls through to English
  expect(i18n_.translate('postbox-email-placeholder'))
    .toBe('johndoe@example.com');
});


/* This is mostly a demo for Jest's each()
 * https://jestjs.io/docs/api#testeachtablename-fn-timeout
 */
test.each([
  // https://duonotes.fandom.com/wiki/Ukrainian#Numbers_2
  [0,  '0 коментарів'],
  [1,  '1 коментар'],
  [5,  '5 коментарів'],
  [10, '10 коментарів'],
  [11, '11 коментарів'],
  [20, '20 коментарів'],
  [21, '21 коментар'],
  [22, '22 коментарі'],
  [25, '25 коментарів'],
  [31, '31 коментар'],
  [32, '32 коментарі'],
  [35, '35 коментарів'],
  [100, '100 коментарів'],
  [101, '101 коментар'],
  [102, '102 коментарі'],
  [105, '105 коментарів'],
  [999, '999 коментарів'],
  [1000, '1000 коментарів'],
  [1001, '1001 коментар'],
  [1002, '1002 коментарі'],
  [1005, '1005 коментарів'],
  [1020, '1020 коментарів'],
  [1021, '1021 коментар'],
  [1022, '1022 коментарі'],
  [1025, '1025 коментарів'],
])('Ukrainian plurals', (i, expected) => {
  let conf = { langs: ['uk']};
  let i18n_ = new i18n.I18n();
  i18n_.config = conf;
  i18n_.initTranslations();
  expect(i18n_.pluralize('num-comments', i)).toBe(expected);
});
