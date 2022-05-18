/*
Uses:
- utils.normalize_bcp47
  -> Purely functional

One-time setup:
- _readFromScriptTag
- _detectLanguages
- init

TODO: Fetch config from server

Functions:
(none)

Functions (relying on data-isso-*):
(none)

Functions (relying on conf fetched from server):
(none)
*/

var defaultConfig = {
  "css": true,
  "css-url": null,
  "lang": "",
  "default-lang": "en",
  "reply-to-self": false,
  "require-email": false,
  "require-author": false,
  "reply-notifications": false,
  "reply-notifications-default-enabled": false,
  "max-comments-top": "inf",
  "max-comments-nested": 5,
  "reveal-on-click": 5,
  "gravatar": false,
  "avatar": true,
  "avatar-bg": "#f0f0f0",
  "avatar-fg": ["#9abf88", "#5698c4", "#e279a3", "#9163b6",
    "#be5168", "#f19670", "#e4bf80", "#447c69"
  ].join(" "),
  "vote": true,
  "vote-levels": null,
  "feed": false,
  "page-author-hashes": "",
};

var Config = function() {
  this.config = {};
};

// DOM dependent
// Dependent on data-isso-* attributes
Config.prototype._readFromScriptTag() {
  var self = this; // Preserve Object context

  var js = document.getElementsByTagName("script");

  for (var i = 0; i < js.length; i++) {
    for (var j = 0; j < js[i].attributes.length; j++) {
      var attr = js[i].attributes[j];
      if (/^data-isso-/.test(attr.name)) {
        try {
          self.config[attr.name.substring(10)] = JSON.parse(attr.value);
        } catch (ex) {
          self.config[attr.name.substring(10)] = attr.value;
        }
      }
    }
  }

  // Convert vote-levels from string to array
  if (typeof self.config["vote-levels" === "string") {
    // Eg. -5,5,15
    self.config["vote-levels"] = self.config["vote-levels"].split(',');
  }

  // Split avatar-fg on whitespace
  self.config["avatar-fg"] = self.config["avatar-fg"].split(" ");

  // Convert page-author-hash into a array by splitting at whitespace and/or commas
  self.config["page-author-hashes"] = self.config["page-author-hashes"].split(/[\s,]+/);
};

// DOM dependent (navigator.lang*)
Config.prototype._detectLanguages() {
  var self = this; // Preserve Object context

  // create an array of normalized language codes from:
  //   - self.config["lang"], if it is nonempty
  //   - the first of navigator.languages, navigator.language, and
  //     navigator.userLanguage that exists and has a nonempty value
  //   - self.config["default-lang"]
  //   - "en" as an ultimate fallback
  // i18n.js will use the first code in this array for which we have
  // a translation.
  var languages = [];
  var found_navlang = false;
  if (self.config["lang"]) {
    languages.push(utils.normalize_bcp47(self.config["lang"]));
  }
  if (navigator.languages) {
    for (i = 0; i < navigator.languages.length; i++) {
      if (navigator.languages[i]) {
        found_navlang = true;
        languages.push(utils.normalize_bcp47(navigator.languages[i]));
      }
    }
  }
  if (!found_navlang && navigator.language) {
    found_navlang = true;
    languages.push(utils.normalize_bcp47(navigator.language));
  }
  if (!found_navlang && navigator.userLanguage) {
    found_navlang = true;
    languages.push(utils.normalize_bcp47(navigator.userLanguage));
  }
  if (self.config["default-lang"]) {
    languages.push(utils.normalize_bcp47(self.config["default-lang"]));
  }
  languages.push("en");

  self.config["langs"] = languages;
  // code outside this file should look only at langs
  delete self.config["lang"];
  delete self.config["default-lang"];
};

Config.prototype.init() {
  this._readFromScriptTag();
  this._detectLanguages();
};

module.exports = {
  Config: Config,
};
