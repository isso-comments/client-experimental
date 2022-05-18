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

//var en = require('i18n/en');
var en = function() {};
//var fr = function() {};

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
  var config = null;
  var lang = null;
  var plural = null;
  var translations = null;
};

I18n.prototype.setLangs = function() {
  var self = this; // Preserve Object context

  // for each entry in config.langs, see whether we have a catalogue
  // entry and a pluralforms entry for it.  if we don't, try chopping
  // off everything but the primary language subtag, before moving
  // on to the next one.
  for (var i = 0; i < self.config.langs.length; i++) {
      self.lang = self.config.langs[i];
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

var ago = function(localTime, date) {

  var secs = ((localTime.getTime() - date.getTime()) / 1000);

  if (isNaN(secs) || secs < 0 ) {
    secs = 0;
  }

  var mins = Math.floor(secs / 60), hours = Math.floor(mins / 60),
      days = Math.floor(hours / 24);

  return secs  <=  45 && translate("date-now")  ||
         secs  <=  90 && pluralize("date-minute", 1) ||
         mins  <=  45 && pluralize("date-minute", mins) ||
         mins  <=  90 && pluralize("date-hour", 1) ||
         hours <=  22 && pluralize("date-hour", hours) ||
         hours <=  36 && pluralize("date-day", 1) ||
         days  <=   5 && pluralize("date-day", days) ||
         days  <=   8 && pluralize("date-week", 1) ||
         days  <=  21 && pluralize("date-week", Math.floor(days / 7)) ||
         days  <=  45 && pluralize("date-month", 1) ||
         days  <= 345 && pluralize("date-month", Math.floor(days / 30)) ||
         days  <= 547 && pluralize("date-year", 1) ||
                         pluralize("date-year", Math.floor(days / 365.25));
};

module.exports = {
  I18n: I18n,
  ago: ago,
};
