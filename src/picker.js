import PICKER_CSS from "./picker.css";
import {$, DOCUMENT, HTML, IE, repeat, svgIcon, injectStyles} from "./util.js";
import {parseLocaleDate, formatLocaleDate, localeWeekday, localeMonth, localeMonthYear} from "./intl.js";

export class DatePickerImpl {
    constructor(input, formatOptions) {
        this._input = input;
        this._formatOptions = formatOptions;

        this._initPicker();
    }

    _initPicker() {
        this._picker = DOCUMENT.createElement("dateinput-picker");
        this._picker.setAttribute("aria-hidden", true);
        this._input.parentNode.insertBefore(this._picker, this._input);

        const object = DOCUMENT.createElement("object");
        object.type = "text/html";
        object.width = "100%";
        object.height = "100%";
        // non-IE: must be BEFORE the element added to the document
        if (!IE) {
            object.data = "about:blank";
        }
        // load content when <object> is ready
        object.onload = event => {
            this._initContent(event.target.contentDocument);
            // this is a one time event handler
            delete object.onload;
        };
        // add object element to the document
        this._picker.appendChild(object);
        // IE: must be AFTER the element added to the document
        if (IE) {
            object.data = "about:blank";
        }
    }

    _initContent(pickerRoot) {
        const defaultYearDelta = 30;
        const now = new Date();
        const minDate = this._getLimitationDate("min");
        const maxDate = this._getLimitationDate("max");
        let startYear = minDate ? minDate.getFullYear() : now.getFullYear() - defaultYearDelta;
        let endYear = maxDate ? maxDate.getFullYear() : now.getFullYear() + defaultYearDelta;
        // append picker HTML to shadow dom
        pickerRoot.body.innerHTML = html`
<header>
    <a role="button" rel="prev">${svgIcon("M11.5 14.06L1 8L11.5 1.94z", 16)}</a>
    <time id="caption" aria-live="polite"></time>
    <a role="button" rel="next">${svgIcon("M15 8L4.5 14.06L4.5 1.94z", 16)}</a>
</header>
<table role="grid" aria-labelledby="#caption">
    <thead id="weekdays">${repeat(7, (_, i) => `<th>${localeWeekday(i, this._formatOptions)}</th>`)}</thead>
    <tbody id="days">${repeat(6, `<tr>${repeat(7, "<td>")}</tr>`)}</tbody>
</table>
<div aria-hidden="true" aria-labelledby="#caption">
    <ol id="months">${repeat(12, (_, i) => {
        return `<li data-month="${i}">${localeMonth(i, this._formatOptions)}`;
    })}</ol>
    <ol id="years">${repeat(endYear - startYear + 1, (_, i) => {
        return `<li data-year="${startYear + i}">${startYear + i}`;
    })}</ol>
</div>
        `;

        injectStyles(PICKER_CSS, pickerRoot.head);

        this._caption = $(pickerRoot, "[aria-live=polite]")[0];
        this._pickers = $(pickerRoot, "[aria-labelledby]");

        pickerRoot.addEventListener("mousedown", this._onMouseDown.bind(this));
        pickerRoot.addEventListener("contextmenu", (event) => event.preventDefault());
        pickerRoot.addEventListener("dblclick", (event) => event.preventDefault());

        this.show();
    }

    _getLimitationDate(name) {
        if (this._input) {
            return parseLocaleDate(this._input.getAttribute(name));
        } else {
            return null;
        }
    }

    _onMouseDown(event) {
        const target = event.target;
        // disable default behavior so input doesn't loose focus
        event.preventDefault();
        // skip right/middle mouse button clicks
        if (event.button) return;

        if (target === this._caption) {
            this._togglePickerMode();
        } else if (target.getAttribute("role") === "button") {
            this._clickButton(target);
        } else if (target.hasAttribute("data-date")) {
            this._clickDate(target);
        } else if (target.hasAttribute("data-month") || target.hasAttribute("data-year")) {
            this._clickMonthYear(target);
        }
    }

    _clickButton(target) {
        const captionDate = this.getCaptionDate();
        const sign = target.getAttribute("rel") === "prev" ? -1 : 1;
        const advancedMode = this.isAdvancedMode();
        if (advancedMode) {
            captionDate.setFullYear(captionDate.getFullYear() + sign);
        } else {
            captionDate.setMonth(captionDate.getMonth() + sign);
        }
        if (this.isValidValue(captionDate)) {
            this.render(captionDate);
            if (advancedMode) {
                this._input.valueAsDate = captionDate;
            }
        }
    }

    _clickDate(target) {
        if (target.getAttribute("aria-disabled") !== "true") {
            this._input.value = target.getAttribute("data-date");
            this.hide();

            // Dispatch change event
            if (document.createEvent) {
                const evt = document.createEvent('HTMLEvents');
                evt.initEvent('change', true, false);
                this._input.dispatchEvent(evt)
            }
        }
    }

    _clickMonthYear(target) {
        const month = parseInt(target.getAttribute("data-month"));
        const year = parseInt(target.getAttribute("data-year"));
        if (month >= 0 || year >= 0) {
            const captionDate = this.getCaptionDate();
            if (!isNaN(month)) {
                captionDate.setMonth(month);
            }
            if (!isNaN(year)) {
                captionDate.setFullYear(year);
            }
            if (this.isValidValue(captionDate)) {
                this._renderAdvancedPicker(captionDate, false);
                this._input.valueAsDate = captionDate;
            }
        }
    }

    _togglePickerMode() {
        this._pickers.forEach((element, index) => {
            const currentDate = this._input.valueAsDate || new Date();
            const hidden = element.getAttribute("aria-hidden") === "true";
            if (index === 0) {
                if (hidden) {
                    this._renderCalendarPicker(currentDate);
                }
            } else {
                if (hidden) {
                    this._renderAdvancedPicker(currentDate);
                }
            }
            element.setAttribute("aria-hidden", !hidden);
        });
    }

    _renderCalendarPicker(captionDate) {
        const now = new Date();
        const currentDate = this._input.valueAsDate;
        const minDate = this._getLimitationDate("min");
        const maxDate = this._getLimitationDate("max");
        const iterDate = new Date(captionDate.getFullYear(), captionDate.getMonth());
        // move to beginning of the first week in current month
        iterDate.setDate((this._formatOptions.hour12 ? 0 : iterDate.getDay() === 0 ? -6 : 1) - iterDate.getDay());

        $(this._pickers[0], "td").forEach((cell) => {
            iterDate.setDate(iterDate.getDate() + 1);

            const iterDateStr = formatLocaleDate(iterDate);

            if (iterDate.getMonth() === captionDate.getMonth()) {
                if (currentDate && iterDateStr === formatLocaleDate(currentDate)) {
                    cell.setAttribute("aria-selected", true);
                } else {
                    cell.setAttribute("aria-selected", false);
                }
            } else {
                cell.removeAttribute("aria-selected");
            }

            if (iterDateStr === formatLocaleDate(now)) {
                cell.setAttribute("aria-current", "date");
            } else {
                cell.removeAttribute("aria-current");
            }

            if ((minDate && iterDate < minDate) || (maxDate && iterDate > maxDate)) {
                cell.setAttribute("aria-disabled", true);
            } else {
                cell.removeAttribute("aria-disabled");
            }

            cell.textContent = iterDate.getDate();
            cell.setAttribute("data-date", iterDateStr);
        });
        // update visible caption value
        this.setCaptionDate(captionDate);
    }

    _renderAdvancedPicker(captionDate, syncScroll = true) {
        $(this._pickers[1], "[aria-selected]").forEach((selectedElement) => {
            selectedElement.removeAttribute("aria-selected");
        });

        if (captionDate) {
            const monthItem = $(this._pickers[1], `[data-month="${captionDate.getMonth()}"]`)[0];
            const yearItem = $(this._pickers[1], `[data-year="${captionDate.getFullYear()}"]`)[0];
            monthItem.setAttribute("aria-selected", true);
            yearItem.setAttribute("aria-selected", true);
            if (syncScroll) {
                monthItem.parentNode.scrollTop = monthItem.offsetTop;
                yearItem.parentNode.scrollTop = yearItem.offsetTop;
            }
            // update visible caption value
            this.setCaptionDate(captionDate);
        }
    }

    isValidValue(dateValue) {
        const minDate = this._getLimitationDate("min");
        const maxDate = this._getLimitationDate("max");
        return !((minDate && dateValue < minDate) || (maxDate && dateValue > maxDate));
    }

    isAdvancedMode() {
        return this._pickers[0].getAttribute("aria-hidden") === "true";
    }

    getCaptionDate() {
        return new Date(this._caption.getAttribute("datetime"));
    }

    setCaptionDate(captionDate) {
        this._caption.textContent = localeMonthYear(captionDate, this._formatOptions);
        this._caption.setAttribute("datetime", captionDate.toISOString());
    }

    isHidden() {
        return this._picker.getAttribute("aria-hidden") === "true";
    }

    show() {
        if (this.isHidden()) {
            const startElement = this._input;
            const pickerOffset = this._picker.getBoundingClientRect();
            const inputOffset = startElement.getBoundingClientRect();
            // set picker position depending on current visible area
            let marginTop = inputOffset.height;
            if (HTML.clientHeight < inputOffset.bottom + pickerOffset.height) {
                marginTop = -pickerOffset.height;
            }
            this._picker.style.marginTop = marginTop + "px";

            this._renderCalendarPicker(this._input.valueAsDate || new Date());
            // display picker
            this._picker.removeAttribute("aria-hidden");
        }
    }

    hide() {
        this._picker.setAttribute("aria-hidden", true);
        this.reset();
    }

    reset() {
        this._pickers.forEach((element, index) => {
            element.setAttribute("aria-hidden", !!index);
        });
    }

    render(captionDate) {
        if (this.isAdvancedMode()) {
            this._renderAdvancedPicker(captionDate);
        } else {
            this._renderCalendarPicker(captionDate);
        }
    }
}
