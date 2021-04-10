import POLYFILL_CSS from "./polyfill.css";
import {DateInputPolyfill} from "./input.js";
import {IE, injectStyles} from "./util.js";

injectStyles(POLYFILL_CSS, document.head);

const ANIMATION_NAME = "dateinput-picker";
const FLAG_NAME = `__${ANIMATION_NAME}__`;
const DEVICE_TYPE = "orientation" in window ? "mobile" : "desktop";
const TYPE_SUPPORTED = (function() {
    if (IE) return false;
    // use a stronger type support detection that handles old WebKit browsers:
    // http://www.quirksmode.org/blog/archives/2015/03/better_modern_i.html
    const input = document.createElement("input");
    input.type = "date";
    input.value = "_";
    return input.value !== "_";
}());

function polyfillEnabledFor(input) {
    // prevent double initialization
    if (input[FLAG_NAME]) return false;
    const polyfillType = input.getAttribute("data-polyfill");
    if (polyfillType === "none") return false;
    if (polyfillType && (polyfillType === DEVICE_TYPE || polyfillType === "all")) {
        // remove native browser implementation
        input.type = "text";
        // force applying the polyfill
        return true;
    }
    return !TYPE_SUPPORTED;
}

document.addEventListener("animationstart", event => {
    if (event.animationName === ANIMATION_NAME) {
        const input = event.target;
        if (polyfillEnabledFor(input)) {
            input[FLAG_NAME] = new DateInputPolyfill(input);
        }
    }
});
