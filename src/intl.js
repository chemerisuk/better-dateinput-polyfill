const INTL_SUPPORTED = (function() {
    try {
        new Date().toLocaleString("_");
    } catch (err) {
        return err instanceof RangeError;
    }
    return false;
}());

export function parseLocaleDate(value) {
    const [year, month, date] = (value || "?").split(/\D/).map((s) => parseInt(s));
    // set hours to 12 because otherwise Safari doesn't return
    // correct result string for toLocaleString calls
    const dateValue = new Date(year, month - 1, date, 12, 0);
    return isNaN(dateValue.getTime()) ? null : dateValue;
}

export function formatLocaleDate(date) {
    return [
        date.getFullYear(),
        ("0" + (date.getMonth() + 1)).slice(-2),
        ("0" + date.getDate()).slice(-2)
    ].join("-");
}

export function getFormatOptions(locale, formatString) {
    if (!INTL_SUPPORTED) return {};

    let dateTimeFormat;
    try {
        // We perform severals checks here:
        // 1) verify lang attribute is supported by browser
        // 2) verify format options are valid
        dateTimeFormat = new Intl.DateTimeFormat(locale, JSON.parse(formatString || "{}"));
    } catch (err) {
        console.warn("Fallback to default date format because of error:", err);
        // fallback to default date format options
        dateTimeFormat = new Intl.DateTimeFormat();
    }
    return dateTimeFormat.resolvedOptions();
}

export function localeWeekday(value, options) {
    const date = new Date(1971, 1, value + (options.hour12 ? 0 : 1));
    /* istanbul ignore else */
    if (INTL_SUPPORTED) {
        return date.toLocaleString(options.locale, {weekday: "short"});
    } else {
        return date.toUTCString().split(",")[0].slice(0, 2);
    }
}

export function localeMonth(value, options) {
    const date = new Date(25e8 * (value + 1));
    /* istanbul ignore else */
    if (INTL_SUPPORTED) {
        return date.toLocaleString(options.locale, {month: "short"});
    } else {
        return date.toUTCString().split(" ")[2];
    }
}

export function localeDate(value, options) {
    if (INTL_SUPPORTED) {
        return value.toLocaleString(options.locale, options);
    } else {
        return value.toUTCString().split(" ").slice(0, 4).join(" ");
    }
}

export function localeMonthYear(value, options) {
    if (INTL_SUPPORTED) {
        return value.toLocaleString(options.locale, {month: "long", year: "numeric"});
    } else {
        return value.toUTCString().split(" ").slice(2, 4).join(" ");
    }
}
