(function(DOM) {
    "use strict";

    var htmlEl = DOM.find("html"),
        COMPONENT_CLASS = "better-dateinput",
        INPUT_KEY = "date-input",
        CALENDAR_KEY = "date-picker",
        DATEPICKER_TEMPLATE = DOM.template("div.$c>p.$c-header+button[type=button tabindex=-1]+button[type=button  tabindex=-1]+table.$c-days>thead>tr>th*7+tbody>tr*6>td*7", {c: COMPONENT_CLASS + "-calendar"}),
        zeropad = function(value) { return ("00" + value).slice(-2) },
        ampm = function(pos, neg) { return htmlEl.get("lang") === "en-US" ? pos : neg };

    DOM.extend("input[type=date]", "orientation" in window ? function() { this.addClass(COMPONENT_CLASS) } : {
        // polyfill timeinput for desktop browsers
        constructor: function() {
            var calendar = DOM.create(DATEPICKER_TEMPLATE).hide(),
                dateinput = DOM.create("input[type=hidden]", {name: this.get("name")});

            this
                // remove legacy dateinput if it exists
                .set({type: "text", name: null})
                .addClass("better-dateinput")
                // sync value on click
                .on("focus", "handleCalendarFocus")
                // handle arrow keys, esc etc.
                .on("keydown", ["which", "shiftKey"], "handleCalendarKeyDown");

            // use mousedown instead of click to prevent loosing focus
            calendar
                .on("mousedown button", this, "handleCalendarNavClick")
                .on("mousedown td", this, "handleCalendarDayClick");

            // hide calendar when a user clicks somewhere outside
            DOM.on("click", this, "handleDocumentClick");

            this
                .data(CALENDAR_KEY, calendar)
                .data(INPUT_KEY, dateinput)
                .after(calendar, dateinput);

            // display calendar for autofocused elements
            if (this.matches(":focus")) this.fire("focus");
        },
        getCalendarDate: function() {
            var isoParts = (this.data(INPUT_KEY).get() || "").split("-");

            return new Date(parseFloat(isoParts[0]), parseFloat(isoParts[1]) - 1, parseFloat(isoParts[2]));
        },
        setCalendarDate: function(value) {
            var calendar = this.data(CALENDAR_KEY),
                now = new Date(),
                year = (value || now).getFullYear(),
                month = (value || now).getMonth(),
                date = (value || now).getDate(),
                iterDate = new Date(year, month, 0);
            // update caption
            calendar.find("p").i18n("calendar.month." + month, {year: year});
            // update weekday captions
            calendar.findAll("th").each(function(el, index) {
                el.i18n("calendar.weekday." + ampm(!index ? 7 : index, index + 1));
            });
            // move to beginning of current month week
            iterDate.setDate(iterDate.getDate() - iterDate.getDay() - ampm(1, 0));
            // update day numbers
            calendar.findAll("td").each(function(day) {
                iterDate.setDate(iterDate.getDate() + 1);

                var mDiff = month - iterDate.getMonth(),
                    dDiff = date - iterDate.getDate();

                if (year !== iterDate.getFullYear()) {
                    mDiff *= -1;
                }

                day.set("class", mDiff ?
                    (mDiff > 0 ? "prev-calendar-day" : "next-calendar-day") :
                    (dDiff ? "calendar-day" : "current-calendar-day")
                );

                day.set(iterDate.getDate().toString()).data("ts", iterDate.getTime());
            });

            // update current date
            this.data(INPUT_KEY).set(year + "-" + zeropad(month + 1) + "-" + zeropad(date));

            if (value) this.set(ampm(month + 1, date) + "/" + ampm(date, month + 1) + "/" + year);

            return this;
        },
        handleCalendarDayClick: function(target) {
            this.data(CALENDAR_KEY).hide();

            return !this.setCalendarDate(new Date(target.data("ts")));
        },
        handleCalendarNavClick: function(target) {
            var isNext = !target.next("button").length,
                calendarDate = this.getCalendarDate(),
                targetDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + (isNext ? 1 : -1), 1);

            return !this.setCalendarDate(targetDate);
        },
        handleCalendarKeyDown: function(which, shiftKey) {
            var calendar = this.data(CALENDAR_KEY),
                currentDate = this.getCalendarDate(),
                delta = 0;

            // ENTER key should submit form if calendar is hidden
            if (calendar.matches(":hidden") && which === 13) return true;

            if (which === 32) {
                calendar.toggle(); // SPACE key toggles calendar visibility
            } else if (which === 27 || which === 9 || which === 13) {
                calendar.hide(); // ESC, TAB or ENTER keys hide calendar
            } else if (which === 8 || which === 46) {
                this.set("").handleCalendarFocus(); // BACKSPACE, DELETE clear value
            } else {
                if (which === 74 || which === 40) { delta = 7; }
                else if (which === 75 || which === 38) { delta = -7; }
                else if (which === 76 || which === 39) { delta = 1; }
                else if (which === 72 || which === 37) { delta = -1; }

                if (delta) {
                    if (shiftKey && (which === 40 || which === 38)) {
                        currentDate.setFullYear(currentDate.getFullYear() + (delta > 0 ? 1 : -1));
                    } else if (shiftKey && (which === 37 || which === 39)) {
                        currentDate.setMonth(currentDate.getMonth() + (delta > 0 ? 1 : -1));
                    } else {
                        currentDate.setDate(currentDate.getDate() + delta);
                    }

                    this.setCalendarDate(currentDate);
                }
            }
            // prevent default action except if it was TAB so
            // do not allow to change the value manually
            return which === 9;
        },
        handleDocumentClick: function() {
            var calendar = this.data(CALENDAR_KEY);

            if (!this.matches(":focus")) calendar.hide();
        },
        handleCalendarFocus: function() {
            var calendar = this.data(CALENDAR_KEY),
                parts = this.get().split("/"),
                value, year, month, date;

            if (parts.length === 3) {
                date = parseFloat(parts[ampm(1, 0)]);
                month = parseFloat(parts[ampm(0, 1)]) - 1;
                year = parseFloat(parts[2]);

                value = new Date(year, month, date);
            }
            // switch calendar to the input value date
            this.setCalendarDate(value);

            calendar.show();
        }
    });
}(window.DOM));
