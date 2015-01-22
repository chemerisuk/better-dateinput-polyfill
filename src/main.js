(function(DOM, BASE_CLASS, VK_SPACE, VK_TAB, VK_ENTER, VK_ESCAPE, VK_BACKSPACE, VK_DELETE, DateUtils) {
    "use strict";

    var __ = DOM.__,
        ampm = (pos, neg) => DOM.get("lang") === "en-US" ? pos : neg,
        formatISODate = (value) => value.toISOString().split("T")[0],
        PICKER_TEMPLATE = DOM.create("div.{0}>p.{0}-header>a[{1}]*2+span[{2} {1}].{0}-caption^table[{2}].{0}-days>thead>(tr>th[{1}]*7)^(tbody.{0}-body*2>tr*6>td*7)", [`${BASE_CLASS}-calendar`, "unselectable=on", "aria-hidden=true"]),
        LABEL_TEMPLATE = DOM.create("span[aria-hidden=true].{0}-value", [BASE_CLASS]),
        readDateRange = (el) => ["min", "max"].map((x) => new Date(el.get(x) || "")),
        pad = (num, maxlen) => ((maxlen === 2 ? "0" : "00") + num).slice(-maxlen);

    // Feature detect browsers that already support date inputs
    var hasNativeSupport = DOM.create("input[type=date]")[0].type === "date";

    // need to skip mobile/tablet browsers
    DOM.extend("input[type=date]", !( window.orientation || hasNativeSupport ), {
        constructor() {
            var calendar = PICKER_TEMPLATE.clone(true),
                label = LABEL_TEMPLATE.clone(true),
                color = this.css("color");

            this
                // remove legacy dateinput implementation if it exists
                // also set value to current time to trigger watchers later
                .set({type: "text", value: Date.now()})
                // hide original input text
                // IE8 doesn't suport color:transparent - use background-color instead
                .css("color", document.addEventListener ? "transparent" : this.css("background-color"))
                // handle arrow keys, esc etc.
                .on("keydown", ["which", "shiftKey"], this._keydownCalendar.bind(this, calendar))
                // sync picker visibility on focus/blur
                .on(["focus", "click"], this._focusCalendar.bind(this, calendar))
                .on("blur", this._blurCalendar.bind(this, calendar))
                .on("change", this._formatValue.bind(this, label))
                .before(calendar.hide(), label);

            label
                .on("click", () => { this.fire("focus") })
                // copy input CSS to adjust visible text position
                .css(this.css(["width", "font", "padding-left", "padding-right", "text-align", "border-width", "box-sizing"]));

            var calenderDays = calendar.findAll(`.${BASE_CLASS}-calendar-body`);

            calenderDays[1].hide().remove();

            this.closest("form").on("reset", this._resetForm.bind(this));
            this.watch("value", this._changeValue.bind(this,
                calendar.find(`.${BASE_CLASS}-calendar-caption`), calenderDays, calendar));
            // trigger watchers to build the calendar
            this.set(this.get("defaultValue"));

            calendar.on("mousedown", ["target"], this._clickCalendar.bind(this, calendar));
            // FIXME: get rid of DOM.requestFrame which is required to get right offset
            DOM.requestFrame(() => {
                var offset = this.offset();
                var labelOffset = label.offset();

                label.css({
                    "color": color,
                    "line-height": offset.height + "px",
                    "margin-left": offset.left - labelOffset.left,
                    "margin-top": offset.top - labelOffset.top
                });

                calendar
                    .css({
                        "margin-left": offset.left - labelOffset.left,
                        "margin-top": offset.bottom - labelOffset.top,
                        "z-index": 1 + (this.css("z-index") | 0)
                    });

                // FIXME
                // move calendar to the top when passing cross browser window bounds
                // if (DOM.get("clientHeight") < offset.bottom + calOffset.height) {
                //     calendar.css("margin-top", calOffset.top - offset.bottom - calOffset.height);
                // }

                // display calendar for autofocused elements
                if (this.matches(":focus")) this.fire("focus");
            });
        },
        _changeValue(caption, calenderDays, calendar, value, prevValue) {
            var year, month, date, iterDate;

            value = new Date(value);

            if (!value.getTime()) {
                value = new Date();
            }

            month = value.getUTCMonth();
            date = value.getUTCDate();
            year = value.getUTCFullYear();
            // update calendar caption
            caption.set(__(DateUtils.MONTHS[month]).toHTMLString() + " " + year);
            // update calendar content
            iterDate = new Date(Date.UTC(year, month, 0));
            // move to beginning of current month week
            iterDate.setUTCDate(iterDate.getUTCDate() - iterDate.getUTCDay() - ampm(1, 0));

            prevValue = new Date(prevValue);

            var delta = value.getUTCMonth() - prevValue.getUTCMonth() + 100 * (value.getUTCFullYear() - prevValue.getUTCFullYear());
            var currenDays = calenderDays[calendar.contains(calenderDays[0]) ? 0 : 1];
            var targetDays = delta ? calenderDays[calenderDays[0] === currenDays ? 1 : 0] : currenDays;
            var range = readDateRange(this);

            // update days
            targetDays.findAll("td").forEach((day) => {
                iterDate.setUTCDate(iterDate.getUTCDate() + 1);

                var mDiff = month - iterDate.getUTCMonth(),
                    className = `${BASE_CLASS}-calendar-`;

                if (year !== iterDate.getUTCFullYear()) mDiff *= -1;

                if (iterDate < range[0] || iterDate > range[1]) {
                    className += "out";
                } else if (mDiff > 0) {
                    className += "past";
                } else if (mDiff < 0) {
                    className += "future";
                } else if (date === iterDate.getUTCDate()) {
                    className += "today";
                } else {
                    className = "";
                }

                day.set({
                    _ts: iterDate.getTime(),
                    className: className,
                    textContent: iterDate.getUTCDate()
                });
            });

            if (delta) {
                currenDays[delta > 0 ? "after" : "before"](targetDays);
                currenDays.hide(() => { currenDays.remove() });
                targetDays.show();
            }

            // trigger event manually to notify about changes
            this.fire("change");
        },
        _formatValue(label) {
            var value = new Date(this.get()),
                formattedValue = "";

            if (value.getTime()) {
                var formatString = this.get("data-format");
                // use "E, dd MMM yyyy" as default value
                if (!formatString) formatString = "E, dd MMM yyyy";

                var day = value.getUTCDay();
                var date = value.getUTCDate();
                var month = value.getUTCMonth();
                var year = value.getUTCFullYear();

                formatString = formatString
                        .replace(/'([^']+)'/g, "->$1<-")
                        .replace(/\w+/g, "{$&}")
                        .replace(/->{(.*?)}<-/g, (_, group) => group.replace(/}|{/g, ""));

                formattedValue = DOM.format(formatString, {
                    E: __(DateUtils.DAYS[day].slice(0, 2)).toHTMLString(),
                    EE: __(DateUtils.DAYS[day]).toHTMLString(),
                    d: date,
                    dd: pad(date, 2),
                    D: DateUtils.getDayInYear(value),
                    DD: pad(DateUtils.getDayInYear(value), 3),
                    w: DateUtils.getWeekInYear(value),
                    ww: pad(DateUtils.getWeekInYear(value), 2),
                    W: DateUtils.getWeekInMonth(value),
                    M: month + 1,
                    MM: pad(month + 1, 2),
                    MMM: __(DateUtils.MONTHS[month].substr(0, 3) + ".").toHTMLString(),
                    MMMM: __(DateUtils.MONTHS[month]).toHTMLString(),
                    y: year % 100,
                    yy: pad(year % 100, 2),
                    yyyy: year,
                    u: day || 7,
                    F: DateUtils.getWeekCountInMonth(value)
                });
            }

            // display formatted date value instead of real one
            label.value(formattedValue);
        },
        _clickCalendar(calendar, target) {
            var targetDate;

            if (target.matches("a")) {
                targetDate = new Date(this.get());

                if (!targetDate.getTime()) targetDate = new Date();

                targetDate.setUTCMonth(targetDate.getUTCMonth() + (target.next("a")[0] ? -1 : 1));
            } else if (target.matches("td")) {
                targetDate = target.get("_ts");

                if (targetDate) {
                    targetDate = new Date(targetDate);
                    calendar.hide();
                }
            }

            if (targetDate != null) {
                var range = readDateRange(this);

                if (targetDate < range[0]) {
                    targetDate = range[0];
                } else if (targetDate > range[1]) {
                    targetDate = range[1];
                }

                this.value(formatISODate(targetDate));
            }
            // prevent input from loosing focus
            return false;
        },
        _keydownCalendar(calendar, which, shiftKey) {
            var delta, currentDate;

            // ENTER key should submit form if calendar is hidden
            if (calendar.matches(":hidden") && which === VK_ENTER) return true;

            if (which === VK_SPACE) {
                calendar.toggle(); // SPACE key toggles calendar visibility
            } else if (which === VK_ESCAPE || which === VK_TAB || which === VK_ENTER) {
                calendar.hide(); // ESC, TAB or ENTER keys hide calendar
            } else if (which === VK_BACKSPACE || which === VK_DELETE) {
                this.empty(); // BACKSPACE, DELETE clear value
            } else {
                currentDate = new Date(this.get());

                if (!currentDate.getTime()) currentDate = new Date();

                if (which === 74 || which === 40) { delta = 7; }
                else if (which === 75 || which === 38) { delta = -7; }
                else if (which === 76 || which === 39) { delta = 1; }
                else if (which === 72 || which === 37) { delta = -1; }

                if (delta) {
                    if (shiftKey && (which === 40 || which === 38)) {
                        currentDate.setUTCFullYear(currentDate.getUTCFullYear() + (delta > 0 ? 1 : -1));
                    } else if (shiftKey && (which === 37 || which === 39)) {
                        currentDate.setUTCMonth(currentDate.getUTCMonth() + (delta > 0 ? 1 : -1));
                    } else {
                        currentDate.setUTCDate(currentDate.getUTCDate() + delta);
                    }

                    var range = readDateRange(this);

                    if (!(currentDate < range[0] || currentDate > range[1])) {
                        this.value(formatISODate(currentDate));
                    }
                }
            }
            // prevent default action except if it was TAB so
            // do not allow to change the value manually
            return which === VK_TAB;
        },
        _blurCalendar(calendar) {
            calendar.hide();
        },
        _focusCalendar(calendar) {
            // update calendar weekday captions
            calendar.findAll("th").forEach((el, index) => {
                el.l10n(DateUtils.DAYS[ampm(index, ++index % 7)].slice(0, 2));
            });

            calendar.show();

            // use the trick below to reset text selection on focus
            setTimeout(() => {
                var node = this[0];

                if ("selectionStart" in node) {
                    node.selectionStart = 0;
                    node.selectionEnd = 0;
                } else {
                    var inputRange = node.createTextRange();

                    inputRange.moveStart("character", 0);
                    inputRange.collapse();
                    inputRange.moveEnd("character", 0);
                    inputRange.select();
                }
            }, 0);
        },
        _resetForm() {
            this.value(this.get("defaultValue"));
        }
    });

    // compact moths in english don't have the dot suffix
    DOM.importStrings("en", DateUtils.MONTHS.reduce((memo, month) => {
        var shortMonth = month.slice(0, 3);

        memo[shortMonth + "."] = shortMonth;

        return memo;
    }, {}));
}(window.DOM, "btr-dateinput", 32, 9, 13, 27, 8, 46, {
    DAYS: "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
    MONTHS: "January February March April May June July August September October November December".split(" "),
    getWeekInYear(d) {
        d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        // set to nearest thursday: current date + 4 - current day number
        // make sunday's day number 7
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
        // calculate full weeks to nearest thursday
        return Math.ceil((1 + (d - yearStart) / 86400000) / 7);
    },
    getWeekInMonth(d) {
        var firstWeekday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).getUTCDay();
        var offsetDate = d.getUTCDate() + firstWeekday - 1;
        return 1 + Math.floor(offsetDate / 7);
    },
    getWeekCountInMonth(d) {
        return Math.ceil(d.getUTCDate() / 7);
    },
    getDayInYear(d) {
        var beginOfYear = Date.UTC(d.getUTCFullYear(), 0, 1);
        var millisBetween = d.getTime() - beginOfYear;
        return Math.floor(1 + millisBetween / 86400000);
    }
}));
