export const WINDOW = window;
export const DOCUMENT = document;
export const HTML = DOCUMENT.documentElement;
export const IE = "ScriptEngineMajorVersion" in WINDOW;

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

export function svgIcon(path, size) {
    return html`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="100%" viewBox="0 0 ${size} ${size}">
    <path d="${path}"/>
</svg>
    `;
}

export function injectStyles(cssText, head) {
    const style = DOCUMENT.createElement("style");
    style.type = "text/css";
    style.innerHTML = cssText;
    if (head.firstChild) {
        head.insertBefore(style, head.firstChild);
    } else {
        head.appendChild(style);
    }
}
