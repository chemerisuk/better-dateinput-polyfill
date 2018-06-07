(function(DOM, VK_SPACE, VK_TAB, VK_ENTER, VK_ESCAPE, VK_BACKSPACE, VK_DELETE, VK_CONTROL, PICKER_CSS) {
    "use strict"; /* globals html:false */

    var repeat = (times, str) => Array(times + 1).join(str);

    var HTML = DOM.get("documentElement"),
        ampm = (pos, neg) => HTML.lang === "en_US" ? pos : neg,
        formatISODate = (value) => value.toISOString().split("T")[0],
        readDateRange = (el) => ["min", "max"].map((x) => new Date(el.get(x) || ""));

    const CONTEXT_TEMPLATE = DOM.create(html`
<div tabindex="-1" class="btr-dateinput-picker">
    <object data="about:blank" type="text/html" width="100%" height="100%">
    </object>
</div>`);

    const PICKER_TEMPLATE = DOM.create(html`
<div>
    <style>${PICKER_CSS}</style>
    <a unselectable="on" style="left:0">&#x25C4;</a>
    <a unselectable="on" style="right:0">&#x25BA;</a>
    <b aria-hidden="true" style="display:block"></b>
    <table aria-hidden="true">
        <thead>${repeat(7, `<th>`)}</thead>
        <tbody>${repeat(7, `<tr>${repeat(7, "<td>")}</tr>`)}</tbody>
    </table>
    <table aria-hidden="true">
        <tbody>${repeat(3, `<tr>${repeat(4, `<td>`)}`)}</tbody>
    </table>
</div>`);

    PICKER_TEMPLATE.findAll("th").forEach((th, index) => {
        var date = new Date(Date.UTC(ampm(2001, 2002), 0, index));
        var formattedValue;
        try {
            formattedValue = date.toLocaleDateString(HTML.lang, {weekday: "short"});
        } catch (err) {
            formattedValue = date.toUTCString().split(",")[0].slice(0, 2).toLowerCase();
        }

        th.value(formattedValue);
    });

    PICKER_TEMPLATE.findAll("table+table td").forEach((td, index) => {
        var date = new Date(Date.UTC(2010, index));
        var formattedValue;
        try {
            formattedValue = date.toLocaleDateString(HTML.lang, {month: "short"});
        } catch (err) {
            formattedValue = date.toUTCString().split(" ")[2];
        }

        td.value(formattedValue);
    });

    DOM.extend("input[type=date]", {
        constructor() {
            if (this._isNative()) return false;

            const color = this.css("color");
            const offset = ["padding-left", "border-left-width", "text-indent"].map(p => parseFloat(this.css(p))).reduce((a, b) => a + b);
            const font = ["font-style", "font-size", "/", "line-height", "font-family"].map(p => p === "/" ? p : this.css(p)).join(" ");
            this._wrap = (value) => `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><text x='${offset}' y='50%' dominant-baseline='central' style='font:${font};fill:${color}' >${value}</text></svg>")`;

            const picker = CONTEXT_TEMPLATE.clone(true);
            const object = picker.get("firstChild");
            object.onload = this._initPicker.bind(this, object, picker);

            picker.css("z-index", 1 + (this.css("z-index") | 0));

            this.before(picker.hide());
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
        _initPicker(object, picker) {
            const pickerRoot = DOM.constructor(object.contentDocument);
            const pickerBody = PICKER_TEMPLATE.clone(true);
            const calenderDays = pickerBody.find("tbody");
            const calendarMonths = pickerBody.find("table+table");
            const calendarCaption = pickerBody.find("b");
            const invalidatePicker = this._invalidatePicker.bind(this, calendarCaption, calendarMonths, calenderDays, picker);

            pickerRoot.find("body").append(pickerBody);

            this
                // sync picker visibility on focus/blur
                .on(["focus", "click"], this._focusPicker.bind(this, picker, pickerBody))
                .on("blur", this._blurPicker.bind(this, picker))
                .on("change", this._syncValue.bind(this, invalidatePicker, "value"))
                .on("keydown", ["which"], this._keydownPicker.bind(this, picker))
                .closest("form").on("reset", this._syncValue.bind(this, invalidatePicker, "defaultValue"));

            pickerBody
                .watch("aria-expanded", invalidatePicker)
                .on("mousedown", ["target"], this._clickPicker.bind(this, picker, calendarMonths));

            calendarCaption
                .on("click", this._clickPickerCaption.bind(this, pickerBody, picker));

            this._syncValue(invalidatePicker, "defaultValue"); // restore initial value
            // display calendar for autofocused elements
            if (this.matches(":focus")) picker.show();
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
            var iterDate = new Date(Date.UTC(year, month, expanded ? 1 : 0));

            if (expanded) {
                calendarMonths.findAll("td").forEach((day, index) => {
                    iterDate.setUTCMonth(index);

                    var mDiff = month - iterDate.getUTCMonth(),
                        selectedValue = "";

                    if (iterDate < range[0] || iterDate > range[1]) {
                        selectedValue = "false";
                    } else if (!mDiff) {
                        selectedValue = "true";
                    }

                    day.set("aria-selected", selectedValue);
                });
            } else {
                // move to beginning of the first week in current month
                iterDate.setUTCDate(iterDate.getUTCDate() - iterDate.getUTCDay() - ampm(1, 0));
                // update days picker
                calenderDays.findAll("td").forEach((day) => {
                    iterDate.setUTCDate(iterDate.getUTCDate() + 1);

                    var mDiff = month - iterDate.getUTCMonth(),
                        selectedValue = "",
                        disabledValue = "";

                    if (year !== iterDate.getUTCFullYear()) mDiff *= -1;

                    if (iterDate < range[0] || iterDate > range[1]) {
                        disabledValue = "true";
                    } else if (mDiff > 0) {
                        selectedValue = "false";
                    } else if (mDiff < 0) {
                        selectedValue = "false";
                    } else if (date === iterDate.getUTCDate()) {
                        selectedValue = "true";
                    }

                    day
                        .set("aria-selected", selectedValue)
                        .set("aria-disabled", disabledValue)
                        .data("ts", iterDate.getTime())
                        .value(iterDate.getUTCDate());
                });
            }

            // update calendar caption
            var formattedValue = year;
            if (!expanded) {
                var d = new Date(year, month);
                try {
                    formattedValue = d.toLocaleDateString(HTML.lang, {month: "long", year: "numeric"});
                } catch (err) {
                    formattedValue = d.toUTCString().split(" ").slice(2, 4).join(" ");
                }
            }

            caption.value(formattedValue);
        },
        _syncValue(invalidatePicker, propName) {
            const date = new Date(this.get(propName));
            var formattedValue = "";
            if (!isNaN(date)) {
                const formatOptions = this.get("data-format");
                try {
                    formattedValue = date.toLocaleDateString(HTML.lang, JSON.parse(formatOptions));
                } catch (err) {
                    formattedValue = date.toLocaleDateString();
                }
            }

            this.css("background-image", this._wrap(formattedValue));

            invalidatePicker();
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
        _focusPicker(picker, pickerBody) {
            if (this.get("readonly")) return false;

            var offset = this.offset();
            var pickerOffset = picker.offset();
            var marginTop = offset.height;

            // #3: move calendar to the top when passing cross browser window bounds
            if (HTML.clientHeight < offset.bottom + pickerOffset.height) {
                marginTop = -pickerOffset.height;
            }

            pickerBody.set("aria-expanded", "false");

            picker
                // always recalculate picker top position
                .css("margin-top", marginTop)
                // always reset picker mode to default
                .set("aria-expanded", "false")
                // display the date picker
                .show();
        },
        _clickPickerCaption(pickerBody, picker) {
            const value = String(picker.get("aria-expanded") !== "true");
            picker.set("aria-expanded", value);
            pickerBody.set("aria-expanded", value);
        }
    });
}(window.DOM, 32, 9, 13, 27, 8, 46, 17, `
body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 0.85em;
    line-height: 2.5em;
    text-align: center;
    cursor: default;

    margin: 0;
    overflow: hidden;
    /* improve font on OSX */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

a {
    width: 2.5em;
    height: 2.5em;
    position: absolute;
    color: inherit;
    display: block;
    text-decoration: none;
}

table {
    width: 100%;
    table-layout: fixed;
    border-spacing: 0;
    border-collapse: collapse;
}

thead {
    border-top: 1px solid #EEE;
    border-bottom: 1px solid graytext;
    font-size: 0.85em;
    background: #DDD;
    font-weight: bold;
}

td, th {
    width: 2.5em;
    height: 2.25em;
    line-height: 2.25;
    padding: 0;
    text-align: center;
}

[aria-selected=false], [aria-disabled=true] {
    color: graytext;
}

[aria-selected=true] {
    font-weight: bold;
}

a:hover, td:hover, [aria-selected=true]:hover, [aria-disabled=true], [aria-selected=true] {
    background-color: rgba(0,0,0,0.05);
}

table+table {
    position: absolute;
    top: 2.25em;
    left: 0;
    visibility: hidden;
    background: white;
}

table+table td {
    line-height: 4;
    height: 4em;
}

[aria-expanded=true] table+table {
    visibility: inherit;
}`));
