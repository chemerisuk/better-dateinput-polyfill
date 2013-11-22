module.exports = function(grunt) {
    "use strict";

    var pkg = grunt.file.readJSON("package.json");

    grunt.initConfig({
        pkg: pkg,
        watch: {
            jasmine: {
                files: ["src/*.js", "test/spec/*.spec.js"],
                tasks: ["karma:coverage:run"]
            }
        },
        karma: {
            options: {
                configFile: "test/karma.conf.js"
            },
            coverage: {
                preprocessors: { "src/*.js": "coverage" },
                reporters: ["coverage", "progress"],
                background: true
            },
            unit: {
                singleRun: true
            }
        },
        jshint: {
            all: ["Gruntfile.js", "src/*.js", "test/spec/*.spec.js"],
            options: {
                jshintrc: ".jshintrc"
            }
        },
        shell: {
            bower: {
                command: "bower install"
            }
        }
    });

    Object.keys(pkg.devDependencies).forEach(function(name) {
        if (!name.indexOf("grunt-")) grunt.loadNpmTasks(name);
    });

    grunt.registerTask("test", ["jshint", "karma:unit"]);
    grunt.registerTask("dev", ["jshint", "karma:coverage", "watch"]);
    grunt.registerTask("publish", "Publish a new version", function(version) {
        grunt.task.run([
            "shell:bower",
            "test",
            "github_publish:" + version,
            "shell:bower"
        ]);
    });
};
