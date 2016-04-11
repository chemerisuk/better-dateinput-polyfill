# better-i18n-plugin<br>[![NPM version][npm-version]][npm-url] [![NPM downloads][npm-downloads]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Bower version][bower-image]][bower-url]
> Internationalization plugin for [better-dom](https://github.com/chemerisuk/better-dom)

The project aims to solve the internationalization problem __on front-end side__. The technique used behind the scenes I call “CSS-driven internationalization” and there is a [deep article](http://www.smashingmagazine.com/2014/06/23/css-driven-internationalization-in-javascript/) about it.

## Features

* no JavaScript calls to switch to the current web page language
* change current language using the vanilla DOM `lang` attribute
* support for HTML markup in localized string values
* ability to change language on a document subtree

NOTE: at present the project can't localize empty DOM elements (like `<input>`, `<select>` etc.) or attribute values.

## Installing
Use [bower](http://bower.io/) to download this extension with all required dependencies.

```sh
$ bower install better-i18n-plugin
```

This will clone the latest version of the __better-i18n-plugin__ into the `bower_components` directory at the root of your project.

Then append the following scripts on your page:

```html
<script src="bower_components/better-dom/dist/better-dom.js"></script>
<script src="bower_components/better-i18n-plugin/dist/better-i18n-plugin.js"></script>
```

## Localization in browser
The plugin introduces 2 new static functions for the `DOM` namespace: `DOM.importStrings` and `DOM.__`. The first one is used to populate DOM with new localizations for a particular language:

```js
DOM.importStrings("ru", "Enter your name", "Введите ваше имя");
// you can populate many strings in one call
DOM.importStrings("ru", {
    "string 1": "translation 1",
    "string 2": "translation 2"
    ...
});
```

This storage is private therefore you can't access to it directly. Intstead you can use `DOM.__`:

```js
alert(DOM.__("Enter your name")); // displays "Enter your name"
// change current language...
DOM.set("lang", "ru");

alert(DOM.__("Enter your name")); // displays "Введите ваше имя"
```

If you need to get a value for a particular language use `toLocaleString` with an appropriate argument:

```js
var entry = DOM.__("Enter your name");

entry.toString();           // => "Enter your name"
entry.toLocaleString("ru"); // => "Введите ваше имя"
```

## Usage with `$Element`
Let's say you need to localize a button to support multiple languages. In this case you can use `$Element#l10n`:

```js
button.l10n("Hello world");
```

When you need to add a support for a new language import a localized version of the string. For example the string `"Hello world"` can be translated for Russian we pages like below:

```js
DOM.importStrings("ru", "Hello world", "Привет мир");
```

Now for web pages where `<html lang="ru">` the button displays `"Привет мир"` instead of `"Hello world"`.

## String variables
Both `DOM.__` and `$Element#l10n` supports second optional argument:

```js
DOM.__("your {name}", {name: "Maksim"}); // => "your Maksim"
// arrays are supported too
DOM.__("your {0}", ["Maksim"]);          // => "your Maksim"

button.l10n("Hello {user}", {user: "Maksim"}); // displays "Hello Maksim"
button.l10n("Hello {0}", ["Maksim"]);          // displays "Hello Maksim"
```

## Backend integration
Often you need to grab localized strings from backend. This is very easy to do using `DOM.importStrings`. In the example below I'll use [Handlebars](http://handlebarsjs.com) as a templating language and [i18n-node](https://github.com/mashpie/i18n-node) for I18N support.

Assume you've stored web page language in `res.locals.locale`. Then you need to add another variable that stores all backend strings map passed into `JSON.stringify` call:

```js
// remember language of your web page
res.locals.locale = "ru";
// generate string bundle for client side
res.locals.bundle = JSON.stringify(i18n.getCatalog(res.locals.locale));
```

After that just generate extra `<script>` element that will populate all backend strings in browser:

```html
<!DOCTYPE html>
<html lang="{{locale}}">
...
<body>
    ...
    <script src="bower_components/better-dom/dist/better-dom.js"></script>
    <script src="build/better-i18n-plugin.js"></script>
    <!-- populate strings from backend -->
    <script>DOM.importStrings("{{locale}}",{{{bundle}}})</script>
</body>
</html>
```

Now you can use `DOM.__` with an appropriate key to get a backend string on client side.

## Multilingual live extensions
In order to add support or use multiple languages of a live extension follow the convension below:

1. All localizations are located inside if the `i18n` folder
2. File names have following format: `i18n\project.{lang}.js`
3. To use a particular language make sure you have an appropriate `lang` attribute on the `<html>` element and the corresponsing file with localizations is included on your web page:

```html
<html lang="ru">
<head>    
    ...
</head>
<body>
    ...
    <!-- required dependencies -->
    <script src="bower_components/better-dom/dist/better-dom.js"></script>
    <script src="bower_components/better-i18n-plugin/dist/better-i18n-plugin.js"></script>
    <!-- project files -->
    <script src="specific_project/dist/specific_project.js"></script>
    <script src="specific_project/i18n/specific_project.ru.js"></script>
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

[npm-url]: https://www.npmjs.com/package/better-i18n-plugin
[npm-version]: https://img.shields.io/npm/v/better-i18n-plugin.svg
[npm-downloads]: https://img.shields.io/npm/dt/better-i18n-plugin.svg

[travis-url]: http://travis-ci.org/chemerisuk/better-i18n-plugin
[travis-image]: http://img.shields.io/travis/chemerisuk/better-i18n-plugin/master.svg

[coveralls-url]: https://coveralls.io/r/chemerisuk/better-i18n-plugin
[coveralls-image]: http://img.shields.io/coveralls/chemerisuk/better-i18n-plugin/master.svg

[bower-url]: https://github.com/chemerisuk/better-i18n-plugin
[bower-image]: http://img.shields.io/bower/v/better-i18n-plugin.svg
