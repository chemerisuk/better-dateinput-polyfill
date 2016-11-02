(function(DOM, VK_SPACE, VK_TAB, VK_ENTER, VK_ESCAPE, VK_BACKSPACE, VK_DELETE, VK_CONTROL) {
    "use strict"; /* globals html:false */

    var repeat = (times, str) => Array(times + 1).join(str);

    var HTML = DOM.get("documentElement"),
        BASE_CLASS = "btr-dateinput-calendar",
        ampm = (pos, neg) => HTML.lang === "en_US" ? pos : neg,
        formatISODate = (value) => value.toISOString().split("T")[0],
        readDateRange = (el) => ["min", "max"].map((x) => new Date(el.get(x) || ""));

    const LABEL_TEMPLATE = DOM.create(html`
<time is="local-time" aria-hidden="true" class="btr-dateinput-value">
`);

    const PICKER_TEMPLATE = DOM.create(html`
<div class="${BASE_CLASS}">
    <p class="${BASE_CLASS}-header">
        ${repeat(2, `<a unselectable="on"></a>`)}
        <time is="local-time" class="${BASE_CLASS}-caption" data-format="MMMM yyyy" aria-hidden="true" unselectable="on">
    </p>
    <table class="${BASE_CLASS}-days" aria-hidden="true">
        <thead>
        ${repeat(7, `<th unselectable="on"><time is="local-time" data-format="E">`)}
        </thead>
        <tbody class="${BASE_CLASS}-body">
        ${repeat(7, `<tr>${repeat(7, "<td>")}</tr>`)}
        </tbody>
    </table>
    <table class="${BASE_CLASS}-months" aria-hidden="true">
        <tbody>
        ${repeat(3, `<tr>${repeat(4, `<td><time is="local-time" data-format="MMM">`)}`)}
        </tbody>
    </table>
</div>`);

    PICKER_TEMPLATE.find(`.${BASE_CLASS}-days`).findAll("time").forEach((time, index) => {
        time.set("datetime", new Date(ampm(2001, 2002), 0, index).toISOString());
    });

    PICKER_TEMPLATE.find(`.${BASE_CLASS}-months`).findAll("time").forEach((time, index) => {
        time.set("datetime", `2001-${++index < 10 ? "0" + index : index}-02`);
    });

    DOM.extend("input[type=date]", {
        constructor() {
            if (this._isNative()) return false;

            var picker = PICKER_TEMPLATE.clone(true),
                label = LABEL_TEMPLATE.clone(true),
                calenderDays = picker.find(`.${BASE_CLASS}-body`),
                calendarMonths = picker.find(`.${BASE_CLASS}-months`),
                calendarCaption = picker.find(`.${BASE_CLASS}-caption`),
                invalidatePicker = this._invalidatePicker.bind(this, calendarCaption, calendarMonths, calenderDays, picker);

            label
                .set("data-format", this.get("data-format") || "E, dd MMM yyyy")
                .css(this.css(["color", "width", "font", "padding", "text-align", "border-width", "box-sizing"]))
                .css({"line-height": ""}) // IE10 returns invalid line-height for hidden elements
                .on("click", this._clickLabel.bind(this))
                .watch("datetime", invalidatePicker);

            this// hide original input text
                // IE8 doesn't suport color:transparent - use background-color instead
                .css("color", document.addEventListener ? "transparent" : this.css("background-color"))
                // sync picker visibility on focus/blur
                .on(["focus", "click"], this._focusPicker.bind(this, picker))
                .on("blur", this._blurPicker.bind(this, picker))
                .on("change", this._syncValue.bind(this, "value", label))
                .on("keydown", ["which"], this._keydownPicker.bind(this, picker))
                .before(picker.hide(), label)
                .closest("form").on("reset", this._syncValue.bind(this, "defaultValue", label));

            picker
                .watch("aria-expanded", invalidatePicker)
                .on("mousedown", ["target"], this._clickPicker.bind(this, picker, calendarMonths))
                .css("z-index", 1 + (this.css("z-index") | 0));

            calendarCaption
                .on("click", this._clickPickerCaption.bind(this, picker));

            this._syncValue("defaultValue", label); // restore initial value

            // display calendar for autofocused elements
            if (this.matches(":focus")) picker.show();
        },
        _isNative() {
            var polyfillType = this.get("data-polyfill"),
                deviceType = "orientation" in window ? "mobile" : "desktop";

            if (polyfillType === "none") return true;

            if (!polyfillType || polyfillType !== deviceType && polyfillType !== "all") {
                // use a stronger type support detection that handles old WebKit browsers:
                // http://www.quirksmode.org/blog/archives/2015/03/better_modern_i.html
                if (this[0].type === "date") return true;
                // persist current value to restore it later
                this.set("defaultValue", this.value());
                // if browser allows invalid value then it doesn't support the feature
                return this.value("_").value() !== "_";
            } else {
                // remove native control
                this.set("type", "text");
                // force applying the polyfill
                return false;
            }
        },
        _invalidatePicker(caption, calendarMonths, calenderDays, picker) {
            var expanded = picker.get("aria-expanded") === "true";
            var value = new Date(this.value());
            var year, month, date;

          if (isNaN(value.getTime())) {
                value = new Date();
            }

            month = value.getUTCMonth();
            date = value.getUTCDate();
            year = value.getUTCFullYear();

            var range = readDateRange(this);
            var iterDate = new Date(Date.UTC(year, month, 0));

            if (expanded) {
                calendarMonths.findAll("td").forEach((day, index) => {
                    iterDate.setUTCMonth(index);

                    var mDiff = month - iterDate.getUTCMonth(),
                        className = BASE_CLASS;

                    if (iterDate < range[0] || iterDate > range[1]) {
                        className += "-out";
                    } else if (!mDiff) {
                        className += "-today";
                    } else {
                        className = "";
                    }

                    day.set("class", className);
                });
            } else {
                // move to beginning of the first week in current month
                iterDate.setUTCDate(iterDate.getUTCDate() - iterDate.getUTCDay() - ampm(1, 0));
                // update days picker
                calenderDays.findAll("td").forEach((day) => {
                    iterDate.setUTCDate(iterDate.getUTCDate() + 1);

                    var mDiff = month - iterDate.getUTCMonth(),
                        className = BASE_CLASS;

                    if (year !== iterDate.getUTCFullYear()) mDiff *= -1;

                    if (iterDate < range[0] || iterDate > range[1]) {
                        className += "-out";
                    } else if (mDiff > 0) {
                        className += "-past";
                    } else if (mDiff < 0) {
                        className += "-future";
                    } else if (date === iterDate.getUTCDate()) {
                        className += "-today";
                    } else {
                        className = "";
                    }

                    day
                        .set("class", className)
                        .data("ts", iterDate.getTime())
                        .value(iterDate.getUTCDate());
                });
            }

            // update calendar caption
            caption
                .set("data-format", expanded ? "yyyy" : "MMMM yyyy")
                .set("datetime", new Date(year, month).toISOString());
        },
        _syncValue(propName, label) {
            var value = this.get(propName);
            var date = new Date(value);

            this.value(value);

            if (!isNaN(date)) {
                // #72: visible value must adjust timezone offset
                label.set("datetime", new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toISOString());
            } else {
                label.set("datetime", "");
            }
        },
        _clickPicker(picker, calendarMonths, target) {
            var targetDate;

            if (target.matches("a")) {
                targetDate = new Date(this.value());

              if (isNaN(targetDate.getTime())) targetDate = new Date();

                var sign = target.next("a")[0] ? -1 : 1;

                if (picker.get("aria-expanded") === "true") {
                    targetDate.setUTCFullYear(targetDate.getUTCFullYear() + sign);
                } else {
                    targetDate.setUTCMonth(targetDate.getUTCMonth() + sign);
                }
            } else if (calendarMonths.contains(target)) {
                target = target.closest("time");

                targetDate = new Date(this.value());

              if (isNaN(targetDate.getTime())) targetDate = new Date();

                targetDate.setUTCMonth(new Date(target.get("datetime")).getUTCMonth());

                picker.hide();
            } else if (target.matches("td")) {
                targetDate = target.data("ts");

                if (!isNaN(targetDate)) {
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

                this.value(formatISODate(targetDate)).fire("change");
            }
            // prevent input from loosing focus
            return false;
        },
        _keydownPicker(picker, which) {
            var delta, currentDate;
            // ENTER key should submit form if calendar is hidden
            if (picker.matches(":hidden") && which === VK_ENTER) return true;

            if (which === VK_SPACE) {
                // SPACE key toggles calendar visibility
                if (!this.get("readonly")) {
                    picker.set("aria-expanded", "false").toggle();
                }
            } else if (which === VK_ESCAPE || which === VK_TAB || which === VK_ENTER) {
                picker.hide(); // ESC, TAB or ENTER keys hide calendar
            } else if (which === VK_BACKSPACE || which === VK_DELETE) {
                this.value("").fire("change"); // BACKSPACE, DELETE clear value
            } else if (which === VK_CONTROL) {
                // CONTROL toggles calendar mode
                picker.set("aria-expanded",
                    String(picker.get("aria-expanded") !== "true"));
            } else {
                currentDate = new Date(this.value());

              if (isNaN(currentDate.getTime())) currentDate = new Date();

                if (which === 74 || which === 40) { delta = 7; }
                else if (which === 75 || which === 38) { delta = -7; }
                else if (which === 76 || which === 39) { delta = 1; }
                else if (which === 72 || which === 37) { delta = -1; }

                if (delta) {
                    var expanded = picker.get("aria-expanded") === "true";

                    if (expanded && (which === 40 || which === 38)) {
                        currentDate.setUTCMonth(currentDate.getUTCMonth() + (delta > 0 ? 4 : -4));
                    } else if (expanded && (which === 37 || which === 39)) {
                        currentDate.setUTCMonth(currentDate.getUTCMonth() + (delta > 0 ? 1 : -1));
                    } else {
                        currentDate.setUTCDate(currentDate.getUTCDate() + delta);
                    }

                    var range = readDateRange(this);

                    if (!(currentDate < range[0] || currentDate > range[1])) {
                        this.value(formatISODate(currentDate)).fire("change");
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

            var offset = this.offset();
            var pickerOffset = picker.offset();
            var marginTop = offset.height;

            // #3: move calendar to the top when passing cross browser window bounds
            if (HTML.clientHeight < offset.bottom + pickerOffset.height) {
                marginTop = -pickerOffset.height;
            }

            picker
                // always recalculate picker top position
                .css("margin-top", marginTop)
                // always reset picker mode to default
                .set("aria-expanded", "false")
                // display the date picker
                .show();

            // use the trick below to reset text selection on focus
            /* istanbul ignore next */
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
        _clickPickerCaption(picker) {
            picker.set("aria-expanded",
                String(picker.get("aria-expanded") !== "true"));
        },
        _clickLabel() {
            this.fire("focus");
        }
    });
}(window.DOM, 32, 9, 13, 27, 8, 46, 17));
