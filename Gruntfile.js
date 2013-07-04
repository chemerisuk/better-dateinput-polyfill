module.exports = function(grunt) {
    "use strict";

    var pkg = grunt.file.readJSON("package.json"),
        gruntDeps = function(name) {
            return !name.indexOf("grunt-") && name !== "grunt-template-jasmine-istanbul";
        };

    grunt.initConfig({
        pkg: pkg,

        watch: {
            jasmine: {
                files: ["src/*.js", "test/*.spec.js"],
                tasks: ["jasmine:coverage"]
            }
        },
        jasmine: {
            options: {
                vendor: ["bower_components/better-dom/better-dom.js"],
                specs: "test/*.spec.js",
                keepRunner: true
            },
            unit: {
                src: ["src/*.js"]
            },
            coverage: {
                src: ["src/*.js"],
                options: {
                    template: require("grunt-template-jasmine-istanbul"),
                    templateOptions: {
                        coverage: "coverage/coverage.json",
                        report: "coverage"
                    }
                }
            }
        },
        jshint: {
            all: ["Gruntfile.js", "src/*.js", "test/*.spec.js"],
            options: {
                jshintrc: ".jshintrc"
            }
        },
        clean: {
            bower: ["bower_components/"]
        },
        shell: {
            openCoverage: {
                command: "open coverage/index.html"
            },
            bower: {
                command: "bower install"
            },
            updateBranches: {
                command: [
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
        }
    });

    Object.keys(pkg.devDependencies).filter(gruntDeps).forEach(grunt.loadNpmTasks);

    grunt.registerTask("test", ["jshint", "jasmine:unit"]);
    grunt.registerTask("dev", ["test", "shell:openCoverage", "watch"]);

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
            "clean:bower",
            "shell:updateBranches",
            "clean:bower",
            "shell:bower",
            "shell:finishBranches"
        ]);
    });
};
