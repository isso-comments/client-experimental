/*
Uses:
- config
  -> Should only depend on data-isso-* attributes
- i18n/*
  -> no deps

One-time setup:
- setLangs

Functions:
- pluralforms
  -> purely functional
- ago
  -> purely functional

Functions, rely on set language+config:
- pluralforms
- translate
- pluralize
*/

var bg = require('i18n/bg');
var cs = require('i18n/cs');
var da = require('i18n/da');
var de = require('i18n/de');
var en = require('i18n/en');
var fa = require('i18n/fa');
var fi = require('i18n/fi');
var fr = require('i18n/fr');
var hr = require('i18n/hr');
var hu = require('i18n/hu');
var ru = require('i18n/ru');
var it = require('i18n/it');
var ko = require('i18n/ko');
var eo = require('i18n/eo');
var oc = require('i18n/oc');
var pl = require('i18n/pl');
var pt_BR = require('i18n/pt_BR');
var pt_PT = require('i18n/pt_PT');
var sk = require('i18n/sk');
var sv = require('i18n/sv');
var nl = require('i18n/nl');
var el = require('i18n/el_GR');
var es = require('i18n/es');
var vi = require('i18n/vi');
var zh = require('i18n/zh_CN');
var zh_CN = require('i18n/zh_CN');
var zh_TW = require('i18n/zh_TW');

var pluralforms = function(lang) {
  // we currently only need to look at the primary language
  // subtag.
  switch (lang.split("-", 1)[0]) {
    case "bg":
    case "cs":
    case "da":
    case "de":
    case "el":
    case "en":
    case "es":
    case "eo":
    case "fa":
    case "fi":
    case "hr":
    case "hu":
    case "it":
    case "ko":
    case "pt":
    case "sv":
    case "nl":
    case "vi":
    case "zh":
      return function(msgs, n) {
        return msgs[n === 1 ? 0 : 1];
      };
    case "fr":
      return function(msgs, n) {
        return msgs[n > 1 ? 1 : 0];
      };
    case "ru":
      return function(msgs, n) {
        if (n % 10 === 1 && n % 100 !== 11) {
          return msgs[0];
        } else if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
          return msgs[1];
        } else {
          return typeof msgs[2] !== "undefined" ? msgs[2] : msgs[1];
        }
      };
    case "oc":
      return function(msgs, n) {
        return msgs[n > 1 ? 1 : 0];
      };
    case "pl":
      return function(msgs, n) {
        if (n === 1) {
          return msgs[0];
        } else if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
          return msgs[1];
        } else {
          return typeof msgs[2] !== "undefined" ? msgs[2] : msgs[1];
        }
      };
    case "sk":
      return function(msgs, n) {
        if (n === 1) {
          return msgs[0];
        } else if (n === 2 || n === 3 || n === 4) {
          return msgs[1];
        } else {
          return typeof msgs[2] !== "undefined" ? msgs[2] : msgs[1];
        }
      };
    default:
      return null;
  }
};

var catalogue = {
  bg: bg,
  cs: cs,
  da: da,
  de: de,
  el: el,
  en: en,
  eo: eo,
  es: es,
  fa: fa,
  fi: fi,
  fr: fr,
  it: it,
  ko: ko,
  hr: hr,
  hu: hu,
  oc: oc,
  pl: pl,
  pt: pt_BR,
  "pt-BR": pt_BR,
  "pt-PT": pt_PT,
  ru: ru,
  sk: sk,
  sv: sv,
  nl: nl,
  vi: vi,
  zh: zh_CN,
  "zh-CN": zh_CN,
  "zh-TW": zh_TW
};

var I18n = function() {
  this.config = null;
  this.lang = null;
  this.plural = null;
  this.translations = null;
};

I18n.prototype.setLangs = function() {
  var self = this; // Preserve Object context

  // for each entry in config.langs, see whether we have a catalogue
  // entry and a pluralforms entry for it.  if we don't, try chopping
  // off everything but the primary language subtag, before moving
  // on to the next one.
  for (var i = 0; i < self.config["langs"].length; i++) {
      self.lang = self.config["langs"][i];
      self.plural = pluralforms(self.lang);
      self.translations = catalogue[self.lang];
      if (self.plural && self.translations)
          break;
      if (/-/.test(self.lang)) {
          self.lang = self.lang.split("-", 1)[0];
          self.plural = pluralforms(self.lang);
          self.translations = catalogue[self.lang];
          if (self.plural && self.translations)
              break;
      }
  }

  // absolute backstop; if we get here there's a bug in config.js
  if (!self.plural || !self.translations) {
      self.lang = "en";
      self.plural = pluralforms(self.lang);
      self.translations = catalogue[self.lang];
  }
};

I18n.prototype.translate = function(msgid) {
  var self = this; // Preserve Object context
  // Lookup order:
  // 1. Use any `data-isso-[msg]-text-[lang]` overrides
  // 2. Try translation strings from set language
  // 3. Try falling back to English
  // 4. Return "[?msg]"
  return self.config[msgid + '-text-' + self.lang] ||
    self.translations[msgid] ||
    en[msgid] ||
    "[?" + msgid + "]";
};

I18n.prototype.pluralize = function(msgid, n) {
  var self = this; // Preserve Object context
  var msg;

  msg = self.translate(msgid);
  if (msg.indexOf("\n") > -1) {
    msg = self.plural(msg.split("\n"), (+ n));
  }

  return msg ? msg.replace("{{ n }}", (+ n)) : msg;
};

I18n.prototype.ago = function(localTime, date) {

  var secs = ((localTime.getTime() - date.getTime()) / 1000);

  if (isNaN(secs) || secs < 0 ) {
    secs = 0;
  }

  var mins = Math.floor(secs / 60), hours = Math.floor(mins / 60),
      days = Math.floor(hours / 24);

  return secs  <=  45 && self.translate("date-now")  ||
         secs  <=  90 && self.pluralize("date-minute", 1) ||
         mins  <=  45 && self.pluralize("date-minute", mins) ||
         mins  <=  90 && self.pluralize("date-hour", 1) ||
         hours <=  22 && self.pluralize("date-hour", hours) ||
         hours <=  36 && self.pluralize("date-day", 1) ||
         days  <=   5 && self.pluralize("date-day", days) ||
         days  <=   8 && self.pluralize("date-week", 1) ||
         days  <=  21 && self.pluralize("date-week", Math.floor(days / 7)) ||
         days  <=  45 && self.pluralize("date-month", 1) ||
         days  <= 345 && self.pluralize("date-month", Math.floor(days / 30)) ||
         days  <= 547 && self.pluralize("date-year", 1) ||
                         self.pluralize("date-year", Math.floor(days / 365.25));
};

module.exports = {
  I18n: I18n,
};
