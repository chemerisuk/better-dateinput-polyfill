export const IE = "ScriptEngineMajorVersion" in window;

export function $(element, selector) {
    return Array.prototype.slice.call(element.querySelectorAll(selector), 0);
}

export function repeat(times, fn) {
    if (typeof fn === "string") {
        return Array(times + 1).join(fn);
    } else {
        return Array.apply(null, Array(times)).map(fn).join("");
    }
}
