'use strict';
var api = require('api');
var config = require('config');
var counter = require('counter');
var domready = require('lib/domready');
var i18n = require('i18n');
var utils = require('utils');

var count = function() {
  this.api = new api.API(
    utils.endpoint(),
    null,
    { 'updateCookie': null, 'updateTimeOffset': null }
  );

  this.config = new config.Config();
  this.config.init();
  this.config = config.config;

  this.i18n = new i18n.I18n();
  this.i18n.config = this.config;
  this.i18n.initTranslations();

  var cnt = new counter.Counter();
  cnt.api = api;
  cnt.i18n = i18n;

  cnt.count(counter.extractThreads(), null);
};

domready(function() {
  count();
});
