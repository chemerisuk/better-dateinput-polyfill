/**
 * better-time-element: Useful <time> element extensions
 * @version 1.0.0-rc.5 Sun, 15 May 2016 11:52:22 GMT
 * @link https://github.com/chemerisuk/better-time-element
 * @copyright 2016 Maksim Chemerisuk
 * @license MIT
 */
(function (DOM) {
    "use strict";

    var __ = DOM.__;
    var reFormat = /('|")(?:\\?.)*?\1|\w+/g;
    var pad = function (num, maxlen) {
        return maxlen === 1 ? num : ("00" + num).slice(-maxlen);
    };
    var DAYS = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ");
    var MONTHS = "January February March April May June July August September October November December".split(" ");

    DOM.extend("time[is=local-time]", {
        constructor: function () {
            this.watch("datetime", this._changeValue);
            this.watch("data-format", this._changeValue);

            this._changeValue();
        },
        _changeValue: function () {
            var datetimeText = this.get("datetime");

            if (!datetimeText) {
                return this.value("");
            }

            var value = new Date(datetimeText),
                formattedValue = "";

            if (isNaN(value)) {
                // IE returns weird strings for invalid dates, so use a hardcoded value
                formattedValue = "Invalid Date";
            } else {
                var formatString = this.get("data-format");
                // use "E, dd MMM yyyy H:mm:ss" as default value
                if (!formatString) formatString = "E, dd MMM yyyy H:mm:ss";

                formattedValue = formatString.replace(reFormat, function (str, quotes) {
                    switch (str) {
                        case "H":
                        case "HH":
                            str = pad(value.getHours(), str.length);
                            break;

                        case "h":
                        case "hh":
                            str = pad(value.getHours() % 12 || 12, str.length);
                            break;

                        case "m":
                        case "mm":
                            str = pad(value.getMinutes(), str.length);
                            break;

                        case "s":
                        case "ss":
                            str = pad(value.getSeconds(), str.length);
                            break;

                        case "p":
                        case "P":
                            if (value.getHours() > 11) {
                                str = str === "p" ? "pm" : "PM";
                            } else {
                                str = str === "p" ? "am" : "AM";
                            }
                            break;

                        case "d":
                        case "dd":
                            str = pad(value.getDate(), str.length);
                            break;

                        case "E":
                            str = __(DAYS[value.getDay()].slice(0, 2));
                            break;

                        case "EE":
                            str = __(DAYS[value.getDay()]);
                            break;

                        case "D":
                        case "DD":
                            var beginOfYear = Date.UTC(value.getUTCFullYear(), 0, 1);
                            var millisBetween = value.getTime() - beginOfYear - value.getTimezoneOffset() * 60 * 1000;
                            str = pad(Math.floor(1 + millisBetween / 86400000), str.length === 1 ? 1 : 3);
                            break;

                        case "M":
                        case "MM":
                            str = pad(value.getMonth() + 1, str.length);
                            break;

                        case "MMM":
                            str = __(MONTHS[value.getMonth()].substr(0, 3) + ".");
                            break;

                        case "MMMM":
                            str = __(MONTHS[value.getMonth()]);
                            break;

                        case "y":
                        case "yy":
                            str = pad(value.getFullYear() % 100, str.length);
                            break;

                        case "yyyy":
                            str = value.getFullYear();
                            break;

                        case "u":
                            str = value.getDay() || 7;
                            break;

                        default:
                            if (quotes) {
                                str = str.slice(1, -1);
                            }
                    }

                    return str.toString();
                });
            }

            this.set("innerHTML", formattedValue);
        }
    });

    // compact months in english don't have the dot suffix
    DOM.importStrings("en", MONTHS.reduce(function (memo, month) {
        var shortMonth = month.slice(0, 3);

        memo[shortMonth + "."] = shortMonth;

        return memo;
    }, {}));
})(window.DOM);