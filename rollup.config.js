import postcss from "rollup-plugin-postcss";
import nested from "postcss-nested";
import postcssSystemUiFont from "postcss-font-family-system-ui";

const styleInjectPath = require
  .resolve('style-inject/dist/style-inject.es')
  .replace(/[\\/]+/g, '/')

export default {
    input: "src/element.js",
    output: {
        file: "build/better-dateinput-polyfill.js",
        format: "iife"
    },
    plugins: [
        postcss({
            minimize: true,
            plugins: [nested(), postcssSystemUiFont()],
            inject(cssVariableName, filePath) {
                if (filePath.endsWith("element.css")) {
                    return `import styleInject from '${styleInjectPath}';\n`
                     +`styleInject(${cssVariableName});`;
                }
            }
        })
    ]
}
