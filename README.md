# `input[type=date]` polyfill for [better-dom](https://github.com/chemerisuk/better-dom)

[![NPM version][npm-version]][npm-url] [![NPM downloads][npm-downloads]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Twitter][twitter-follow]][twitter-url]

| [![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)][donate-url] | Your help is appreciated. Create a PR, submit a bug or just grab me :beer: |
|-|-|

Why another date picker? The problem is that most of existing solutions do not follow standards regarding to `value` property format, that should have “a valid full-date as defined in [RFC 3339]”. In other words representation of date can vary, but the string value should have `yyyy-MM-dd` format. It helps to work with such values consistently regarding on the current language.

[VIEW DEMO](http://chemerisuk.github.io/better-dateinput-polyfill/)

## Features

* normalizes `input[type=date]` presentation for desktop browsers
* submitted value always has `yyyy-MM-dd` [RFC 3339] format
* [live extension](https://github.com/chemerisuk/better-dom/wiki/Live-extensions) - works for the current and future content
* `placeholder` attribute works as expected in browsers that support it
* fully customizable date picker, including [displayed value format](https://github.com/chemerisuk/better-dateinput-polyfill#change-default-date-presentation-format) via `data-format` attribute
* control when to apply the polyfill using [data-polyfill](#forcing-the-polyfill) attribute
* US variant for days of week is supported (use `<html lang="en-US">`)
* keyboard and accessibility friendly

## Installation
**Version 3.3 requires better-dom 4.1 or above. Make sure you have latest version of better-dom.**

```sh
$ npm install better-dateinput-polyfill better-dom
```

Then append the following scripts to your page:
```html
<script src="node_modules/better-dom/dist/better-dom.js"></script>
<script src="node_modules/better-dateinput-polyfill/dist/better-dateinput-polyfill.js"></script>
```

## Forcing the polyfill
Sometimes it's useful to override browser implemetation with the consistent control implemented by the polyfill. In order to suppress feature detection you can use the `data-polyfill` attribute. Possible values are `desktop`, `mobile`, `all`, `none`. They allow to limit type of devices where you want to see the native control.

```html
<!-- force polyfill only on mobile devices -->
<input type="date" data-polyfill="mobile">
<!-- force polyfill on any device -->
<input type="date" data-polyfill="all">
<!-- does not polyfill anywhere -->
<input type="date" data-polyfill="none">
```

## Change default date presentation format
Version 3 uses [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) methods to format presented date value according to the current page locale. You can customize it by specifying `data-format` attribute with [options for the Date#toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString) call as a stringified JSON object:
```html
<input type="date" data-format='{"month":"short","year":"numeric","day":"numeric"}'>
```

When you set the same presentation format multiple times it makes sense to define a global format. Add extra `<meta>` element with appropriate values for `name` and `content` attributes into document `<head>`. Later in HTML you can just use a global format name as a value for `data-format`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    ...
    <meta name="data-format:YYYYmmm" content='{"year":"numeric","month":"short"}'>
</head>
<body>
    ...
    <input type="date" name="test" value="2000-01-01" data-format="YYYYmmm">
</body>
</html>
```

## Contributing
In order to modify the source code you have to install [gulp](http://gulpjs.com) globally:

```sh
$ npm install -g gulp
```

Now you can download project dependencies:
```sh
$ npm install
```

The project uses set of ES6 transpilers to compile the output file. You can use command below to start development: 
```sh
$ npm start
```

After any change it recompiles `build/better-dateinput-polyfill.js` and runs unit tests automatically.

## Browser support
#### Desktop
* Chrome
* Safari
* Firefox
* Opera
* Edge
* Internet Explorer 10+

#### Mobile
* iOS Safari 7+
* Chrome for Android 30+

[npm-url]: https://www.npmjs.com/package/better-dateinput-polyfill
[npm-version]: https://img.shields.io/npm/v/better-dateinput-polyfill.svg
[npm-downloads]: https://img.shields.io/npm/dm/better-dateinput-polyfill.svg

[travis-url]: http://travis-ci.org/chemerisuk/better-dateinput-polyfill
[travis-image]: http://img.shields.io/travis/chemerisuk/better-dateinput-polyfill/master.svg

[coveralls-url]: https://coveralls.io/r/chemerisuk/better-dateinput-polyfill
[coveralls-image]: http://img.shields.io/coveralls/chemerisuk/better-dateinput-polyfill/master.svg

[twitter-url]: https://twitter.com/chemerisuk
[twitter-follow]: https://img.shields.io/twitter/follow/chemerisuk.svg?style=social&label=Follow%20me

[donate-url]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=UZ4SLQP8S4UUG&source=url