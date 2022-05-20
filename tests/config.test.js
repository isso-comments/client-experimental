test('retrieve languages from user agent', () => {
  // Mock navigator.languages = []
  jest.spyOn(navigator, 'languages', 'get')
    .mockReturnValue([]);

  // Mock navigator.language = null
  jest.spyOn(navigator, 'language', 'get')
    .mockReturnValue(null);

  const config = require('config');
  let _conf = new config.Config();
  _conf.init();
  let conf = _conf.config;

  /* Expected:
   * - no config["lang"]
   * - navigator.languages empty
   *   - fall back on navigator.language
   *     - navigator.language empty
   *        - fall back on navigator.userLanguage
   *            - navigator.userLanguage empty
   *              (jsdom doesn't set it)
   * - config["default-lang"] = "en"
   * - final manual insertion of "en"
   */
  let expected_langs = ['en', 'en'];

  expect(conf['langs']).toStrictEqual(expected_langs);
});
