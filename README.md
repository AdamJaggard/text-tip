# TextTip - Tooltips for selected text

## Currently in development, come back soon.

TextTip is a JavaScript text selection tooltip library with no dependencies.

You can use TextTip to show a list of buttons when text is selected on a page. You can choose which blocks of text trigger the tooltip, how short or long the selection must be in order for it to show and other options. TextTip comes with no icons out of the box, these must be provided.

## Installing

With a script tag

```javascript
<script src="TextTip.js"></script>
```

Other use cases will be documented soon (CommonJS, AMD, etc).

## How to use

### Minimum setup

Triggered by any text on the page. `buttons` are required. `icon` is a url to an image.

```javascript
const tooltip = new TextTip({
	buttons: [
		{title: 'Button 1', icon: '../icon1.svg', callback: functionOne},
		{title: 'Button 2', icon: '../icon2.svg', callback: callbackTwo},
	]
});
```

### Scope

Scope lets you choose which blocks of text will trigger the tooltip. Selections beginning or ending outside of the scope will not trigger the tooltip. The selection must fall within the scope specified.

```javascript
const tooltip = new TextTip({
	scope: '.main-text',
	buttons: [
		{title: 'Button 1', icon: '../icon1.svg', callback: functionOne},
		{title: 'Button 2', icon: '../icon2.svg', callback: callbackTwo},
	]
});
```
