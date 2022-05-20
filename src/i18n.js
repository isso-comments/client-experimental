'use strict';
/*
Uses:
- config
  -> Should only depend on data-isso-* attributes
- i18n/*
  -> no deps

One-time setup:
- initTranslations

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

var catalogue = {
  bg: require('i18n/bg'),
  cs: require('i18n/cs'),
  da: require('i18n/da'),
  de: require('i18n/de'),
  en: require('i18n/en'),
  eo: require('i18n/eo'),
  fa: require('i18n/fa'),
  fi: require('i18n/fi'),
  fr: require('i18n/fr'),
  hr: require('i18n/hr'),
  hu: require('i18n/hu'),
  it: require('i18n/it'),
  ko: require('i18n/ko'),
  oc: require('i18n/oc'),
  pl: require('i18n/pl'),
  'pt-BR': require('i18n/pt-BR'),
  'pt-PT': require('i18n/pt-PT'),
  ru: require('i18n/ru'),
  sk: require('i18n/sk'),
  sv: require('i18n/sv'),
  nl: require('i18n/nl'),
  el: require('i18n/el-GR'),
  es: require('i18n/es'),
  vi: require('i18n/vi'),
  'zh-CN': require('i18n/zh-CN'),
  'zh-TW': require('i18n/zh-TW'),
};
// Aliases, to avoid `require`-ing langs twice and increasing bundle size:
catalogue.pt = catalogue['pt-BR'];
catalogue.zh = catalogue['zh-CN'];

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
    case "uk":
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
    //case "uk":
    //  // https://translate.wordpress.com/projects/wpcom/uk/default
    //  // Plural-Forms: nplurals=3; plural=
    //  // n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2
    //  return function(msgs, n) {
    //    if (n % 10 == 1 && n % 100 != 11) {
    //      return msgs[0];
    //    } else if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
    //      return msgs[1];
    //    } else {
    //      return msgs[2];
    //    }
    //  };
    default:
      return null;
  }
};

var I18n = function() {
  this.config = null;
  this.lang = null;
  this.plural = null;
  this.translations = null;
};

I18n.prototype.initTranslations = function() {
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
    catalogue['en'][msgid] ||
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
  var self = this; // Preserve Object context

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
