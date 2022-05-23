'use strict';
var api = require('api');
var config = require('config');
var counter = require('counter');
var domready = require('lib/domready');
var i18n = require('i18n');

var doc = require('lib/document');

var count = function() {
  this.api = new api.API(
    doc.getLocation(),
    doc.getEndpoint(),
    null,
    { 'updateCookie': null, 'updateTimeOffset': null }
  );

  this.config = new config.Config();
  this.config.init();
  this.config = config.config;

  this.i18n = new i18n.I18n();
  this.i18n.config = this.config;
  this.i18n.initTranslations();

  var counter = new counter.Counter();
  counter.api = api;
  counter.i18n = i18n;

  counter.setCommentCounts();
};

domready(function() {
  count();
});
