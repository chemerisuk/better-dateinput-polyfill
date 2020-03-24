/* globals html:false */

import PICKER_CSS from "./picker.css";

const HTML = DOM.find("html");
const DEFAULT_LANGUAGE = HTML.get("lang") || void 0;
const CLICK_EVENT_TYPE = "orientation" in window ? "touchend" : "mousedown";
const SHADOW_DOM_SUPPORTED = !!HTMLElement.prototype.attachShadow;

const INTL_SUPPORTED = (function() {
    try {
        new Date().toLocaleString("_");
    } catch (err) {
        return err instanceof RangeError;
    }
    return false;
}());

function repeat(times, fn) {
    if (typeof fn === "string") {
        return Array(times + 1).join(fn);
    } else {
        return Array.apply(null, Array(times)).map(fn).join("");
    }
}

function ampm(pos, neg) {
    return DEFAULT_LANGUAGE === "en-US" ? pos : neg;
}

function localeWeekday(index) {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + index + ampm(0, 1));
    /* istanbul ignore else */
    if (INTL_SUPPORTED) {
        try {
            return date.toLocaleDateString(DEFAULT_LANGUAGE, {weekday: "short"});
        } catch (err) {}
    }
    return date.toUTCString().split(",")[0].slice(0, 2);
}

function localeMonth(index) {
    const date = new Date(25e8 * (index + 1));
    /* istanbul ignore else */
    if (INTL_SUPPORTED) {
        try {
            return date.toLocaleDateString(DEFAULT_LANGUAGE, {month: "short"});
        } catch (err) {}
    }
    return date.toUTCString().split(" ")[2];
}

function localeMonthYear(dateValue) {
    // set hours to '12' to fix Safari bug in Date#toLocaleString
    const date = new Date(dateValue.getFullYear(), dateValue.getMonth(), 12);
    /* istanbul ignore else */
    if (INTL_SUPPORTED) {
        try {
            return date.toLocaleDateString(DEFAULT_LANGUAGE, {month: "long", year: "numeric"});
        } catch (err) {}
    }
    return date.toUTCString().split(" ").slice(2, 4).join(" ");
}

const PICKER_BODY_HTML = html`
<a rel="prev"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="100%" viewBox="0 0 16 16"><path d="M11.5 14.06L1 8L11.5 1.94z"/></svg></a>
<a rel="next"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="100%" viewBox="0 0 16 16"><path d="M15 8L4.5 14.06L4.5 1.94z"/></svg></a>
<b></b>
<table>
    <thead>${repeat(7, (_, i) => "<th>" + localeWeekday(i))}</thead>
    <tbody>${repeat(7, `<tr>${repeat(7, "<td>")}</tr>`)}</tbody>
</table>
<table>
    <tbody>${repeat(3, (_, i) => "<tr>" + repeat(4, (_, j) => "<td>" + localeMonth(i * 4 + j)))}</tbody>
</table>
`;

DOM.extend("dateinput-picker", {
    constructor() {
        if (SHADOW_DOM_SUPPORTED) {
            const shadowRoot = this[0].attachShadow({mode: "closed"});
            // use set timeout to make sure _parentInput is set
            setTimeout(() => {
                this._initContent(DOM.constructor(shadowRoot));
            }, 0);
        } else {
            const IE = "ScriptEngineMajorVersion" in window;
            const object = DOM.create("<object type='text/html' width='100%' height='100%'>");
            // non-IE: must be BEFORE the element added to the document
            if (!IE) {
                object.set("data", "about:blank");
            }
            // load content when <object> is ready
            this.on("load", {capture: true, once: true}, ["target"], object => {
                const pickerRoot = DOM.constructor(object.get("contentDocument"));

                this._initContent(pickerRoot.find("body"));
            });
            // add object element to the document
            this.append(object);
            // IE: must be AFTER the element added to the document
            if (IE) {
                object.set("data", "about:blank");
            }
        }
    },
    _initContent(pickerBody) {
        pickerBody.set("<style>" + PICKER_CSS + "</style>" + PICKER_BODY_HTML);
        // internal references
        this._calendarDays = pickerBody.find("table");
        this._calendarMonths = pickerBody.find("table+table");
        this._calendarCaption = pickerBody.find("b");
        // picker invalidate handlers
        this._calendarDays.on("picker:invalidate", ["detail"], this._invalidateDays.bind(this));
        this._calendarMonths.on("picker:invalidate", ["detail"], this._invalidateMonths.bind(this));
        pickerBody.on("picker:invalidate", ["detail"], this._invalidateCaption.bind(this));
        // picker click handlers
        pickerBody.on(CLICK_EVENT_TYPE, "a", ["currentTarget"], this._clickPickerButton.bind(this));
        pickerBody.on(CLICK_EVENT_TYPE, "td", ["target"], this._clickPickerDay.bind(this));
        this._calendarCaption.on(CLICK_EVENT_TYPE, this._clickCaption.bind(this));
        // prevent input from loosing the focus outline
        pickerBody.on(CLICK_EVENT_TYPE, () => false);
        this._parentInput.on("change", this.invalidateState.bind(this));
        // display calendar for autofocused elements
        if (DOM.get("activeElement") === this._parentInput[0]) {
            this.show();
        }
    },
    _invalidateDays(dateValue) {
        const month = dateValue.getMonth();
        const date = dateValue.getDate();
        const year = dateValue.getFullYear();
        const min = new Date((this._parentInput.get("min") || "?") + "T00:00");
        const max = new Date((this._parentInput.get("max") || "?") + "T00:00");
        const iterDate = new Date(year, month, 1);
        // move to beginning of the first week in current month
        iterDate.setDate(1 - iterDate.getDay() - ampm(1, iterDate.getDay() === 0 ? 7 : 0));
        // update days picker
        this._calendarDays.findAll("td").forEach((day) => {
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
        const min = new Date((this._parentInput.get("min") || "?") + "T00:00");
        const max = new Date((this._parentInput.get("max") || "?") + "T00:00");
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
            captionText = localeMonthYear(dateValue);
        }
        // update calendar caption
        this._calendarCaption.value(captionText);
    },
    _clickCaption() {
        this.toggleState();
        this.invalidateState();
    },
    _clickPickerButton(btn) {
        const sign = btn.get("rel") === "next" ? 1 : -1;
        const targetDate = this._parentInput.get("valueAsDate") || new Date();

        if (this.get("aria-expanded") === "true") {
            targetDate.setFullYear(targetDate.getFullYear() + sign);
        } else {
            targetDate.setMonth(targetDate.getMonth() + sign);
        }

        this._parentInput.set("valueAsDate", targetDate).fire("change");
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
            this._parentInput.set("valueAsDate", targetDate).fire("change");
        }
    },
    toggleState(expanded) {
        if (typeof expanded !== "boolean") {
            expanded = this.get("aria-expanded") !== "true";
        }

        this.set("aria-expanded", expanded);
    },
    invalidateState() {
        const expanded = this.get("aria-expanded") === "true";
        const target = expanded ? this._calendarMonths : this._calendarDays;
        const dateValue = this._parentInput.get("valueAsDate") || new Date();
        // refresh current picker
        target.fire("picker:invalidate", dateValue);

        if (expanded) {
            this._calendarMonths.show();
        } else {
            this._calendarMonths.hide();
        }
    }
});
