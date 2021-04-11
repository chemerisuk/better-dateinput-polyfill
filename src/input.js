import {DatePickerImpl} from "./picker.js";
import {$, DOCUMENT} from "./util.js";
import {parseLocaleDate, formatLocaleDate, getFormatOptions, localeDate} from "./intl.js";

const formatMeta = $(DOCUMENT, "meta[name=dateinput-polyfill-format]")[0];

export class DateInputPolyfill {
    constructor(input) {
        this._input = input;
        this._valueInput = this._createValueInput(input);
        this._formatOptions = this._createFormatOptions();

        this._input.addEventListener("focus", this._showPicker.bind(this));
        this._input.addEventListener("click", this._showPicker.bind(this));
        this._input.addEventListener("blur", this._hidePicker.bind(this));
        this._input.addEventListener("keydown", this._onKeydown.bind(this));

        this._initInput();
    }

    _initInput() {
        const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        // redefine value property for input
        Object.defineProperty(this._input, "value", {
            configurable: false,
            enumerable: true,
            get: this._getValue.bind(this),
            set: this._setValue.bind(this, valueDescriptor.set)
        });
        // redefine valueAsDate property for input
        Object.defineProperty(this._input, "valueAsDate", {
            configurable: false,
            enumerable: true,
            get: this._getDate.bind(this),
            set: this._setDate.bind(this, valueDescriptor.set)
        });
        // change input type to remove built-in picker
        this._input.type = "text";
        // do not popup keyboard on mobile devices
        this._input.setAttribute("inputmode", "none");
        // need to set readonly attribute as well to prevent
        // visible date modification with the cut feature
        this._input.readOnly = true;
        // update visible value in text input
        this._input.value = this._getValue();
        // update default visible value to formatted date
        this._input.defaultValue = valueDescriptor.get.call(this._input);
    }

    _getValue() {
        return this._valueInput.value;
    }

    _setValue(setter, stringValue) {
        this._setDate(setter, parseLocaleDate(stringValue));
    }

    _getDate() {
        return parseLocaleDate(this._getValue());
    }

    _setDate(setter, dateValue) {
        setter.call(this._input, dateValue && localeDate(dateValue, this._formatOptions) || "");
        setter.call(this._valueInput, dateValue && formatLocaleDate(dateValue) || "");
    }

    _createValueInput(input) {
        const valueInput = DOCUMENT.createElement("input");
        valueInput.style.display = "none";
        valueInput.setAttribute("hidden", "");
        valueInput.disabled = input.disabled;
        if (input.name) {
            valueInput.name = input.name;
            input.removeAttribute("name");
        }
        if (input.value) {
            valueInput.value = valueInput.defaultValue = input.value;
        }
        if (input.hasAttribute("form")) {
            valueInput.setAttribute("form", input.getAttribute("form"));
        }
        return input.parentNode.insertBefore(valueInput, input.nextSibling);
    }

    _createFormatOptions() {
        const locale = this._input.lang || DOCUMENT.documentElement.lang;
        let formatString = this._input.getAttribute("data-format");
        if (!formatString && formatMeta) {
            formatString = formatMeta.content;
        }
        return getFormatOptions(locale, formatString);
    }

    _onKeydown(event) {
        const key = event.key;
        if (key === "Enter") {
            if (!this._pickerApi.isHidden()) {
                event.preventDefault();
                this._hidePicker();
            }
        } else if (key === " ") {
            // disable scroll change
            event.preventDefault();

            this._showPicker();
        } else if (key === "Backspace") {
            // prevent browser back navigation
            event.preventDefault();

            this._input.value = "";
            this._pickerApi.reset();
            this._pickerApi.render(new Date());
        } else {
            let offset = 0;
            if (key === "ArrowDown" || key === "Down") {
                offset = 7;
            } else if (key === "ArrowUp" || key === "Up") {
                offset = -7;
            } else if (key === "ArrowLeft" || key === "Left") {
                offset = -1;
            } else if (key === "ArrowRight" || key === "Right") {
                offset = 1;
            }
            if (!offset) return;
            // disable scroll change on arrows
            event.preventDefault();

            const captionDate = this._pickerApi.getCaptionDate();
            if (this._pickerApi.isAdvancedMode()) {
                if (Math.abs(offset) === 7) {
                    captionDate.setMonth(captionDate.getMonth() + offset / 7);
                } else {
                    captionDate.setFullYear(captionDate.getFullYear() + offset);
                }
            } else {
                captionDate.setDate(captionDate.getDate() + offset);
            }
            if (this._pickerApi.isValidValue(captionDate)) {
                this._input.valueAsDate = captionDate;
                this._pickerApi.render(captionDate);
            }
        }
    }

    _showPicker() {
        if (!this._pickerApi) {
            this._pickerApi = new DatePickerImpl(this._input, this._formatOptions);
        } else {
            this._pickerApi.show();
        }
    }

    _hidePicker() {
        this._pickerApi.hide();
    }
}
