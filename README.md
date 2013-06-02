better-dateinput-polyfill
=========================
`input[type=date]` polyfill for [better-dom](https://github.com/chemerisuk/better-dom)

Installing
----------
Use [bower](http://bower.io/) to download this extension with all required dependencies.

    bower install better-dateinput-polyfill

This will clone the latest version of the better-dateinput-polyfill into the `components` directory at the root of your project.

Then append the following script on your page:

```html
<html>
<head>
    ...
    <link href="components/better-dateinput-polyfill/src/better-dateinput-polyfill.css" rel="stylesheet"/>
</head>
<body>
    ...
    <script src="components/lodash/lodash.js"></script>
    <script src="components/better-dom/better-dom.js" data-htc="components/better-dom/better-dom.htc"></script>
    <script src="components/better-dateinput-polyfill/src/better-dateinput-polyfill.js"></script>
</body>
</html>
```

Demo
----
http://chemerisuk.github.io/better-dateinput-polyfill/
