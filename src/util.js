const INTL_SUPPORTED = (function() {
    try {
        new Date().toLocaleString("_");
    } catch (err) {
        return err instanceof RangeError;
    }
    return false;
}());

export function parseLocaleDate(value) {
    const [year, month, date] = (value || '?').split(/\D/).map((s) => parseInt(s));
    const dateValue = new Date(year, month - 1, date, 0, 0);
    return isNaN(dateValue.getTime()) ? null : dateValue;
}

export function formatLocaleDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, -date.getTimezoneOffset())
        .toISOString()
        .split('T')[0];
}

export function repeat(times, fn) {
    // if (typeof fn === "string") {
    //     return Array(times + 1).join(fn);
    // } else {
    //     return Array.apply(null, Array(times)).map(fn).join("");
    // }

    return Array.from(Array(times).keys()).map(fn).join('');
}

export function localeWeekday(value, options) {
    const date = new Date(1971, 1, value + (options.hour12 ? 0 : 1));
    /* istanbul ignore else */
    if (INTL_SUPPORTED) {
        try {
            return date.toLocaleString(options.locale, {weekday: "short"});
        } catch (err) {}
    }
    return date.toUTCString().split(",")[0].slice(0, 2);
}

export function localeMonth(value, options) {
    const date = new Date(25e8 * (value + 1));
    /* istanbul ignore else */
    if (INTL_SUPPORTED) {
        try {
            return date.toLocaleString(options.locale, {month: "short"});
        } catch (err) {}
    }
    return date.toUTCString().split(" ")[2];
}
