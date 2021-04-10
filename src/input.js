import {DatePickerImpl} from "./picker.js";
import {parseLocaleDate, formatLocaleDate} from "./util.js";

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
        // patch value property
        Object.defineProperty(this._input, "value", {
            configurable: false,
            enumerable: true,
            get: this._getValue.bind(this),
            set: this._setValue.bind(this, valueDescriptor.set)
        });
        // patch valueAsDate property
        Object.defineProperty(this._input, "valueAsDate", {
            configurable: false,
            enumerable: true,
            get: this._getDate.bind(this),
            set: this._setDate.bind(this, valueDescriptor.set)
        });

        this._input.type = "text";
        // do not popup keyboard on mobile devices
        this._input.setAttribute("inputmode", "none");
        // need to set readonly attribute as well to prevent
        // visible date modification with the cut feature
        this._input.readOnly = true;
        // update visible value in text input
        this._input.value = this._getValue();
    }

    _getValue() {
        return this._valueInput.value;
    }

    _setValue(setter, stringValue) {
        const dateValue = parseLocaleDate(stringValue);
        if (dateValue) {
            this._setDate(setter, dateValue);
        }
    }

    _getDate() {
        return parseLocaleDate(this._getValue());
    }

    _setDate(setter, dateValue) {
        const displayValue = dateValue
            .toLocaleString(this._formatOptions.locale, this._formatOptions);
        setter.call(this._input, displayValue || "");
        setter.call(this._valueInput, formatLocaleDate(dateValue) || "");
    }

    _createValueInput(input) {
        const valueInput = document.createElement("input");
        valueInput.hidden = true;
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
        const lang = this._input.lang || document.documentElement.lang;
        const dateStyle = this._input.getAttribute("data-format");
        let dateFormat;
        try {
            // We perform severals checks here:
            // 1) verify lang attribute is supported by browser
            // 2) verify format attribute is one from "full","long","medium","short"
            dateFormat = new Intl.DateTimeFormat(lang, dateStyle ? {dateStyle} : {});
        } catch (err) {
            console.warn("Fallback to default date format because of error:", err);
            // fallback to default date format options
            dateFormat = new Intl.DateTimeFormat();
        }
        return dateFormat.resolvedOptions();
    }

    _onKeydown(event) {
        const key = event.key;

        if (key === 'Enter') {
            this._hidePicker();
        } else if (key === ' ') {
            // disable scroll change
            event.preventDefault();

            this._showPicker();
        } else if (key.includes('Arrow')) {
            // disable scroll change via arrows
            event.preventDefault();

            let offset = 0;
            if (key === 'ArrowDown') {
                offset = 7;
            } else if (key === 'ArrowUp') {
                offset = -7;
            } else if (key === 'ArrowLeft') {
                offset = -1;
            } else if (key === 'ArrowRight') {
                offset = 1;
            }
            if (!offset) return;

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
        } else if (key === 'Backspace') {
            this._input.value = "";
            this._pickerApi.reset();
            this._pickerApi.render(new Date());
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
