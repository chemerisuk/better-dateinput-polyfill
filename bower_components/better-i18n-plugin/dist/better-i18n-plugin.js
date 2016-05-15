/**
 * better-i18n-plugin: Internationalization plugin for better-dom
 * @version 2.0.0-rc.2 Sun, 15 May 2016 11:43:41 GMT
 * @link https://github.com/chemerisuk/better-i18n-plugin
 * @copyright 2016 Maksim Chemerisuk
 * @license MIT
 */
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (DOM) {
    "use strict";

    var strings = [],
        languages = [],
        reParam = /%s/g,
        HTML = DOM.get("documentElement");

    function formatKey(key, args) {
        var start = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        if (args) {
            return key.replace(reParam, function (str) {
                return args[start++] || str;
            });
        } else {
            return key;
        }
    }

    var Entry = function () {
        function Entry(key, args) {
            var _this = this;

            _classCallCheck(this, Entry);

            languages.forEach(function (lang, index) {
                var value = strings[index][key];

                if (value) {
                    _this[lang] = formatKey(value, args);
                }
            });

            this._ = formatKey(key, args);
        }

        Entry.prototype.toString = function toString() {
            var _this2 = this;

            // "_" key should always be the last one
            return Object.keys(this).sort(function (key) {
                return key === "_" ? 1 : -1;
            }).map(function (key) {
                return "<span lang=\"" + key + "\">" + _this2[key] + "</span>";
            }).join("");
        };

        Entry.prototype.toLocaleString = function toLocaleString(lang) {
            return this[lang || HTML.lang] || this._;
        };

        Entry.prototype.valueOf = function valueOf() {
            return "<span>" + this.toString() + "</span>";
        };

        return Entry;
    }();

    DOM.importStrings = function (lang, key, value) {
        if (typeof lang !== "string") {
            throw new TypeError("lang argument must be a string");
        }

        var langIndex = languages.indexOf(lang),
            stringsMap = strings[langIndex];

        if (langIndex === -1) {
            langIndex = languages.push(lang) - 1;
            strings[langIndex] = stringsMap = {};

            // add global rules to to able to switch to new language

            // by default localized strings should be hidden
            DOM.importStyles("span[lang=\"" + lang + "\"]", "display:none");
            // ... except current page language is `lang`
            DOM.importStyles(":lang(" + lang + ") > span[lang=\"" + lang + "\"]", "display:inline !important");
            // ... in such case hide default value too
            DOM.importStyles(":lang(" + lang + ") > span[lang=\"" + lang + "\"] ~ span[lang]", "display:none");
        }

        if (typeof key === "string") {
            stringsMap[key] = value;
        } else {
            Object.keys(key).forEach(function (x) {
                stringsMap[x] = key[x];
            });
        }
    };

    DOM.__ = function (key) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        if (Array.isArray(key)) {
            return key.map(function (key) {
                return new Entry(key, args);
            });
        } else {
            return new Entry(key, args);
        }
    };

    DOM.i18nLiteral = function (parts) {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
        }

        return new Entry(parts.join("%s"), args).toLocaleString();
    };
})(window.DOM);