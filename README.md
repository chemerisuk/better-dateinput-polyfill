# better-dateinput-polyfill<br>[![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Bower version][bower-image]][bower-url]
> `input[type=date]` polyfill for [better-dom](https://github.com/chemerisuk/better-dom)

Why another date picker? The problem is that most of existing solutions do not follow standards regarding to `value` property format, that should have “a valid full-date as defined in [RFC 3339]”. In other words representation of date can vary, but the string value should have `yyyy-MM-dd` format. It helps to work with such values consistently regarding on the current language.

[VIEW DEMO](http://chemerisuk.github.io/better-dateinput-polyfill/)

## Features

* normalizes `input[type=date]` representation on desktop browsers
* submitted value of the input has RFC 3339 `yyyy-MM-dd` format
* [live extension](https://github.com/chemerisuk/better-dom/wiki/Live-extensions) - works for current and future content
* fully customizable date picker via CSS classes
* date picker has keyboard and accessibility support
* allows to set value programmatically, but the string should have `yyyy-MM-dd` format
* US variant for days of week is supported (use `<html lang="en-US">`)
* does nothing on mobile browsers, they have good UI widget and correct `value` format 
* `placeholder` attribute works as expected in browsers that support it
* restores initial value on form reset
* [full i18n support](https://github.com/chemerisuk/better-i18n-plugin#multilingual-live-extensions) (if your language is missed - just translate strings from `i18n` folder and include a new file in your project)

## Installation
The simplest way is to use [bower](http://bower.io/):

```sh
$ bower install better-dateinput-polyfill
```

This will clone the latest version of the __better-dateinput-polyfill__ with dependencies into the `bower_components` directory at the root of your project.

Then append the following script on your page:

```html
<html>
<head>
    ...
    <link href="bower_components/better-dateinput-polyfill/dist/better-dateinput-polyfill.css" rel="stylesheet"/>
    <!--[if IE]>
        <link href="bower_components/better-dom/dist/better-dom-legacy.htc" rel="htc"/>
        <script src="bower_components/better-dom/dist/better-dom-legacy.js"></script>
    <![endif]-->
</head>
<body>
    ...
    <script src="bower_components/better-dom/dist/better-dom.js"></script>
    <script src="bower_components/better-dateinput-polyfill/dist/better-dateinput-polyfill.js"></script>
</body>
</html>
```

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

[travis-url]: http://travis-ci.org/chemerisuk/better-dateinput-polyfill
[travis-image]: http://img.shields.io/travis/chemerisuk/better-dateinput-polyfill/master.svg

[coveralls-url]: https://coveralls.io/r/chemerisuk/better-dateinput-polyfill
[coveralls-image]: http://img.shields.io/coveralls/chemerisuk/better-dateinput-polyfill/master.svg

[bower-url]: https://github.com/chemerisuk/better-dateinput-polyfill
[bower-image]: http://img.shields.io/bower/v/better-dateinput-polyfill.svg
