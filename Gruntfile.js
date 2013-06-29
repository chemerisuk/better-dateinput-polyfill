module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        watch: {
            jasmine: {
                files: ["src/*.js", "test/*.spec.js"],
                tasks: ["jasmine:coverage"]
            }
        },
        jasmine: {
            options: {
                vendor: ["components/better-dom/better-dom.js"],
                specs: "test/*.spec.js"
            },
            unit: {
                src: ["src/*.js"]
            },
            coverage: {
                src: ["src/*.js"],
                options: {
                    outfile: "specs.html",
                    keepRunner: true,
                    template: require("grunt-template-jasmine-istanbul"),
                    templateOptions: {
                        coverage: "coverage/coverage.json",
                        report: "coverage"
                    }
                }
            }
        },
        jshint: {
            all: [
                "Gruntfile.js",
                "src/*.js",
                "test/*.spec.js"
            ],
            options: {
                jshintrc: ".jshintrc"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jasmine");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.registerTask("test", ["jshint", "jasmine:unit"]);
    grunt.registerTask("dev", ["test", "watch"]);

    grunt.registerTask("default", ["test"]);
};
