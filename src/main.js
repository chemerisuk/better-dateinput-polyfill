(function(DOM, COMPONENT_CLASS, VK_SPACE, VK_TAB, VK_ENTER, VK_ESCAPE, VK_BACKSPACE, VK_DELETE, I18N_DAYS, I18N_MONTHS) {
    "use strict";

    var __ = DOM.__,
        ampm = (pos, neg) => DOM.get("lang") === "en-US" ? pos : neg,
        formatISODate = (value) => value.toISOString().split("T")[0];

    // need to skip mobile/tablet browsers
    DOM.extend("input[type=date]", !("orientation" in window), {
        constructor() {
            var calendar = DOM.create("div.{0}>p.{0}-caption>a[unselectable=on]*2+span[aria-hidden=true unselectable=on].{0}-header^table[aria-hidden=true].{0}-days>thead>(tr>th[unselectable=on]*7)^(tbody*2>tr*6>td*7)", [COMPONENT_CLASS + "-calendar"]),
                displayedValue = DOM.create("span[aria-hidden=true].{0}-value", [COMPONENT_CLASS]),
                color = this.css("color"),
                offset = this.offset(),
                calOffset;

            this
                // remove legacy dateinput implementation if it exists
                // also set value to current time to trigger watchers later
                .set({type: "text", value: Date.now()})
                // hide original input text
                // IE8 doesn't suport color:transparent - use background-color instead
                .css("color", document.addEventListener ? "transparent" : this.css("background-color"))
                // handle arrow keys, esc etc.
                .on("keydown", [calendar, "which", "shiftKey"], this.onCalendarKeyDown)
                // sync picker visibility on focus/blur
                .on(["focus", "click"], [calendar], this.onCalendarFocus)
                .on("blur", [calendar], this.onCalendarBlur)
                .on("change", [displayedValue], this.doFormatValue)
                .before(calendar)
                .before(displayedValue);

            calOffset = calendar.offset();

            calendar
                .on("mousedown", [calendar, "target"], this.onCalendarClick)
                .css({
                    "margin-left": offset.left - calOffset.left + (offset.width - calOffset.width) / 2,
                    "margin-top": offset.bottom - calOffset.top,
                    "z-index": 1 + (this.css("z-index") | 0)
                })
                .hide(); // hide calendar to trigger show animation properly later

            // move calendar to the top when passing cross browser window bounds
            if (DOM.get("clientHeight") < offset.bottom + calOffset.height) {
                calendar.css("margin-top", calOffset.top - offset.bottom - calOffset.height);
            }

            displayedValue
                .on("click", () => { this.fire("focus") })
                // copy input CSS
                .css(this.css(["width", "font", "padding-left", "padding-right", "text-align", "border-width", "box-sizing"]))
                .css({
                    "color": color,
                    "line-height": offset.height + "px",
                    "margin-left": offset.left - calOffset.left,
                    "margin-top": offset.top - calOffset.top,
                });

            var tbodies = calendar.findAll("tbody");

            tbodies[1].hide().remove();

            this.closest("form").on("reset", this.onFormReset);
            this.watch("value", this.onValueChanged.bind(this,
                calendar.find("." + COMPONENT_CLASS + "-calendar-header"), tbodies, calendar));
            // trigger watchers to build the calendar
            this.set(this.get("defaultValue"));
            // display calendar for autofocused elements
            if (this.matches(":focus")) this.fire("focus");
        },
        onValueChanged(caption, tbodies, calendar, value, prevValue) {
            var year, month, date, iterDate;

            value = new Date(value);

            if (!value.getTime()) {
                value = new Date();
            }

            month = value.getUTCMonth();
            date = value.getUTCDate();
            year = value.getUTCFullYear();

            // update calendar caption
            caption.set(__(I18N_MONTHS[month]).toHTMLString() + "&nbsp;" + year);
            // update calendar content
            iterDate = new Date(Date.UTC(year, month, 0));
            // move to beginning of current month week
            iterDate.setUTCDate(iterDate.getUTCDate() - iterDate.getUTCDay() - ampm(1, 0));

            prevValue = new Date(prevValue);

            var delta = value.getUTCMonth() - prevValue.getUTCMonth() + 100 * (value.getUTCFullYear() - prevValue.getUTCFullYear());
            var currentBody = tbodies[calendar.contains(tbodies[0]) ? 0 : 1];
            var targetBody = delta ? tbodies[tbodies[0] === currentBody ? 1 : 0] : currentBody;

            var min = new Date(this.get("min"));
            var max = new Date(this.get("max"));

            // update days
            targetBody.findAll("td").forEach((day) => {
                iterDate.setUTCDate(iterDate.getUTCDate() + 1);

                var mDiff = month - iterDate.getUTCMonth(),
                    dDiff = date - iterDate.getUTCDate(),
                    className = "";

                if (year !== iterDate.getUTCFullYear()) mDiff *= -1;

                if (iterDate < min || iterDate > max) {
                    className = COMPONENT_CLASS + "-calendar-out";
                } else if (mDiff > 0) {
                    className = COMPONENT_CLASS + "-calendar-past";
                } else if (mDiff < 0) {
                    className = COMPONENT_CLASS + "-calendar-future";
                } else if (!dDiff) {
                    className = COMPONENT_CLASS + "-calendar-today";
                }

                day
                    .set(iterDate.getUTCDate())
                    .set("_ts", iterDate.getTime())
                    .set("class", className);
            });

            if (delta) {
                currentBody.find("." + COMPONENT_CLASS + "-calendar-today").set("class", "");
                currentBody[delta > 0 ? "after" : "before"](targetBody);
                currentBody.hide(() => { currentBody.remove() });
                targetBody.show();
            }

            // trigger event manually to notify about changes
            this.fire("change");
        },
        doFormatValue(displayedValue) {
            var value = new Date(this.get()),
                formattedValue = "";

            if (value.getTime()) {
                // TODO: read formatString value from data-format attribute
                var formatString = "E, dd MMM yyyy".replace(/\w+/g, "{$&}");

                formattedValue = DOM.format(formatString, {
                    E: __(I18N_DAYS[value.getUTCDay()]).toHTMLString(),
                    dd: (value.getUTCDate() > 9 ? "" : "0") + value.getUTCDate(),
                    MMM: __(I18N_MONTHS[value.getUTCMonth()].substr(0, 3) + ".").toHTMLString(),
                    yyyy: value.getUTCFullYear()
                });
            }

            // display formatted date value instead of real one
            displayedValue.set(formattedValue);
        },
        onCalendarClick(calendar, target) {
            var targetDate;

            if (target.matches("a")) {
                targetDate = new Date(this.get());

                if (!targetDate.getTime()) targetDate = new Date();

                targetDate.setUTCMonth(targetDate.getUTCMonth() + (target.next("a")[0] ? -1 : 1));

                var min = new Date(this.get("min"));
                var max = new Date(this.get("max"));

                if (targetDate < min) {
                    targetDate = min;
                } else if (targetDate > max) {
                    targetDate = max;
                }
            } else if (target.matches("td")) {
                targetDate = target.get("_ts");

                if (targetDate) {
                    targetDate = new Date(targetDate);
                    calendar.hide();
                }
            }

            if (targetDate != null) {
                this.set(formatISODate(targetDate));
            }
            // prevent input from loosing focus
            return false;
        },
        onCalendarKeyDown(calendar, which, shiftKey) {
            var delta, currentDate;

            // ENTER key should submit form if calendar is hidden
            if (calendar.matches(":hidden") && which === VK_ENTER) return true;

            if (which === VK_SPACE) {
                calendar.toggle(); // SPACE key toggles calendar visibility
            } else if (which === VK_ESCAPE || which === VK_TAB || which === VK_ENTER) {
                calendar.hide(); // ESC, TAB or ENTER keys hide calendar
            } else if (which === VK_BACKSPACE || which === VK_DELETE) {
                this.set(""); // BACKSPACE, DELETE clear value
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

                    var min = new Date(this.get("min"));
                    var max = new Date(this.get("max"));

                    if (!(currentDate < min || currentDate > max)) {
                        this.set(formatISODate(currentDate));
                    }
                }
            }
            // prevent default action except if it was TAB so
            // do not allow to change the value manually
            return which === VK_TAB;
        },
        onCalendarBlur(calendar) {
            calendar.hide();
        },
        onCalendarFocus(calendar) {
            var node = this[0];
            // use the trick below to reset text selection on focus
            setTimeout(() => {
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

            // update calendar weekday captions
            calendar.findAll("th").forEach((el, index) => {
                el.l10n(I18N_DAYS[ampm(index, ++index % 7)]);
            });

            calendar.show();
        },
        onFormReset() {
            this.set(this.get("defaultValue"));
        }
    });
}(window.DOM, "better-dateinput", 32, 9, 13, 27, 8, 46, [
    "Su", "Mo","Tu","We","Th","Fr","Sa"
], [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
]));
