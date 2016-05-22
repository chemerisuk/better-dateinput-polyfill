# better-dateinput-polyfill<br>[![NPM version][npm-version]][npm-url] [![NPM downloads][npm-downloads]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Bower version][bower-image]][bower-url]
> `input[type=date]` polyfill for [better-dom](https://github.com/chemerisuk/better-dom)

Why another date picker? The problem is that most of existing solutions do not follow standards regarding to `value` property format, that should have “a valid full-date as defined in [RFC 3339]”. In other words representation of date can vary, but the string value should have `yyyy-MM-dd` format. It helps to work with such values consistently regarding on the current language.

[VIEW DEMO](http://chemerisuk.github.io/better-dateinput-polyfill/)

## Features

* normalizes `input[type=date]` presentation for desktop browsers
* submitted value always has `yyyy-MM-dd` [RFC 3339] format
* [live extension](https://github.com/chemerisuk/better-dom/wiki/Live-extensions) - works for current and future content
* `placeholder` attribute works as expected in browsers that support it
* fully customizable date picker, including [displayed value format](https://github.com/chemerisuk/better-time-element#custom-formats) via `data-format` attribute
* control when to apply the polyfill using [data-polyfill](#forcing-the-polyfill) attribute
* [full i18n support](https://github.com/chemerisuk/better-i18n-plugin#multilingual-live-extensions) (localized files located at [better-time-element](https://github.com/chemerisuk/better-time-element))
* US variant for days of week is supported (use `<html lang="en-US">`)
* * keyboard and accessibility friendly

## Installation
The simplest way is to use [bower](http://bower.io/):

```sh
$ bower install better-dateinput-polyfill
```

This will clone the latest version of the __better-dateinput-polyfill__ with dependencies into the `bower_components` directory at the root of your project.

Then append the following script on your page:

```html
<script src="bower_components/better-dom/dist/better-dom.js"></script>
<script src="bower_components/better-i18n-plugin/dist/better-i18n-plugin.js"></script>
<script src="bower_components/better-time-element/dist/better-time-element.js"></script>
<script src="bower_components/better-emmet-plugin/dist/better-emmet-plugin.js"></script>
<script src="bower_components/better-dateinput-polyfill/dist/better-dateinput-polyfill.js"></script>
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
* Safari 6.0+
* Firefox 16+
* Opera 12.10+
* Internet Explorer 8+ (see [notes](https://github.com/chemerisuk/better-dom#notes-about-old-ies))

#### Mobile
* iOS Safari 6+
* Android 2.3+
* Chrome for Android

[npm-url]: https://www.npmjs.com/package/better-dateinput-polyfill
[npm-version]: https://img.shields.io/npm/v/better-dateinput-polyfill.svg
[npm-downloads]: https://img.shields.io/npm/dt/better-dateinput-polyfill.svg

[travis-url]: http://travis-ci.org/chemerisuk/better-dateinput-polyfill
[travis-image]: http://img.shields.io/travis/chemerisuk/better-dateinput-polyfill/master.svg

[coveralls-url]: https://coveralls.io/r/chemerisuk/better-dateinput-polyfill
[coveralls-image]: http://img.shields.io/coveralls/chemerisuk/better-dateinput-polyfill/master.svg

[bower-url]: https://github.com/chemerisuk/better-dateinput-polyfill
[bower-image]: http://img.shields.io/bower/v/better-dateinput-polyfill.svg
