(function(DOM, VK_SPACE, VK_TAB, VK_ENTER, VK_ESCAPE, VK_BACKSPACE, VK_DELETE, VK_CONTROL) {
    "use strict"; /* globals html:false */

    const CLICK_EVENT_TYPE = "orientation" in window ? "touchend" : "mousedown";
    const IE = "ScriptEngineMajorVersion" in window;

    var HTML = DOM.get("documentElement"),
        ampm = (pos, neg) => HTML.lang === "en-US" ? pos : neg,
        formatISODate = (value) => value.toISOString().split("T")[0],
        readDateRange = (el) => ["min", "max"].map((x) => new Date(el.get(x) || ""));

    function repeat(times, fn) {
        if (typeof fn === "string") {
            return Array(times + 1).join(fn);
        } else {
            return Array.apply(null, Array(times)).map(fn).join("");
        }
    }

    function localeWeekday(index) {
        var date = new Date(Date.UTC(ampm(2001, 2002), 0, index));
        try {
            return date.toLocaleDateString(HTML.lang, {weekday: "short"});
        } catch (err) {
            return date.toUTCString().split(",")[0].slice(0, 2).toLowerCase();
        }
    }

    function localeMonth(index) {
        var date = new Date(Date.UTC(2010, index));
        try {
            return date.toLocaleDateString(HTML.lang, {month: "short"});
        } catch (err) {
            return date.toUTCString().split(" ")[2];
        }
    }

    function localeMonthYear(month, year) {
        var date = new Date(year, month);
        try {
            return date.toLocaleDateString(HTML.lang, {month: "long", year: "numeric"});
        } catch (err) {
            return date.toUTCString().split(" ").slice(2, 4).join(" ");
        }
    }

    const SVG_TEMPLATE = DOM.create(html`
<svg xmlns="http://www.w3.org/2000/svg">
    <text dominant-baseline="central" y="50%"></text>
</svg>`);

    const PICKER_TEMPLATE = DOM.create(html`
<dateinput-picker tabindex="-1"></dateinput-picker>`);

    const PICKER_BODY_HTML = html`
<style>
body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    line-height: 2.5rem;
    text-align: center;

    cursor: default;
    user-select: none;

    margin: 0;
    overflow: hidden;
    /* improve font on OSX */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

a {
    width: 3rem;
    height: 2.5rem;
    position: absolute;
    text-decoration: none;
    color: inherit;
}

b {
    display: block;
    cursor: pointer;
}

table {
    width: 100%;
    table-layout: fixed;
    border-spacing: 0;
    border-collapse: collapse;
    text-align: center;
    line-height: 2.5rem;
}

td, th {
    padding: 0;
}

thead {
    background: lightgray;
    font-size: smaller;
    font-weight: bold;
}

[aria-selected=false], [aria-disabled=true] {
    color: graytext;
}

[aria-selected=true] {
    box-shadow: inset 0 0 0 1px graytext;
}

a:hover,
td:hover,
[aria-disabled=true],
[aria-selected=true] {
    background-color: whitesmoke;
}

table+table {
    line-height: 3.75rem; /* var(--cell-height) * 1.5 */
    background: white;
    position: absolute;
    top: 2.5em;
    left: 0;
    opacity: 1;
    transition: 0.1s ease-out;
}

table+table[aria-hidden=true] {
    visibility: hidden;
    opacity: 0;
}
</style>
<a style="left:0">&#x25C4;</a>
<a style="right:0">&#x25BA;</a>
<b></b>
<table>
    <thead>${repeat(7, (_, i) => "<th>" + localeWeekday(i))}</thead>
    <tbody>${repeat(7, `<tr>${repeat(7, "<td>")}</tr>`)}</tbody>
</table>
<table>
    <tbody>${repeat(3, (_, i) => "<tr>" + repeat(4, (_, j) => "<td>" + localeMonth(i * 4 + j)))}</tbody>
</table>`;

    DOM.extend("input[type=date]", {
        constructor() {
            if (this._isNative()) return false;

            const svg = SVG_TEMPLATE.clone(true);
            const offset = ["padding-left", "border-left-width", "text-indent"].map(p => parseFloat(this.css(p))).reduce((a, b) => a + b);

            svg.find("text")
                .css("fill", this.css("color"))
                .css("font", this.css("font"))
                // property x is a read-only SVGAnimatedLengthList object
                // therefore use attribute instead
                [0].setAttribute("x", offset);

            const picker = PICKER_TEMPLATE.clone(true);
            const object = DOM.create("<object>")[0];
            object.type = "text/html";
            object.width = "100%";
            object.height = "100%";
            object.onload = this._initPicker.bind(this, svg, object, picker);
            // non-IE: must be BEFORE the element added to the document
            if (!IE) {
                object.data = "about:blank";
            }

            picker.css("z-index", 1 + (this.css("z-index") | 0));

            this.before(picker.append(DOM.constructor(object)).hide());
            // IE: must be AFTER the element added to the document
            if (IE) {
                object.data = "about:blank";
            }
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
        _initPicker(svg, object, picker) {
            const pickerRoot = DOM.constructor(object.contentDocument);
            const pickerBody = pickerRoot.find("body");
            pickerBody.set(PICKER_BODY_HTML);

            const calendarCaption = pickerBody.find("b");
            const calenderDays = pickerBody.find("table");
            const calendarMonths = pickerBody.find("table+table");
            const invalidatePicker = this._invalidatePicker.bind(this, calendarMonths, calenderDays);
            const resetValue = this._syncValue.bind(this, svg, picker, invalidatePicker, "defaultValue");
            const updateValue = this._syncValue.bind(this, svg, picker, invalidatePicker, "value");
            const toggleState = this._togglePicker.bind(this, picker, invalidatePicker);

            // patch value property for the input element
            const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
            Object.defineProperty(this[0], "value", {
                configurable: false,
                enumerable: true,
                get: valueDescriptor.get,
                set: this._setValue.bind(this, valueDescriptor.set, updateValue)
            });

            // sync picker visibility on focus/blur
            this.on("focus", this._focusPicker.bind(this, picker, toggleState));
            this.on("blur", this._blurPicker.bind(this, picker));
            this.on("change", updateValue);
            this.on("keydown", ["which"], this._keydownPicker.bind(this, picker, toggleState));

            // form events do not trigger any state change
            this.closest("form").on("reset", resetValue);

            // picker invalidate handlers
            calenderDays.on("picker:invalidate", ["detail"],
                this._invalidateDays.bind(this, calenderDays));
            calendarMonths.on("picker:invalidate", ["detail"],
                this._invalidateMonths.bind(this, calendarMonths));
            pickerBody.on("picker:invalidate", ["detail"],
                this._invalidateCaption.bind(this, calendarCaption, picker));

            // picker click handlers
            pickerBody.on(CLICK_EVENT_TYPE, "a", ["target"],
                this._clickPickerButton.bind(this, picker));
            pickerBody.on(CLICK_EVENT_TYPE, "td", ["target"],
                this._clickPickerDay.bind(this, picker, toggleState));
            calendarCaption.on(CLICK_EVENT_TYPE, toggleState);
            // prevent input from loosing the focus outline
            pickerBody.on(CLICK_EVENT_TYPE, () => false);

            this.on(CLICK_EVENT_TYPE,
                this._focusPicker.bind(this, picker, toggleState));

            resetValue(); // present initial value

            // display calendar for autofocused elements
            if (DOM.get("activeElement") === this[0]) {
                picker.show();
            }
        },
        _setValue(setter, updateValue, value) {
            const dateValue = new Date(String(value));
            const range = readDateRange(this);

            if (dateValue < range[0]) {
                value = formatISODate(range[0]);
            } else if (dateValue > range[1]) {
                value = formatISODate(range[1]);
            } else if (isNaN(dateValue.getTime())) {
                value = "";
            }

            setter.call(this[0], value);

            updateValue();
        },
        _invalidatePicker(calendarMonths, calenderDays, expanded, dateValue) {
            if (!dateValue) {
                dateValue = new Date(this.value());
            }

            if (isNaN(dateValue.getTime())) {
                dateValue = new Date();
            }

            const target = expanded ? calendarMonths : calenderDays;
            // refresh current picker
            target.fire("picker:invalidate", dateValue);

            if (expanded) {
                calendarMonths.show();
            } else {
                calendarMonths.hide();
            }
        },
        _invalidateDays(calenderDays, dateValue) {
            const month = dateValue.getUTCMonth();
            const date = dateValue.getUTCDate();
            const year = dateValue.getUTCFullYear();
            const range = readDateRange(this);
            const iterDate = new Date(Date.UTC(year, month, 0));
            // move to beginning of the first week in current month
            iterDate.setUTCDate(iterDate.getUTCDate() - iterDate.getUTCDay() - ampm(1, 0));
            // update days picker
            calenderDays.findAll("td").forEach((day) => {
                iterDate.setUTCDate(iterDate.getUTCDate() + 1);

                var mDiff = month - iterDate.getUTCMonth(),
                    selectedValue = null,
                    disabledValue = null;

                if (year !== iterDate.getUTCFullYear()) mDiff *= -1;

                if (iterDate < range[0] || iterDate > range[1]) {
                    disabledValue = "true";
                } else if (mDiff > 0 || mDiff < 0) {
                    selectedValue = "false";
                } else if (date === iterDate.getUTCDate()) {
                    selectedValue = "true";
                }

                day._ts = iterDate.getTime();
                day.set("aria-selected", selectedValue);
                day.set("aria-disabled", disabledValue);
                day.value(iterDate.getUTCDate());
            });
        },
        _invalidateMonths(calendarMonths, dateValue) {
            const month = dateValue.getUTCMonth();
            const year = dateValue.getUTCFullYear();
            const range = readDateRange(this);
            const iterDate = new Date(Date.UTC(year, month, 1));

            calendarMonths.findAll("td").forEach((day, index) => {
                iterDate.setUTCMonth(index);

                var mDiff = month - iterDate.getUTCMonth(),
                    selectedValue = null;

                if (iterDate < range[0] || iterDate > range[1]) {
                    selectedValue = "false";
                } else if (!mDiff) {
                    selectedValue = "true";
                }

                day._ts = iterDate.getTime();
                day.set("aria-selected", selectedValue);
            });
        },
        _invalidateCaption(calendarCaption, picker, dateValue) {
            const year = dateValue.getUTCFullYear();
            // update calendar caption
            if (picker.get("aria-expanded") === "true") {
                calendarCaption.value(year);
            } else {
                const month = dateValue.getUTCMonth();

                calendarCaption.value(localeMonthYear(month, year));
            }
        },
        _syncValue(svg, picker, invalidatePicker, propName) {
            const dateValue = new Date(this.get(propName));
            var formattedValue = "";
            if (!isNaN(dateValue.getTime())) {
                try {
                    formattedValue = dateValue.toLocaleDateString(HTML.lang, JSON.parse(this.get("data-format")));
                } catch (err) {
                    formattedValue = dateValue.toLocaleDateString(HTML.lang);
                }
            }
            // modify internal element state
            svg.find("text").value(formattedValue);
            // update displayed text
            this.css("background-image", `url('data:image/svg+xml;utf8,${svg.get("outerHTML")}')`);
            // update picker state
            invalidatePicker(picker.get("aria-expanded") === "true", dateValue);
        },
        _clickPickerButton(picker, target) {
            var targetDate = new Date(this.value());

            if (isNaN(targetDate.getTime())) targetDate = new Date();

            var sign = target.next("a")[0] ? -1 : 1;

            if (picker.get("aria-expanded") === "true") {
                targetDate.setUTCFullYear(targetDate.getUTCFullYear() + sign);
            } else {
                targetDate.setUTCMonth(targetDate.getUTCMonth() + sign);
            }

            this.value(formatISODate(targetDate)).fire("change");
        },
        _clickPickerDay(picker, toggleState, target) {
            var targetDate;

            if (picker.get("aria-expanded") === "true") {
                if (isNaN(target._ts)) {
                    targetDate = new Date();
                } else {
                    targetDate = new Date(target._ts);
                }
                // switch to date calendar mode
                toggleState(false);
            } else {
                if (!isNaN(target._ts)) {
                    targetDate = new Date(target._ts);

                    picker.hide();
                }
            }

            if (targetDate != null) {
                this.value(formatISODate(targetDate)).fire("change");
            }
        },
        _togglePicker(picker, invalidatePicker, force) {
            if (typeof force !== "boolean") {
                force = picker.get("aria-expanded") !== "true";
            }

            picker.set("aria-expanded", force);

            invalidatePicker(force);
        },
        _keydownPicker(picker, toggleState, which) {
            if (which === VK_ENTER && picker.get("aria-hidden") === "true") {
                // ENTER key should submit form if calendar is hidden
                return true;
            }

            if (which === VK_SPACE) {
                // SPACE key toggles calendar visibility
                if (!this.get("readonly")) {
                    toggleState(false);

                    if (picker.get("aria-hidden") === "true") {
                        picker.show();
                    } else {
                        picker.hide();
                    }
                }
            } else if (which === VK_ESCAPE || which === VK_TAB || which === VK_ENTER) {
                picker.hide(); // ESC, TAB or ENTER keys hide calendar
            } else if (which === VK_BACKSPACE || which === VK_DELETE) {
                this.value("").fire("change"); // BACKSPACE, DELETE clear value
            } else if (which === VK_CONTROL) {
                // CONTROL toggles calendar mode
                toggleState();
            } else {
                var delta, currentDate = new Date(this.value());

                if (isNaN(currentDate.getTime())) currentDate = new Date();

                if (which === 74 || which === 40) { delta = 7; }
                else if (which === 75 || which === 38) { delta = -7; }
                else if (which === 76 || which === 39) { delta = 1; }
                else if (which === 72 || which === 37) { delta = -1; }

                if (delta) {
                    const expanded = picker.get("aria-expanded") === "true";
                    if (expanded && (which === 40 || which === 38)) {
                        currentDate.setUTCMonth(currentDate.getUTCMonth() + (delta > 0 ? 4 : -4));
                    } else if (expanded && (which === 37 || which === 39)) {
                        currentDate.setUTCMonth(currentDate.getUTCMonth() + (delta > 0 ? 1 : -1));
                    } else {
                        currentDate.setUTCDate(currentDate.getUTCDate() + delta);
                    }

                    this.value(formatISODate(currentDate)).fire("change");
                }
            }
            // prevent default action except if it was TAB so
            // do not allow to change the value manually
            return which === VK_TAB;
        },
        _blurPicker(picker) {
            picker.hide();
        },
        _focusPicker(picker, toggleState) {
            if (this.get("readonly")) return false;

            var offset = this.offset();
            var pickerOffset = picker.offset();
            var marginTop = offset.height;
            // #3: move calendar to the top when passing cross browser window bounds
            if (HTML.clientHeight < offset.bottom + pickerOffset.height) {
                marginTop = -pickerOffset.height;
            }
            // always reset picker mode to the default
            toggleState(false);
            // always recalculate picker top position
            picker.css("margin-top", marginTop).show();
        }
    });
}(window.DOM, 32, 9, 13, 27, 8, 46, 17));
