better-dateinput-polyfill [![Build Status](https://api.travis-ci.org/chemerisuk/better-dateinput-polyfill.png?branch=master)](http://travis-ci.org/chemerisuk/better-dateinput-polyfill)
=========================
> `input[type=date]` polyfill for [better-dom](https://github.com/chemerisuk/better-dom)

[VIEW DEMO](http://chemerisuk.github.io/better-dateinput-polyfill/)

Installing
----------
Use [bower](http://bower.io/) to download this extension with all required dependencies.

    bower install better-dateinput-polyfill --save

This will clone the latest version of the __better-dateinput-polyfill__ into the `bower_components` directory at the root of your project.

Then append the following script on your page:

```html
<html>
<head>
    ...
    <link href="bower_components/better-dateinput-polyfill/dist/better-dateinput-polyfill.css" rel="stylesheet"/>
    <!--[if IE]>
        <link href="bower_components/better-dom/dist/better-dom.htc" rel="htc" />
        <script src="bower_components/html5shiv/dist/html5shiv.js"></script>
    <![endif]-->
</head>
<body>
    ...
    <script src="bower_components/better-dom/dist/better-dom.js"></script>
    <script src="bower_components/better-dateinput-polyfill/dist/better-dateinput-polyfill.js"></script>
</body>
</html>
```