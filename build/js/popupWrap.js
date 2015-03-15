/**
 * A lightweight top-level entry point for rendering popup that
 * call into rendering code in webpack'ed extension.  Avoids having to load a large
 * webpack'ed module each time popup is opened.
 */
'use strict';

console.log("hello popup!");
var bgw = chrome.extension.getBackgroundPage();
var rpf = bgw.tabMan.renderPopup;
rpf();
console.log("popup rendered");
