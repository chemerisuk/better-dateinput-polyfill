const postcssPresetEnv = require("postcss-preset-env");
const postcssSystemUiFont = require("postcss-font-family-system-ui");

module.exports = {
    inject: false,
    minimize: true,
    plugins: [
        postcssSystemUiFont(),
        postcssPresetEnv({
            features: {
                "nesting-rules": true,
                "custom-properties": {"preserve": false},
                "custom-media-queries": {"preserve": false},
            },
        }),
    ],
};
