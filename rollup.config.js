import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import postcssPresetEnv from "postcss-preset-env";
import postcssSystemUiFont from "postcss-font-family-system-ui";

export default {
    input: "src/polyfill.js",
    output: {
        file: "build/better-dateinput-polyfill.js",
        format: "iife"
    },
    plugins: [
        babel({babelHelpers: "bundled"}),
        postcss({
            inject: false,
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
            ]
        })
    ]
}
