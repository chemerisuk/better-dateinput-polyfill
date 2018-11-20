/* globals html:false */

import MAIN_CSS from "./main.css";
import PICKER_CSS from "./picker.css";

const HTML = DOM.get("documentElement");
const DEVICE_TYPE = "orientation" in window ? "mobile" : "desktop";
const CLICK_EVENT_TYPE = DEVICE_TYPE === "mobile" ? "touchend" : "mousedown";

const INTL_SUPPORTED = (function() {
    try {
        new Date().toLocaleString("i");
    } catch (err) {
        return err instanceof RangeError;
    }
    return false;
}());

const TYPE_SUPPORTED = (function() {
    // use a stronger type support detection that handles old WebKit browsers:
    // http://www.quirksmode.org/blog/archives/2015/03/better_modern_i.html
    return DOM.create("<input type='date'>").value("_").value() !== "_";
}());

function ampm(pos, neg) {
    return HTML.lang === "en-US" ? pos : neg;
}

function formatLocalDate(date) {
    return [
        date.getFullYear(),
        ("0" + (date.getMonth() + 1)).slice(-2),
        ("0" + date.getDate()).slice(-2)
    ].join("-");
}

function parseLocalDate(value) {
    const valueParts = value.split("-");
    const dateValue = new Date(valueParts[0], valueParts[1] - 1, valueParts[2]);

    return isNaN(dateValue.getTime()) ? null : dateValue;
}

function repeat(times, fn) {
    if (typeof fn === "string") {
        return Array(times + 1).join(fn);
    } else {
        return Array.apply(null, Array(times)).map(fn).join("");
    }
}

function localeWeekday(index) {
    var date = new Date(Date.UTC(ampm(2001, 2002), 0, index));
    if (INTL_SUPPORTED) {
        try {
            return date.toLocaleDateString(HTML.lang, {weekday: "short"});
        } catch (err) {}
    }
    return date.toUTCString().split(",")[0].slice(0, 2);
}

function localeMonth(index) {
    var date = new Date(Date.UTC(2010, index));
    if (INTL_SUPPORTED) {
        try {
            return date.toLocaleDateString(HTML.lang, {month: "short"});
        } catch (err) {}
    }
    return date.toUTCString().split(" ")[2];
}

function localeMonthYear(month, year) {
    // set hours to '12' to fix Safari bug in Date#toLocaleString
    var date = new Date(year, month, 12);
    if (INTL_SUPPORTED) {
        try {
            return date.toLocaleDateString(HTML.lang, {month: "long", year: "numeric"});
        } catch (err) {}
    }
    return date.toUTCString().split(" ").slice(2, 4).join(" ");
}

const PICKER_BODY_HTML = html`
<a style="left:0">&#x25C4;</a>
<a style="right:0">&#x25BA;</a>
<b></b>
<table>
    <thead>${repeat(7, (_, i) => "<th>" + localeWeekday(i))}</thead>
    <tbody>${repeat(7, `<tr>${repeat(7, "<td>")}</tr>`)}</tbody>
</table>
<table>
    <tbody>${repeat(3, (_, i) => "<tr>" + repeat(4, (_, j) => "<td>" + localeMonth(i * 4 + j)))}</tbody>
</table>
`;

DOM.extend("input[type=date]", {
    constructor() {
        if (this._isPolyfillEnabled()) return false;

        this._svgTextOptions = this.css(["color", "font", "padding-left", "border-left-width", "text-indent", "padding-top", "border-top-width"]);
        this._svgTextOptions.dx = ["padding-left", "border-left-width", "text-indent"].map(p => parseFloat(this._svgTextOptions[p])).reduce((a, b) => a + b);
        this._svgTextOptions.dy = ["padding-top", "border-top-width"].map(p => parseFloat(this._svgTextOptions[p])).reduce((a, b) => a + b) / 2;

        const picker = DOM.create("<dateinput-picker tabindex='-1'>");
        // store reference to the input internally
        picker._parentInput = this;
        // add <dateinput-picker> to the document
        this.before(picker.hide());

        const resetValue = this._syncValue.bind(this, picker, "defaultValue");
        const updateValue = this._syncValue.bind(this, picker, "value");

        // patch value property for the input element
        const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        Object.defineProperty(this[0], "value", {
            configurable: false,
            enumerable: true,
            get: valueDescriptor.get,
            set: this._setValue.bind(this, valueDescriptor.set, updateValue)
        });

        Object.defineProperty(this[0], "valueAsDate", {
            configurable: false,
            enumerable: true,
            get: this._getValueAsDate.bind(this),
            set: this._setValueAsDate.bind(this)
        });

        // sync picker visibility on focus/blur
        this.on("change", updateValue);
        this.on("focus", this._focusInput.bind(this, picker));
        this.on("blur", this._blurInput.bind(this, picker));
        this.on("keydown", ["which"], this._keydownInput.bind(this, picker));
        this.on(CLICK_EVENT_TYPE, this._focusInput.bind(this, picker));
        // form events do not trigger any state change
        this.closest("form").on("reset", resetValue);

        resetValue(); // present initial value
    },
    _isPolyfillEnabled() {
        const polyfillType = this.get("data-polyfill");

        if (polyfillType === "none") return true;

        if (polyfillType && (polyfillType === DEVICE_TYPE || polyfillType === "all")) {
            // remove native browser implementation
            this.set("type", "text");
            // force applying the polyfill
            return false;
        }

        return TYPE_SUPPORTED;
    },
    _setValue(setter, updateValue, value) {
        const dateValue = parseLocalDate(value);

        if (!dateValue) {
            value = "";
        } else {
            const min = parseLocalDate(this.get("min")) || Number.MIN_VALUE;
            const max = parseLocalDate(this.get("max")) || Number.MAX_VALUE;

            if (dateValue < min) {
                value = formatLocalDate(min);
            } else if (dateValue > max) {
                value = formatLocalDate(max);
            }
        }

        setter.call(this[0], value);

        updateValue();
    },
    _getValueAsDate() {
        return parseLocalDate(this.value());
    },
    _setValueAsDate(dateValue) {
        if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            this.value(formatLocalDate(dateValue));
        }
    },
    _syncValue(picker, propName) {
        var displayText = this.get(propName);
        const dateValue = parseLocalDate(displayText);
        if (dateValue) {
            if (INTL_SUPPORTED) {
                const formatOptions = this.get("data-format");
                try {
                    // set hours to '12' to fix Safari bug in Date#toLocaleString
                    displayText = new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate(), 12)
                        .toLocaleDateString(HTML.lang, formatOptions ? JSON.parse(formatOptions) : {});
                } catch (err) {}
            }
        }

        this.css("background-image", `url('data:image/svg+xml,${encodeURIComponent(html`
        <svg xmlns="http://www.w3.org/2000/svg">
            <text x="${this._svgTextOptions.dx}" y="50%" dy="${this._svgTextOptions.dy}" fill="${this._svgTextOptions.color}" style="font:${this._svgTextOptions.font}">${displayText}</text>
        </svg>
        `)}')`);

        // update picker state
        if (typeof picker.invalidateState === "function") {
            picker.invalidateState(dateValue);
        }
    },
    _keydownInput(picker, which) {
        if (which === 13 && picker.get("aria-hidden") === "true") {
            // ENTER key should submit form if calendar is hidden
            return true;
        }

        if (which === 32) {
            // SPACE key toggles calendar visibility
            if (!this.get("readonly")) {
                picker.toggleState(false);
                picker.invalidateState(this.get("valueAsDate"));

                if (picker.get("aria-hidden") === "true") {
                    picker.show();
                } else {
                    picker.hide();
                }
            }
        } else if (which === 27 || which === 9 || which === 13) {
            picker.hide(); // ESC, TAB or ENTER keys hide calendar
        } else if (which === 8 || which === 46) {
            this.value("").fire("change"); // BACKSPACE, DELETE clear value
        } else if (which === 17) {
            // CONTROL toggles calendar mode
            picker.toggleState(picker.get("aria-expanded") !== "true");
            picker.invalidateState(this.get("valueAsDate"));
        } else {
            var delta;

            if (which === 74 || which === 40) { delta = 7; }
            else if (which === 75 || which === 38) { delta = -7; }
            else if (which === 76 || which === 39) { delta = 1; }
            else if (which === 72 || which === 37) { delta = -1; }

            if (delta) {
                const currentDate = this.get("valueAsDate") || new Date();
                const expanded = picker.get("aria-expanded") === "true";

                if (expanded && (which === 40 || which === 38)) {
                    currentDate.setMonth(currentDate.getMonth() + (delta > 0 ? 4 : -4));
                } else if (expanded && (which === 37 || which === 39)) {
                    currentDate.setMonth(currentDate.getMonth() + (delta > 0 ? 1 : -1));
                } else {
                    currentDate.setDate(currentDate.getDate() + delta);
                }

                this.value(formatLocalDate(currentDate)).fire("change");
            }
        }
        // prevent default action except if it was TAB so
        // do not allow to change the value manually
        return which === 9;
    },
    _blurInput(picker) {
        picker.hide();
    },
    _focusInput(picker) {
        if (this.get("readonly")) return false;

        var offset = this.offset();
        var pickerOffset = picker.offset();
        var marginTop = offset.height;
        // #3: move calendar to the top when passing cross browser window bounds
        if (HTML.clientHeight < offset.bottom + pickerOffset.height) {
            marginTop = -pickerOffset.height;
        }
        // always reset picker mode to the default
        picker.toggleState(false);
        picker.invalidateState(this.get("valueAsDate"));
        // always recalculate picker top position
        picker.css("margin-top", marginTop).show();
    }
});

DOM.extend("dateinput-picker", {
    constructor() {
        const IE = "ScriptEngineMajorVersion" in window;
        const object = DOM.create("<object type='text/html' width='100%' height='100%'>");
        // non-IE: must be BEFORE the element added to the document
        if (!IE) {
            object.set("data", "about:blank");
        }
        // load content when <object> is ready
        this.on("load", {capture: true, once: true}, ["target"], this._loadContent.bind(this));
        // add object element to the document
        this.append(object);
        // IE: must be AFTER the element added to the document
        if (IE) {
            object.set("data", "about:blank");
        }
    },
    _loadContent(object) {
        const pickerRoot = DOM.constructor(object.get("contentDocument"));
        const pickerBody = pickerRoot.find("body");
        // initialize picker content
        pickerRoot.importStyles(PICKER_CSS);
        pickerBody.set(PICKER_BODY_HTML);
        // internal references
        this._calenderDays = pickerBody.find("table");
        this._calendarMonths = pickerBody.find("table+table");
        this._calendarCaption = pickerBody.find("b");

        // picker invalidate handlers
        this._calenderDays.on("picker:invalidate", ["detail"], this._invalidateDays.bind(this));
        this._calendarMonths.on("picker:invalidate", ["detail"], this._invalidateMonths.bind(this));
        pickerBody.on("picker:invalidate", ["detail"], this._invalidateCaption.bind(this));

        // picker click handlers
        pickerBody.on(CLICK_EVENT_TYPE, "a", ["target"], this._clickPickerButton.bind(this));
        pickerBody.on(CLICK_EVENT_TYPE, "td", ["target"], this._clickPickerDay.bind(this));
        this._calendarCaption.on(CLICK_EVENT_TYPE, this._clickCaption.bind(this));

        // prevent input from loosing the focus outline
        pickerBody.on(CLICK_EVENT_TYPE, () => false);

        // display calendar for autofocused elements
        if (DOM.get("activeElement") === this._parentInput[0]) {
            this.show();
        }
    },
    _invalidateDays(dateValue) {
        const month = dateValue.getMonth();
        const date = dateValue.getDate();
        const year = dateValue.getFullYear();
        const min = parseLocalDate(this._parentInput.get("min")) || Number.MIN_VALUE;
        const max = parseLocalDate(this._parentInput.get("max")) || Number.MAX_VALUE;
        const iterDate = new Date(year, month, 1);
        // move to beginning of the first week in current month
        iterDate.setDate(1 - iterDate.getDay() - ampm(1, 0));
        // update days picker
        this._calenderDays.findAll("td").forEach((day) => {
            iterDate.setDate(iterDate.getDate() + 1);

            var mDiff = month - iterDate.getMonth(),
                selectedValue = null,
                disabledValue = null;

            if (year !== iterDate.getFullYear()) mDiff *= -1;

            if (iterDate < min || iterDate > max) {
                disabledValue = "true";
            } else if (mDiff > 0 || mDiff < 0) {
                selectedValue = "false";
            } else if (date === iterDate.getDate()) {
                selectedValue = "true";
            }

            day._ts = iterDate.getTime();
            day.set("aria-selected", selectedValue);
            day.set("aria-disabled", disabledValue);
            day.value(iterDate.getDate());
        });
    },
    _invalidateMonths(dateValue) {
        const month = dateValue.getMonth();
        const year = dateValue.getFullYear();
        const min = parseLocalDate(this._parentInput.get("min")) || Number.MIN_VALUE;
        const max = parseLocalDate(this._parentInput.get("max")) || Number.MAX_VALUE;
        const iterDate = new Date(year, month, 1);

        this._calendarMonths.findAll("td").forEach((day, index) => {
            iterDate.setMonth(index);

            var mDiff = month - iterDate.getMonth(),
                selectedValue = null;

            if (iterDate < min || iterDate > max) {
                selectedValue = "false";
            } else if (!mDiff) {
                selectedValue = "true";
            }

            day._ts = iterDate.getTime();
            day.set("aria-selected", selectedValue);
        });
    },
    _invalidateCaption(dateValue) {
        var captionText = dateValue.getFullYear();
        if (this.get("aria-expanded") !== "true") {
            captionText = localeMonthYear(dateValue.getMonth(), captionText);
        }
        // update calendar caption
        this._calendarCaption.value(captionText);
    },
    _clickCaption() {
        this.toggleState(this.get("aria-expanded") !== "true");
        this.invalidateState(this._parentInput.get("valueAsDate"));
    },
    _clickPickerButton(target) {
        const sign = target.next("a")[0] ? -1 : 1;
        const targetDate = this._parentInput.get("valueAsDate") || new Date();

        if (this.get("aria-expanded") === "true") {
            targetDate.setFullYear(targetDate.getFullYear() + sign);
        } else {
            targetDate.setMonth(targetDate.getMonth() + sign);
        }

        this._parentInput.value(formatLocalDate(targetDate)).fire("change");
    },
    _clickPickerDay(target) {
        var targetDate;

        if (this.get("aria-expanded") === "true") {
            if (isNaN(target._ts)) {
                targetDate = new Date();
            } else {
                targetDate = new Date(target._ts);
            }
            // switch to date calendar mode
            this.toggleState(false);
        } else {
            if (!isNaN(target._ts)) {
                targetDate = new Date(target._ts);

                this.hide();
            }
        }

        if (targetDate != null) {
            this._parentInput.value(formatLocalDate(targetDate)).fire("change");
        }
    },
    toggleState(expanded) {
        this.set("aria-expanded", expanded);
    },
    invalidateState(dateValue) {
        if (!dateValue || isNaN(dateValue.getTime())) {
            dateValue = new Date();
        }

        const expanded = this.get("aria-expanded") === "true";
        const target = expanded ? this._calendarMonths : this._calenderDays;
        // refresh current picker
        target.fire("picker:invalidate", dateValue);

        if (expanded) {
            this._calendarMonths.show();
        } else {
            this._calendarMonths.hide();
        }
    }
});

DOM.importStyles(MAIN_CSS);
