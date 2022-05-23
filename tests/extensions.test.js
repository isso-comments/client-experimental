const extensions = require('extensions');

var fakeApp = null;

beforeEach(() => {
  fakeApp = {};
  fakeApp.ext = new extensions();
  fakeApp.registerExtensions = function() {
    if (!(window.Isso && window.Isso.Ext)) {
      return;
    }
    try {
      fakeApp.ext.registerHooks(window.Isso.Ext.hooks);
    } catch (ex) {
      console.log('Error registering extensions:', ex);
    }
  }
});

test('registerExtensions empty registers nothing', () => {
  window.Isso = { Ext: { hooks: [], }, };
  fakeApp.registerExtensions();
  expect(fakeApp.ext.hooks).toEqual({});
});

test('registerExtensions without window.Isso.Ext registers nothing', () => {
  window.Isso = {};
  fakeApp.registerExtensions();
  expect(fakeApp.ext.hooks).toEqual({});
});

test('registerExtensions without window.Isso.Ext.hooks registers nothing', () => {
  window.Isso = { Ext: {}, };
  fakeApp.registerExtensions();
  expect(fakeApp.ext.hooks).toEqual({});
});

test('registerExtensions with function hook succeeds', () => {
  window.Isso = { Ext: { hooks: {'api.curl.pre': [() => 'foo',]} } };
  fakeApp.registerExtensions();
  expect(fakeApp.ext.hooks).toEqual({
    'api.curl.pre': [expect.any(Function)],
  });
});

test('registerExtensions with bad data registers nothing', () => {
  // api.curl.pre should contain list, but has string
  window.Isso = { Ext: { hooks: {'api.curl.pre': 'foo'} } };
  expect(fakeApp.ext.hooks).toEqual({});
});

test('registerExtensions with disallowed name registers nothing', () => {
  // api.curl.pre should contain list, but has string
  window.Isso = { Ext: { hooks: {'disallowed.hook.name': [() => 'foo',]} } };
  expect(fakeApp.ext.hooks).toEqual({});
});

test('registerExtensions with duplicate hook name succeeds', () => {
  window.Isso = {
    Ext: {
      hooks: {
        // Duplicate dict keys, latter one takes precedence (overrides)
        'api.curl.pre': [() => 'foo', () => 'bar'],
        'api.curl.pre': [() => 'baz', () => 'oof'],
      },
    },
  };
  fakeApp.registerExtensions();
  expect(fakeApp.ext.hooks['api.curl.pre'][0]()).toBe('baz');
  expect(fakeApp.ext.hooks['api.curl.pre'][1]()).toBe('oof');
  expect(fakeApp.ext.hooks['api.curl.pre'].length).toBe(2);
});

test('runHooks with duplicated function runs twice', () => {
  // Functions listed twice will get executed twice
  let fakeFunc1 = jest.fn((xhr) => xhr.setRequestHeader('Auth-Foo', 'foo'));
  let fakeFunc2 = jest.fn((xhr) => xhr.setRequestHeader('Auth-Bar', 'bar'));
  window.Isso = { Ext: { hooks:
    // fakeFunc1 listed twice:
    {'api.curl.pre': [fakeFunc1, fakeFunc1, fakeFunc2]},
  } };
  fakeApp.registerExtensions();
  expect(fakeApp.ext.hooks).toEqual({
    'api.curl.pre': [fakeFunc1, fakeFunc1, fakeFunc2],
  });
  let fakeXHR = { setRequestHeader: (name, val) => null };
  jest.spyOn(fakeXHR, 'setRequestHeader');
  fakeApp.ext.runHooks('api.curl.pre', fakeXHR);
  expect(fakeFunc1).toHaveBeenCalledTimes(2);
  expect(fakeFunc2).toHaveBeenCalledTimes(1);
  expect(fakeXHR.setRequestHeader).toHaveBeenCalledTimes(3);
});
