import POLYFILL_CSS from "./polyfill.css";
import {DateInputPolyfill} from "./input.js";
import {$, WINDOW, DOCUMENT, IE, injectStyles} from "./util.js";

const ANIMATION_NAME = "dateinput-polyfill";
const PROPERTY_NAME = `__${ANIMATION_NAME}__`;

function isDateInputSupported() {
    // use a stronger type support detection that handles old WebKit browsers:
    // http://www.quirksmode.org/blog/archives/2015/03/better_modern_i.html
    const input = DOCUMENT.createElement("input");
    input.type = "date";
    input.value = "_";
    return input.value !== "_";
}

const mediaMeta = $(DOCUMENT, "meta[name=dateinput-polyfill-media]")[0];
if (mediaMeta ? WINDOW.matchMedia(mediaMeta.content) : (IE || !isDateInputSupported())) {
    // inject style rules with fake animation
    injectStyles(POLYFILL_CSS, DOCUMENT.head);
    // attach listener to catch all fake animation starts
    DOCUMENT.addEventListener("animationstart", event => {
        if (event.animationName === ANIMATION_NAME) {
            const input = event.target;
            if (!input[PROPERTY_NAME]) {
                input[PROPERTY_NAME] = new DateInputPolyfill(input);
            }
        }
    });
}
