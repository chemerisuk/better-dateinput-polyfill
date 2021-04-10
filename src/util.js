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

export function svgIcon(path) {
    return html`
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="100%" viewBox="0 0 16 16">
    <path d="${path}"/>
</svg>
    `;
}

export function injectStyles(cssText, head) {
    const style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = cssText;
    if (head.firstChild) {
        head.insertBefore(style, head.firstChild)
    } else {
        head.appendChild(style);
    }
}
