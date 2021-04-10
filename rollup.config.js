import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import postcssPresetEnv from "postcss-preset-env";
import postcssSystemUiFont from "postcss-font-family-system-ui";

const styleInjectPath = require
    .resolve("style-inject/dist/style-inject.es")
    .replace(/[\\/]+/g, "/")

export default {
    input: "src/polyfill.js",
    output: {
        file: "build/better-dateinput-polyfill.js",
        format: "iife"
    },
    plugins: [
        babel({babelHelpers: "bundled"}),
        postcss({
            minimize: true,
            plugins: [
                postcssSystemUiFont(),
                postcssPresetEnv({
                    "features": {
                        "nesting-rules": true,
                        "custom-properties": {"preserve": false},
                        "custom-media-queries": {"preserve": false}
                    }
                })
            ],
            inject(cssVariableName, filePath) {
                if (filePath.endsWith("polyfill.css")) {
                    return `import styleInject from '${styleInjectPath}';\n`
                     +`styleInject(${cssVariableName}, {insertAt: 'top'});`;
                }
            },
            "features": {
                "custom-properties": {"preserve": false}
            }
        })
    ]
}
