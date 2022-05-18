'use strict';
var api = require('api');
var config = require('config');
var counter = require('counter');
var domready = require('lib/ready');
var i18n = require('i18n');

var count = function() {
  this.api = new api.API();
  this.api.location = api.getLocation();
  this.api.endpoint = api.getEndpoint();

  this.config = new config.Config();
  this.config.init();
  this.config = config.config;

  this.i18n = new i18n.I18n();
  this.i18n.config = this.config;
  this.i18n.setLangs();

  var counter = new counter.Counter();
  counter.api = api;
  counter.i18n = i18n;

  counter.setCommentCounts();
};

domready(function() {
  count();
});
