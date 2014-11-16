/**
 * better-i18n-plugin: Internationalization plugin for better-dom
 * @version 1.0.2 Tue, 28 Oct 2014 17:19:30 GMT
 * @link https://github.com/chemerisuk/better-i18n-plugin
 * @copyright 2014 Maksim Chemerisuk
 * @license MIT
 */
/* jshint -W053 */
(function(DOM) {
    "use strict";

    var strings = [],
        languages = [];

    DOM.importStrings = function(lang, key, value) {
        if (typeof lang !== "string") throw new TypeError("lang argument must be a string");

        var langIndex = languages.indexOf(lang),
            stringsMap = strings[langIndex];

        if (langIndex === -1) {
            langIndex = languages.push(lang) - 1;
            strings[langIndex] = stringsMap = {};

            // add global rules to to able to switch to new language

            // by default localized strings should be hidden
            DOM.importStyles((("[data-l10n=\"" + lang) + "\"]"), "display:none");
            // ... except current page language is `lang`
            DOM.importStyles(((":lang(" + lang) + (") > [data-l10n=\"" + lang) + "\"]"), "display:inline !important");
            // ... in such case hide default value too
            DOM.importStyles(((":lang(" + lang) + (") > [data-l10n=\"" + lang) + "\"] ~ [data-l10n]"), "display:none");
        }

        if (typeof key === "string") {
            stringsMap[key] = value;
        } else {
            Object.keys(key).forEach(function(x)  {
                stringsMap[x] = key[x];
            });
        }
    };

    DOM.extend("*", {
        l10n: function(key, varMap) {
            // unwrap outer <span> from toHTMLString call
            return this.set(new Entry(key, varMap).toHTMLString().slice(6, -7));
        }
    });

    DOM.__ = function(key, varMap)  {return new Entry(key, varMap)};

    function Entry(key, varMap) {var this$0 = this;
        languages.forEach(function(lang, index)  {
            var value = strings[index][key];

            if (value) {
                if (varMap) value = DOM.format(value, varMap);

                this$0[lang] = value;
            }
        });

        this._ = varMap ? DOM.format(key, varMap) : key;
    }

    // grab all methods from String.prototype
    Entry.prototype = new String();
    Entry.prototype.constructor = Entry;

    Entry.prototype.toString = Entry.prototype.valueOf = function() {
        return this[DOM.get("lang")] || this._;
    };

    Entry.prototype.toLocaleString = function(lang) {
        return lang ? this[lang] || this._ : this.toString();
    };

    Entry.prototype.toHTMLString = function() {var this$0 = this;
        // "_" key should always be the last one
        var keys = Object.keys(this).sort(function(k)  {return k === "_" ? 1 : -1});

        return DOM.emmet("span>" + keys.map(function(key)  {
            return "span[data-l10n=`" + key + "`]>`" + this$0[key] + "`";
        }).join("^"));
    };
}(window.DOM));
