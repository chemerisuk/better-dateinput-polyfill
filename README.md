# better-dateinput-polyfill [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url]
> `input[type=date]` polyfill for [better-dom](https://github.com/chemerisuk/better-dom)

Why another date picker? The problem is that most of existing solutions do not follow standards regarding to `value` property format, that should have "a valid full-date as defined in [RFC 3339]". In other words representation of the date can vary, but value should be in `yyyy-MM-dd` format. This helps a lot to work with such values consistently regarding on current language.

[VIEW DEMO](http://chemerisuk.github.io/better-dateinput-polyfill/)

## Features

* normalizes `input[type=date]` representation on desktop browsers
* submitted value of the input has RFC 3339 `yyyy-MM-dd` format
* [live extension](https://github.com/chemerisuk/better-dom/wiki/Live-extensions) - works for current and future content
* fully customizable date picker via CSS classes
* date picker has keyboard support
* allows to set value programmatically, but the string should be in `yyyy-MM-dd` format
* US variant of days of week supported (just use `<html lang="en-US">`)
* does nothing on mobile browsers, they have good UI widget and have correct `value` format 
* `placeholder` attribute works as excpected in browsers that support it
* restores initial value on parent form reset
* full i18n support (if your language is missed - just translate strings from `i18n` folder and include a new file in your project)

Installing
----------
Use [bower](http://bower.io/) to download this extension with all required dependencies.

    bower install better-dateinput-polyfill

This will clone the latest version of the __better-dateinput-polyfill__ into the `bower_components` directory at the root of your project.

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
* IE8+

#### Mobile
* iOS Safari 6+
* Android 2.3+
* Chrome for Android

[travis-url]: http://travis-ci.org/chemerisuk/better-dateinput-polyfill
[travis-image]: https://api.travis-ci.org/chemerisuk/better-dateinput-polyfill.png?branch=master

[coveralls-url]: https://coveralls.io/r/chemerisuk/better-dateinput-polyfill
[coveralls-image]: https://coveralls.io/repos/chemerisuk/better-dateinput-polyfill/badge.png?branch=master
