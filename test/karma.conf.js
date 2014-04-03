module.exports = function(config) {
    "use strict";

    config.set({
        basePath: "..",
        frameworks: ["jasmine"],
        browsers: ["PhantomJS"],
        preprocessors: { "src/better-dateinput-polyfill.js": "coverage" },
        files: [
            "bower_components/better-dom/dist/better-dom-legacy.js",
            "bower_components/better-dom/dist/better-dom.js",
            "src/*.js",
            "test/spec/*.spec.js"
        ]
    });
};
