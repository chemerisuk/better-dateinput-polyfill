module.exports = function(config) {
    "use strict";

    config.set({
        basePath: "..",
        frameworks: ["jasmine"],
        browsers: ["PhantomJS"],
        files: [
            "bower_components/better-dom/dist/better-dom-legacy.js",
            "bower_components/better-dom/dist/better-dom.js",
            "src/*.js",
            "test/spec/*.spec.js"
        ]
    });
};
