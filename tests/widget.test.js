/* Test the full Isso widet */

const $ = require('lib/dom');
const app = require('app');

beforeAll(() => {
  document.body.innerHTML =
    '<div id=isso-thread></div>' +
    '<script src="http://isso.api/js/embed.min.js"'
          + 'data-isso="/"'
          + 'data-isso-id="1"></script>';

  //jest.mock('app', () => {
  //  const originalModule = jest.requireActual('app');
  //  return {
  //    ...originalModule,
  //  };
  //});
});

test('Render whole widget', () => {

  /*
  jest.mock('app', () => {
    const originalModule = jest.requireActual('app');
    return {
      ...originalModule,
      API: {
        ...originalModule.API,
        init: {
          then: jest.fn((onSuccess, onError) => {
            onSuccess("foo");
          }),
        },
        config: {
          then: (onSuccess, onError) => {
            onSuccess({'avatar': false});
          },
        },
        fetch: {
          then: (onSuccess, onError) => {
            onSuccess('bar');
          },
        },
      },
    };
  });
  */

  let issoApp = new app.App();
  let fakefetchConfig = jest.fn(() =>
    issoApp.mergeConfigs({config: {avatar: false}}),
  );
  jest.spyOn(issoApp, 'fetchConfig')
    .mockImplementation(() => fakefetchConfig());

  issoApp.fetchConfig();
  expect(fakefetchConfig).toHaveBeenCalled();
  expect(issoApp.config.avatar).toBe(false);

  issoApp.initWidget();

  var isso_thread = $('#isso-thread');
  //isso_thread.append('<div id="isso-root"></div>');

  //expect(app.api.API.init.then).toHaveBeenCalled();
  //expect(issoApp.issoThread).toBe("");

  jest.spyOn(issoApp.api, 'fetch')
    .mockImplementation(() => {
      return {
        then: (onSuccess, onError) => {
          onSuccess({replies: [{id: 1, parent: null, text: ''}]});
        },
      };
    });

  jest.mock('globals', () => ({
    offset: {
      localTime: jest.fn(() => ({
        getTime: jest.fn(() => 0),
      })),
    },
  }));

  jest.spyOn(issoApp, 'fetchComments')
    .mockImplementation(() => {
      issoApp.issoRoot = $('#isso-root');
      issoApp.issoRoot.textContent = '';
      issoApp.insertComment({id: 1, parent: null, text: '<p>Text</p>'});
      //issoApp.api.fetch(1, 10, 10).then((rv) => {
      //  rv.replies.forEach((comment) => {
      //    issoApp.insertComment(comment, false);
      //  })
      //});
    });
  //issoApp.createCommentObj();
  //issoApp.insertComment({id: 1, parent: null, text: ''}, false);
  issoApp.fetchComments();

  expect(isso_thread.innerHTML).toMatchSnapshot();
});

