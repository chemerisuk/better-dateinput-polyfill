# better-emmet-plugin<br>[![NPM version][npm-version]][npm-url] [![NPM downloads][npm-downloads]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Bower version][bower-image]][bower-url]
> Emmet abbreviation parser for [better-dom](https://github.com/chemerisuk/better-dom)

Html strings are annoyingly verbose. Let's fix that with [Emmet](http://emmet.io/). Compare the HTML string:

```js
DOM.create("<ul><li class='list-item'></li><li class='list-item'></li><li class='list-item'></li></ul>");
```

to the equivalent micro template

```js
DOM.create(DOM.emmet("ul>li.list-item*3"));
```
Take a look at the [Emmet cheat sheet](http://docs.emmet.io/cheat-sheet/) for more examples, but be aware about the [differences](#differences-from-emmetio-parser).

## Differences from emmet.io parser
1. Element aliases are not supported
2. Implied tag names are not supported
3. `a{text}` instead of `a>{text}` is not supported
4. Operator `^` is not supported
5. Expandos are not supported
6. Boolean attributes (attributes are boolean by default)
7. Default attributes are not supported
8. Short tags are not supported

## Do not be crazy with microtemplates!
Several recommendations from the [emmet docs](http://docs.emmet.io/):

> Abbreviations are not a template language, they don’t have to be “readable”, they have to be “quickly expandable and removable”.
> 
> You don’t really need to write complex abbreviations. Stop thinking that “typing” is the slowest process in web-development. You’ll quickly find out that constructing a single complex abbreviation is much slower and error-prone than constructing and typing a few short ones.

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

[npm-url]: https://www.npmjs.com/package/better-emmet-plugin
[npm-version]: https://img.shields.io/npm/v/better-emmet-plugin.svg
[npm-downloads]: https://img.shields.io/npm/dt/better-emmet-plugin.svg

[travis-url]: http://travis-ci.org/chemerisuk/better-emmet-plugin
[travis-image]: http://img.shields.io/travis/chemerisuk/better-emmet-plugin/master.svg

[coveralls-url]: https://coveralls.io/r/chemerisuk/better-emmet-plugin
[coveralls-image]: http://img.shields.io/coveralls/chemerisuk/better-emmet-plugin/master.svg

[bower-url]: https://github.com/chemerisuk/better-emmet-plugin
[bower-image]: http://img.shields.io/bower/v/better-emmet-plugin.svg
