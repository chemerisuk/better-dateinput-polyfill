/* globals html:false */

import MAIN_CSS from "./main.css";

const HTML = DOM.find("html");
const DEFAULT_LANGUAGE = HTML.get("lang") || void 0;
const DEVICE_TYPE = "orientation" in window ? "mobile" : "desktop";

const TYPE_SUPPORTED = (function() {
    // use a stronger type support detection that handles old WebKit browsers:
    // http://www.quirksmode.org/blog/archives/2015/03/better_modern_i.html
    return DOM.create("<input type='date'>").value("_").value() !== "_";
}());

function formatLocalDate(date) {
    return [
        date.getFullYear(),
        ("0" + (date.getMonth() + 1)).slice(-2),
        ("0" + date.getDate()).slice(-2)
    ].join("-");
}

function parseLocalDate(value) {
    // datetime value parsed with local timezone
    const dateValue = new Date((value || "?") + "T00:00");
    return isNaN(dateValue.getTime()) ? null : dateValue;
}

const globalFormatters = DOM.findAll("meta[name^='data-format:']").reduce((globalFormatters, meta) => {
    const key = meta.get("name").split(":")[1].trim();
    const formatOptions = JSON.parse(meta.get("content"));
    if (key) {
        try {
            globalFormatters[key] = new window.Intl.DateTimeFormat(DEFAULT_LANGUAGE, formatOptions);
        } catch(err) {}
    }
    return globalFormatters;
}, {});

DOM.extend("input[type=date]", {
    constructor() {
        if (this._isPolyfillEnabled()) return false;

        const svgTextOptions = this.css(["color", "font-size", "font-family", "font-style", "line-height", "padding-left", "border-left-width", "text-indent"]);
        svgTextOptions.dx = ["padding-left", "border-left-width", "text-indent"].map(p => parseFloat(svgTextOptions[p])).reduce((a, b) => a + b);
        svgTextOptions.css = ["font-family", "font-style", "line-height", "font-size"].map(p => p + ":" + svgTextOptions[p]).join(";").replace(/"/g, "");

        // FIXME: fix issue in html helper and drop replace below
        this._backgroundTemplate = html`
        <svg xmlns="http://www.w3.org/2000/svg">
            <text x="${svgTextOptions.dx}" y="50%" dy=".35em" fill="${svgTextOptions.color}"></text>
        </svg>
        `.replace("></", ` style="${svgTextOptions.css}"></`);

        const picker = DOM.create("<dateinput-picker tabindex='-1'>");
        // store reference to the input
        picker._parentInput = this;
        // add <dateinput-picker> to the document
        this.before(picker.hide());
        // store reference to the picker
        this._picker = picker;

        const resetDisplayedText = this._syncDisplayedText.bind(this, "defaultValue");
        const updateDisplayedText = this._syncDisplayedText.bind(this, "value");

        // patch value property for the input element
        const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        Object.defineProperty(this[0], "value", {
            configurable: false,
            enumerable: true,
            get: valueDescriptor.get,
            set: this._setValue.bind(this, valueDescriptor.set, updateDisplayedText)
        });

        Object.defineProperty(this[0], "valueAsDate", {
            configurable: false,
            enumerable: true,
            get: this._getValueAsDate.bind(this),
            set: this._setValueAsDate.bind(this)
        });

        // sync picker visibility on focus/blur
        this.on("change", updateDisplayedText);
        this.on("focus", this._focusInput.bind(this));
        this.on("blur", this._blurInput.bind(this));
        this.on("keydown", ["which"], this._keydownInput.bind(this));
        this.on("click", this._focusInput.bind(this));
        // form events do not trigger any state change
        this.closest("form").on("reset", resetDisplayedText);

        resetDisplayedText(); // present initial value
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
    _setValue(setter, updateDisplayedText, value) {
        const dateValue = parseLocalDate(value);

        if (!dateValue) {
            value = "";
        } else {
            const min = new Date((this.get("min") || "?") + "T00:00");
            const max = new Date((this.get("max") || "?") + "T00:00");

            if (dateValue < min) {
                value = formatLocalDate(min);
            } else if (dateValue > max) {
                value = formatLocalDate(max);
            }
        }

        setter.call(this[0], value);

        updateDisplayedText();
    },
    _getValueAsDate() {
        return parseLocalDate(this.value());
    },
    _setValueAsDate(dateValue) {
        if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            this.value(formatLocalDate(dateValue));
        }
    },
    _syncDisplayedText(propName) {
        var displayText = this.get(propName);
        const dateValue = parseLocalDate(displayText);
        if (dateValue) {
            const formatOptions = this.get("data-format");
            const formatter = globalFormatters[formatOptions];
            try {
                // set hours to '12' to fix Safari bug in Date#toLocaleString
                const presentedDate = new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate(), 12);
                if (formatter) {
                    displayText = formatter.format(presentedDate);
                } else {
                    displayText = presentedDate.toLocaleDateString(DEFAULT_LANGUAGE, formatOptions ? JSON.parse(formatOptions) : {});
                }
            } catch (err) {}
        }

        this.css("background-image", `url('data:image/svg+xml,${encodeURIComponent(this._backgroundTemplate.replace("></", `>${displayText}</`))}')`);
    },
    _keydownInput(which) {
        if (which === 13 && this._picker.get("aria-hidden") === "true") {
            // ENTER key should submit form if calendar is hidden
            return true;
        }

        if (which === 32) {
            // SPACE key toggles calendar visibility
            if (!this.get("readonly")) {
                this._picker.toggleState(false);
                this._picker.invalidateState();

                if (this._picker.get("aria-hidden") === "true") {
                    this._picker.show();
                } else {
                    this._picker.hide();
                }
            }
        } else if (which === 27 || which === 9 || which === 13) {
            this._picker.hide(); // ESC, TAB or ENTER keys hide calendar
        } else if (which === 8 || which === 46) {
            this.empty().fire("change"); // BACKSPACE, DELETE clear value
        } else if (which === 17) {
            // CONTROL toggles calendar mode
            this._picker.toggleState();
            this._picker.invalidateState();
        } else {
            var delta;

            if (which === 74 || which === 40) { delta = 7; }
            else if (which === 75 || which === 38) { delta = -7; }
            else if (which === 76 || which === 39) { delta = 1; }
            else if (which === 72 || which === 37) { delta = -1; }

            if (delta) {
                const currentDate = this.get("valueAsDate") || new Date();
                const expanded = this._picker.get("aria-expanded") === "true";

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
    _blurInput() {
        this._picker.hide();
    },
    _focusInput() {
        if (this.get("readonly")) return false;

        var offset = this.offset();
        var pickerOffset = this._picker.offset();
        var marginTop = offset.height;
        // #3: move calendar to the top when passing cross browser window bounds
        if (HTML.get("clientHeight") < offset.bottom + pickerOffset.height) {
            marginTop = -pickerOffset.height;
        }
        // always reset picker mode to the default
        this._picker.toggleState(false);
        this._picker.invalidateState();
        // always recalculate picker top position
        this._picker.css("margin-top", marginTop).show();
    }
});

DOM.importStyles(MAIN_CSS);
