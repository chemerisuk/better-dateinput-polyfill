(function(DOM, BASE, VK_SPACE, VK_TAB, VK_ENTER, VK_ESCAPE, VK_BACKSPACE, VK_DELETE) {
    "use strict";

    var HTML = DOM.get("documentElement"),
        ampm = (pos, neg) => HTML.lang === "en-US" ? pos : neg,
        formatISODate = (value) => value.toISOString().split("T")[0],
        PICKER_TEMPLATE = DOM.create(DOM.emmet(`div.${BASE}-calendar>(p.${BASE}-calendar-header>a[unselectable=on]*2+time[is=local-time data-format='MMMM yyyy' aria-hidden=true unselectable=on].${BASE}-calendar-caption)`)),
        DAYS_TEMPLATE = DOM.create(DOM.emmet(`table[aria-hidden=true].${BASE}-calendar-days>(thead>(tr>th[unselectable=on]*7>time[is=local-time data-format=E]))+(tbody.${BASE}-calendar-body*2>tr*6>td*7)`)),
        MONTHS_TEMPLATE = DOM.create(DOM.emmet(`table[aria-hidden=true].${BASE}-calendar-months>tbody>tr*3>td*4>time[is=local-time data-format=MMM])`)),
        LABEL_TEMPLATE = DOM.create(DOM.emmet(`time[is=local-time aria-hidden=true].${BASE}-value`)),
        readDateRange = (el) => ["min", "max"].map((x) => new Date(el.get(x) || ""));

    MONTHS_TEMPLATE.findAll("time").forEach((time, index) => {
        time.set("datetime", new Date(2001, index, 9).toISOString());
    });

    DAYS_TEMPLATE.findAll("time").forEach((time, index) => {
        time.set("datetime", new Date(ampm(2001, 2002), 0, index).toISOString());
    });

    DOM.extend("input[type=date]", {
        constructor() {
            if (this._isNative()) return false;

            var picker = PICKER_TEMPLATE.clone(true),
                label = LABEL_TEMPLATE.clone(true),
                color = this.css("color"),
                offset = this.offset();

            if ( this.get('disabled') == true || this.get('readonly') == true){
            	return;
            }
            this
                // hide original input text
                // IE8 doesn't suport color:transparent - use background-color instead
                .css("color", document.addEventListener ? "transparent" : this.css("background-color"))
                // sync picker visibility on focus/blur
                .on(["focus", "click"], this._focusPicker.bind(this, picker))
                .on("blur", this._blurPicker.bind(this, picker))
                .on("change", this._syncDateValue.bind(this, label))
                .before(picker.hide(), label);

            label
                .set("data-format", this.get("data-format") || "E, dd MMM yyyy")
                .on("click", this._clickLabel.bind(this));

            var calendarDaysMain = DAYS_TEMPLATE.clone(true),
                calenderDays = calendarDaysMain.findAll(`.${BASE}-calendar-body`),
                calendarMonths = MONTHS_TEMPLATE.clone(true),
                calendarCaption = picker.find(`.${BASE}-calendar-caption`),
                changeValue = this._changeValue.bind(this, calendarCaption, calendarMonths, calenderDays, picker);

            picker.append(calendarDaysMain);

            calenderDays[1].hide().remove();

            calendarCaption.on("click", this._clickPickerCaption.bind(this,
                picker, calendarMonths, calendarDaysMain, calendarCaption, changeValue));

            // handle arrow keys, esc etc.
            this
                .on("keydown", ["which"], this._keydownPicker.bind(this, picker, calendarMonths))
                .watch("value", changeValue);

            this.closest("form").on("reset", this._resetForm.bind(this));
            // trigger watchers to build the calendar
            changeValue(this.get("defaultValue"));

            picker
                .on("mousedown", ["target"], this._clickPicker.bind(this, picker, calendarMonths))
                .watch("aria-hidden", this._changePickerVisibility.bind(this, picker, calendarMonths, calendarCaption))
                .css(this._getPickerStyles(offset, picker))
                .hide(); // hide calendar to trigger show animation properly later

            label.css(this._getLabelStyles(offset, label, color));
            // display calendar for autofocused elements
            if (this.matches(":focus")) picker.show();
        },
        _isNative() {
            var polyfillType = this.get("data-polyfill"),
                deviceType = "orientation" in window ? "mobile" : "desktop";

            if (polyfillType === "none") return true;

            if (!polyfillType || polyfillType === deviceType && polyfillType !== "all") {
                // use a stronger type support detection that handles old WebKit browsers:
                // http://www.quirksmode.org/blog/archives/2015/03/better_modern_i.html
                if (this[0].type === "date") return true;

                var invalidValue = this.value("_").value();
                // if browser allows invalid value then it doesn't support the feature
                return invalidValue !== "_";
            } else {
                // remove native control
                this.set("type", "text");
                // force applying the polyfill
                return false;
            }
        },
        _getPickerStyles(offset, picker) {
            var calOffset = picker.offset();
            var marginTop = offset.bottom - calOffset.top;
            // #3: move calendar to the top when passing cross browser window bounds
            if (HTML.clientHeight < offset.bottom + calOffset.height) {
                marginTop = calOffset.top - offset.bottom - calOffset.height;
            }

            return {
                "margin-left": offset.left - calOffset.left + (offset.width - calOffset.width) / 2,
                "margin-top": marginTop,
                "z-index": 1 + (this.css("z-index") | 0)
            };
        },
        _getLabelStyles(offset, label, color) {
            var labelOffset = label.offset();
            // copy input CSS to adjust visible text position
            var styles = this.css(["width", "font", "padding-left", "padding-right", "text-align", "border-width", "box-sizing"]);

            styles.color = color;
            styles["line-height"] = offset.height + "px";
            styles["margin-left"] = offset.left - labelOffset.left + "px";
            styles["margin-top"] = offset.top - labelOffset.top + "px";

            return styles;
        },
        _changeValue(caption, calendarMonths, calenderDays, picker, value, prevValue) {
            // #47: do not proceed if animation is in progress still
            if (calenderDays.every((days) => picker.contains(days))) return false;

            var year, month, date, iterDate;

            value = new Date(value);

            if (!value.getTime()) {
                value = new Date();
            }

            month = value.getUTCMonth();
            date = value.getUTCDate();
            year = value.getUTCFullYear();
            // update calendar caption
            caption.set("datetime", new Date(year, month).toISOString());
            // update calendar content
            iterDate = new Date(Date.UTC(year, month, 1));

            var range = readDateRange(this);

            if (picker.contains(calendarMonths)) {
                calendarMonths.findAll("td").forEach((day, index) => {
                    iterDate.setUTCMonth(index);

                    var mDiff = month - iterDate.getUTCMonth(),
                        className = `${BASE}-calendar-`;

                    if (iterDate < range[0] || iterDate > range[1]) {
                        className += "out";
                    } else if (!mDiff) {
                        className += "today";
                    } else {
                        className = "";
                    }

                    day.set("class", className);
                });
            } else {
                // move to beginning of current month week
                iterDate.setUTCDate(iterDate.getUTCDate() - iterDate.getUTCDay() - ampm(1, 0));

                prevValue = new Date(prevValue);

                var delta = value.getUTCMonth() - prevValue.getUTCMonth() + 100 * (value.getUTCFullYear() - prevValue.getUTCFullYear());
                var currenDays = calenderDays[picker.contains(calenderDays[0]) ? 0 : 1];
                var targetDays = delta ? calenderDays[calenderDays[0] === currenDays ? 1 : 0] : currenDays;
                // update days
                targetDays.findAll("td").forEach((day) => {
                    iterDate.setUTCDate(iterDate.getUTCDate() + 1);

                    var mDiff = month - iterDate.getUTCMonth(),
                        className = `${BASE}-calendar-`;

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

                    day
                        .set("class", className)
                        .data("ts", iterDate.getTime())
                        .value(iterDate.getUTCDate());
                });

                if (delta) {
                    currenDays[delta > 0 ? "after" : "before"](targetDays);
                    currenDays.hide(() => { currenDays.remove() });
                    targetDays.show();
                }
            }

            // trigger event manually to notify about changes
            this.fire("change");
        },
        _syncDateValue(time) {
            time.set("datetime", this.value());
        },
        _clickPicker(picker, calendarMonths, target) {
            var targetDate;

            if (target.matches("a")) {
                targetDate = new Date(this.value());

                if (!targetDate.getTime()) targetDate = new Date();

                var sign = target.next("a")[0] ? -1 : 1;

                if (picker.contains(calendarMonths)) {
                    targetDate.setUTCFullYear(targetDate.getUTCFullYear() + sign);
                } else {
                    targetDate.setUTCMonth(targetDate.getUTCMonth() + sign);
                }
            } else if (calendarMonths.contains(target)) {
                target = target.closest("time");

                targetDate = new Date(this.value());
                targetDate.setUTCMonth(new Date(target.get("datetime")).getUTCMonth());

                picker.hide();
            } else if (target.matches("td")) {
                targetDate = target.data("ts");

                if (targetDate) {
                    targetDate = new Date(targetDate);
                    picker.hide();
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
        _keydownPicker(picker, calendarMonths, which) {
            var delta, currentDate;
            // ENTER key should submit form if calendar is hidden
            if (picker.matches(":hidden") && which === VK_ENTER) return true;

            if (which === VK_SPACE) {
                picker.toggle(); // SPACE key toggles calendar visibility
            } else if (which === VK_ESCAPE || which === VK_TAB || which === VK_ENTER) {
                picker.hide(); // ESC, TAB or ENTER keys hide calendar
            } else if (which === VK_BACKSPACE || which === VK_DELETE) {
                this.empty(); // BACKSPACE, DELETE clear value
            } else {
                currentDate = new Date(this.value());

                if (!currentDate.getTime()) currentDate = new Date();

                if (which === 74 || which === 40) { delta = 7; }
                else if (which === 75 || which === 38) { delta = -7; }
                else if (which === 76 || which === 39) { delta = 1; }
                else if (which === 72 || which === 37) { delta = -1; }

                if (delta) {
                    var shiftKey = picker.contains(calendarMonths);

                    if (shiftKey && (which === 40 || which === 38)) {
                        currentDate.setUTCMonth(currentDate.getUTCMonth() + (delta > 0 ? 4 : -4));
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
        _blurPicker(picker) {
            picker.hide();
        },
        _focusPicker(picker) {
            if (this.get("readonly")) return false;

            picker.show();

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
        _clickPickerCaption(picker, calendarMonths, calendarDaysMain, calendarCaption, changeValue) {
            if (picker.contains(calendarMonths)) {
                calendarMonths.remove();
                picker.append(calendarDaysMain);

                calendarCaption.set("data-format", "MMMM yyyy");
            } else {
                calendarDaysMain.remove();
                picker.append(calendarMonths);

                calendarCaption.set("data-format", "yyyy");
            }

            changeValue(this.value());
        },
        _changePickerVisibility(picker, calendarMonths, calendarCaption, hidden) {
            if (hidden !== "true") {
                if (picker.contains(calendarMonths)) {
                    // restore picker state
                    calendarCaption.fire("click");
                }
            }
        },
        _clickLabel() {
            this.fire("focus");
        },
        _resetForm() {
            this.value(this.get("defaultValue"));
        }
    });
}(window.DOM, "btr-dateinput", 32, 9, 13, 27, 8, 46));
