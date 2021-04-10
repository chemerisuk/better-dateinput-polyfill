import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import nested from "postcss-nested";
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
            plugins: [nested(), postcssSystemUiFont()],
            inject(cssVariableName, filePath) {
                if (filePath.endsWith("polyfill.css")) {
                    return `import styleInject from '${styleInjectPath}';\n`
                     +`styleInject(${cssVariableName});`;
                }
            }
        })
    ]
}
