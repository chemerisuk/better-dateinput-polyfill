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
    const dateValue = new Date(year, month - 1, date, 0, 0);
    return isNaN(dateValue.getTime()) ? null : dateValue;
}

export function formatLocaleDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, -date.getTimezoneOffset())
        .toISOString()
        .split("T")[0];
}

export function getFormatOptions(locale, dateStyle) {
    if (!INTL_SUPPORTED) return {};

    let dateFormat;
    try {
        // We perform severals checks here:
        // 1) verify lang attribute is supported by browser
        // 2) verify format attribute is one from "full","long","medium","short"
        dateFormat = new Intl.DateTimeFormat(locale, dateStyle ? {dateStyle} : {});
    } catch (err) {
        console.warn("Fallback to default date format because of error:", err);
        // fallback to default date format options
        dateFormat = new Intl.DateTimeFormat();
    }
    return dateFormat.resolvedOptions();
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
        return value.toLocaleDateString(options.locale, options);
    } else {
        return value.toUTCString().split(" ").slice(0, 4).join(" ");
    }
}

export function localeMonthYear(value, options) {
    if (INTL_SUPPORTED) {
        return value.toLocaleDateString(options.locale, {month: "long", year: "numeric"});
    } else {
        return value.toUTCString().split(" ").slice(2, 4).join(" ");
    }
}
