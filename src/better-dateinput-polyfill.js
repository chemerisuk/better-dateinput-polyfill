(function(DOM, COMPONENT_CLASS, I18N_DAYS, I18N_MONTHS) {
    "use strict";

    var htmlEl = DOM.find("html"),
        ampm = function(pos, neg) { return htmlEl.get("lang") === "en-US" ? pos : neg },
        formatISODate = function(value) { return value.toISOString().split("T")[0] },
        NOT_A_MOBILE_BROWSER = !("orientation" in window); // need to skip mobile/tablet browsers

    DOM.extend("input[type=date]", NOT_A_MOBILE_BROWSER, {
        constructor: function() {
            var calendar = DOM.create("div.{0}>a[unselectable=on]*2+p.{0}-header+table.{0}-days>thead>tr>th[unselectable=on]*7+tbody>tr*6>td*7", [COMPONENT_CLASS + "-calendar"]),
                dateinput = DOM.create("input[type=hidden name={0}]", [this.get("name")]),
                zIndex = (parseFloat(this.style("z-index")) || 0) + 1,
                offset = this.offset();

            this
                // remove legacy dateinput if it exists
                .set({type: "text", name: null})
                .addClass(COMPONENT_CLASS)
                // handle arrow keys, esc etc.
                .on("keydown", this.onCalendarKeyDown.bind(this, calendar, dateinput), ["which", "shiftKey"])
                // sync picker visibility on focus/blur
                .on(["focus", "click"], this.onCalendarFocus.bind(this, calendar))
                .on("blur", this.onCalendarBlur.bind(this, calendar))
                .after(calendar.hide(), dateinput);

            calendar
                .on("mousedown", this.onCalendarClick.bind(this, calendar, dateinput))
                .style({
                    "margin-left": -(calendar.get("offsetWidth") + offset.width) / 2,
                    "margin-top": offset.height,
                    "z-index": zIndex
                });

            this.parent("form").on("reset", this.onFormReset.bind(this, dateinput));
            // FIXME: "undefined" -> "value" after migrating to better-dom 1.7.5
            dateinput.watch("undefined", this.onValueChanged.bind(this,
                calendar.find("p"), calendar.findAll("th"), calendar.findAll("td")));
            // update hidden input value and refresh all visible controls
            dateinput
                .set(this.get() || new Date().toISOString())
                .set("_defaultValue", dateinput.get());
            // update defaultValue with formatted date
            this.set("defaultValue", this.get());
            // display calendar for autofocused elements
            if (this.matches(":focus")) this.fire("focus");
        },
        onValueChanged: function(caption, weekdays, days, value) {
            value = new Date(value);

            var formattedValue, year, month, date, iterDate;

            if (!value.getTime()) {
                value = new Date();
                formattedValue = "";
            }

            month = value.getMonth();
            date = value.getDate();
            year = value.getFullYear();

            if (typeof formattedValue !== "string") {
                formattedValue = ampm(month + 1, date) + "/" + ampm(date, month + 1) + "/" + year;
            }

            // set formatted date value for original input
            this.set(formattedValue);

            // update calendar caption
            caption.i18n(I18N_MONTHS[month], [year]);
            // update calendar weekday captions
            weekdays.each(function(el, index) {
                el.i18n(I18N_DAYS[ampm(index ? index - 1 : 6, index)]);
            });
            // update calendar content
            iterDate = new Date(year, month, 0, 12);
            // move to beginning of current month week
            iterDate.setDate(iterDate.getDate() - iterDate.getDay() - ampm(1, 0));
            // update day numbers
            days.set("class", function(day) {
                iterDate.setDate(iterDate.getDate() + 1);

                var mDiff = month - iterDate.getMonth(),
                    dDiff = date - iterDate.getDate();

                if (year !== iterDate.getFullYear()) mDiff *= -1;

                day.set("_ts", iterDate.getTime()).set(iterDate.getDate());



                return mDiff ?
                    (mDiff > 0 ? COMPONENT_CLASS + "-calendar-past" : COMPONENT_CLASS + "-calendar-future") :
                    (dDiff ? "" :  COMPONENT_CLASS + "-calendar-today");
            });
        },
        onCalendarClick: function(calendar, dateinput, target) {
            var targetDate;

            if (target.matches("a")) {
                targetDate = new Date(dateinput.get());
                targetDate.setMonth(targetDate.getMonth() + (target.next("a").length ? -1 : 1));
            } else if (target.matches("td")) {
                targetDate = new Date(target.get("_ts"));
                calendar.hide();
            }

            if (targetDate != null) dateinput.set(formatISODate(targetDate));
            // prevent input from loosing focus
            return false;
        },
        onCalendarKeyDown: function(calendar, dateinput, which, shiftKey) {
            var delta, currentDate;

            // ENTER key should submit form if calendar is hidden
            if (calendar.matches(":hidden") && which === 13) return true;

            if (which === 32) {
                calendar.toggle(); // SPACE key toggles calendar visibility
            } else if (which === 27 || which === 9 || which === 13) {
                calendar.hide(); // ESC, TAB or ENTER keys hide calendar
            } else if (which === 8 || which === 46) {
                dateinput.set(""); // BACKSPACE, DELETE clear value
            } else {
                currentDate = new Date(dateinput.get());

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

                    dateinput.set(formatISODate(currentDate));
                }
            }
            // prevent default action except if it was TAB so
            // do not allow to change the value manually
            return which === 9;
        },
        onCalendarBlur: function(calendar) {
            calendar.hide();
        },
        onCalendarFocus: function(calendar) {
            calendar.show(function() {
                // FIXME: remove after migrating to better-dom 1.7.5
                calendar.style("pointer-events", null);
            });
        },
        onFormReset: function(dateinput) {
            dateinput.set(function(el) { return el.get("_defaultValue") });
        }
    });
}(window.DOM, "better-dateinput", [
    "Mo",
    "Tu",
    "We",
    "Th",
    "Fr",
    "Sa",
    "Su"
], [
    "January {0}",
    "February {0}",
    "March {0}",
    "April {0}",
    "May {0}",
    "June {0}",
    "July {0}",
    "August {0}",
    "September {0}",
    "October {0}",
    "November {0}",
    "December {0}"
]));
