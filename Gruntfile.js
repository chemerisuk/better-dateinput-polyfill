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
        clean: {
            bower: ["bower_components/"]
        },
        shell: {
            bower: {
                command: "bower install"
            },
            updateBranches: {
                command: [
                    "git add -A",
                    // commit all changes
                    "git commit -am 'version <%= pkg.version %>'",
                    // checkout pages branch
                    "git checkout gh-pages",
                    // merge with master
                    "git merge master"
                ].join(" && ")
            },
            finishBranches: {
                command: [
                    // add any files that may have been created
                    "git add -A",
                    // commit all changes
                    "git commit -am 'version <%= pkg.version %>'",
                    // checkout pages branch
                    "git checkout master",
                    // update version tag
                    "git tag -af v<%= pkg.version %> -m 'version <%= pkg.version %>'",
                    // push file changed
                    "git push origin --all",
                    // push new tag
                    "git push origin v<%= pkg.version %>"
                ].join(" && ")
            }
        },
        copy: {
            publish: {
                files: [{ src: ["src/*"], dest: "dist/", expand: true, flatten: true }],
                options: {
                    processContent: function(content, srcpath) {
                        return grunt.template.process(
                            "/**\n" +
                            " * @file " + srcpath.split("/").pop() + "\n" +
                            " * @version <%= pkg.version %> <%= grunt.template.today('isoDateTime') %>\n" +
                            " * @overview <%= pkg.description %>\n" +
                            " * @copyright <%= pkg.author %> <%= grunt.template.today('yyyy') %>\n" +
                            " * @license <%= pkg.license %>\n" +
                            " * @see <%= pkg.repository.url %>\n" +
                            " */\n"
                        ) + content;
                    }
                }
            }
        }
    });

    Object.keys(pkg.devDependencies).forEach(function(name) {
        if (!name.indexOf("grunt-")) grunt.loadNpmTasks(name);
    });

    grunt.registerTask("test", ["jshint", "karma:unit"]);
    grunt.registerTask("dev", ["jshint", "karma:coverage", "watch"]);

    grunt.registerTask("publish", "Publish a new version at github", function(version) {
        pkg.version = version;

        grunt.registerTask("updateFileVersion", function(filename) {
            var json = grunt.file.readJSON(filename);

            json.version = version;

            grunt.file.write(filename, JSON.stringify(json, null, 4));
        });

        grunt.task.run([
            "test",
            "updateFileVersion:package.json",
            "updateFileVersion:bower.json",
            "copy:publish",
            "clean:bower",
            "shell:updateBranches",
            "clean:bower",
            "shell:bower",
            "shell:finishBranches",
            "shell:bower"
        ]);
    });
};
