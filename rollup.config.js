import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import {terser} from "rollup-plugin-terser";
import pkg from "./package.json";

const banner = `/**
 * ${pkg.name}: ${pkg.description}
 * @version ${pkg.version} ${new Date().toUTCString()}
 * @link ${pkg.homepage}
 * @copyright ${new Date().getFullYear()} ${pkg.author}
 * @license ${pkg.license}
*/`

export default async function ({watch}) {
    if (watch) {
        return {
            input: "src/polyfill.js",
            output: {
                file: "build/better-dateinput-polyfill.js",
                format: "iife",
                banner,
            },
            plugins: [
                babel({babelHelpers: "bundled"}),
                postcss({config: true, inject: false, minimize: true}),
            ],
            watch: {
                clearScreen: false,
            },
        };
    } else {
        return [{
            input: "src/polyfill.js",
            output: {
                file: "dist/better-dateinput-polyfill.js",
                format: "iife",
                banner,
            },
            plugins: [
                babel({babelHelpers: "bundled"}),
                postcss({config: true, inject: false, minimize: true}),
            ],
        }, {
            input: "src/polyfill.js",
            output: {
                file: "dist/better-dateinput-polyfill.min.js",
                format: "iife",
                banner,
            },
            plugins: [
                babel({babelHelpers: "bundled"}),
                postcss({config: true, inject: false, minimize: true}),
                terser({compress: {ecma: 5}}),
            ],
        }]
    }
};
