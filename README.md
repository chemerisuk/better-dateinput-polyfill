# `input[type=date]` polyfill

[![NPM version][npm-version]][npm-url] [![NPM downloads][npm-downloads]][npm-url] [![Build Status][status-image]][status-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Twitter][twitter-follow]][twitter-url]

| [![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)][donate-url] | Your help is appreciated. Create a PR, submit a bug or just grab me :beer: |
|-|-|

Why another date picker? The problem is that most of existing solutions do not follow standards regarding to `value` property format, that should have “a valid full-date as defined in [RFC 3339]”. In other words representation of date can vary, but the string value should have `yyyy-MM-dd` format. It helps to work with such values consistently regarding on the current language.

[VIEW DEMO](http://chemerisuk.github.io/better-dateinput-polyfill/)

## Features

* lightweight polyfill with no dependencies
* works for initial and dynamic content elements
* normalizes `input[type=date]` presentation for desktop browsers
* submitted value always has standards based `yyyy-MM-dd` [RFC 3339] format
* `placeholder` attribute works as expected
* it's possible to change [displayed date value format](https://github.com/chemerisuk/better-dateinput-polyfill#change-default-date-presentation-format)
* you are able to [control where to apply the polyfill](#forcing-the-polyfill)
* keyboard and accessibility friendly

## Installation
```sh
$ npm install better-dateinput-polyfill
```

Then append the following scripts to your page:
```html
<script src="node_modules/better-dateinput-polyfill/dist/better-dateinput-polyfill.js"></script>
```

## Forcing the polyfill
Sometimes it's useful to override browser implemetation with the consistent control implemented by the polyfill. To suppress feature detection you can add `<meta name="dateinput-polyfill-media">` into your document `<head>`. Value of `content` attribute is a media query where polyfill will be applied:

```html
<!-- force polyfill everywhere -->
<meta name="dateinput-polyfill-media" content="screen">
<!-- force polyfill only on mobile devices in portrait mode-->
<meta name="dateinput-polyfill-media" content="screen and (orientation: portrait)">
```

## Change default date presentation format
When no spicified polyfill uses browser settings to format displayed date. You can override date presentation globally with `<meta name="dateinput-polyfill-format">` via `content` attribute or directly on a HTML element with `data-format` attribute. Value should be [options for the Date#toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString) call as a stringified JSON object:
```html
<html>
<head>
    <!-- Override default date presentation format -->
    <meta name="dateinput-polyfill-format" content='{"month":"long","year":"numeric","day":"numeric"}'>
</head>
<body>
    <!-- Override date presentation format on a particular element -->
    <input type="date" data-format='{"month":"short","year":"numeric","day":"numeric"}'>
</body>
</html>
```

## Contributing
Download git repository and install project dependencies:
```sh
$ npm install
```

The project uses set of ES6 transpilers to compile the output file. Now use command below to start development:
```sh
$ npm run watch
```

After any change file `build/better-dateinput-polyfill.js` is recompiled automatically.

## Browser support
#### Desktop
* Chrome
* Safari
* Firefox
* Opera
* Edge
* Internet Explorer 10+

#### Mobile
* iOS Safari 10+
* Chrome for Android 70+

[npm-url]: https://www.npmjs.com/package/better-dateinput-polyfill
[npm-version]: https://img.shields.io/npm/v/better-dateinput-polyfill.svg
[npm-downloads]: https://img.shields.io/npm/dm/better-dateinput-polyfill.svg

[status-url]: https://github.com/chemerisuk/better-dateinput-polyfill/actions
[status-image]: https://github.com/chemerisuk/better-dateinput-polyfill/workflows/Node.js%20CI/badge.svg?branch=master

[coveralls-url]: https://coveralls.io/r/chemerisuk/better-dateinput-polyfill
[coveralls-image]: http://img.shields.io/coveralls/chemerisuk/better-dateinput-polyfill/master.svg

[twitter-url]: https://twitter.com/chemerisuk
[twitter-follow]: https://img.shields.io/twitter/follow/chemerisuk.svg?style=social&label=Follow%20me

[donate-url]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=UZ4SLQP8S4UUG&source=url