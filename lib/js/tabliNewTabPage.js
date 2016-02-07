'use strict';

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _reactDom = require('react-dom');

var ReactDOM = _interopRequireWildcard(_reactDom);

var _actions = require('./actions');

var actions = _interopRequireWildcard(_actions);

var _utils = require('./utils');

var _NewTabPage = require('./components/NewTabPage');

var _NewTabPage2 = _interopRequireDefault(_NewTabPage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Main entry point to rendering the new tab page
 */
function renderNewTabPage(currentWindowId) {
  var t_preRender = performance.now();
  var bgPage = chrome.extension.getBackgroundPage();

  var storeRef = bgPage.storeRef;
  var savedStore = bgPage.savedStore;

  var parentNode = document.getElementById('windowList-region');

  /* First:let's render *before* sync'ing so that we match the pre-rendered HTML... */
  /* Note (!!): We use savedStore here to ensured that the store state exactly matches savedHTML; we'll simply ignore
   * any possible store updates that happened since last save
   */

  // console.log("doRender: About to render using savedStore: ", savedStore.toJS());
  var appElement = React.createElement(_NewTabPage2.default, { storeRef: storeRef, initialWinStore: savedStore });
  var appComponent = ReactDOM.render(appElement, parentNode); // eslint-disable-line no-unused-vars
  var t_postRender = performance.now();
  console.log('full render complete. render time: (', t_postRender - t_preRender, ' ms)');

  // And sync our window state, which may update the UI...
  actions.syncChromeWindows((0, _utils.logWrap)(function (uf) {
    // console.log("postLoadRender: window sync complete");
    var syncStore = uf(savedStore);

    // And set current focused window:
    var nextStore = syncStore.setCurrentWindow(currentWindowId);
    storeRef.setValue(nextStore);

    // logHTML("Updated savedHTML", renderedString);
    var t_postSyncUpdate = performance.now();
    console.log('syncChromeWindows and update complete: ', t_postSyncUpdate - t_preRender, ' ms');
    document.getElementById('searchBox').focus();
  }));
}

function getFocusedAndRender() {
  chrome.windows.getCurrent(null, function (currentWindow) {
    renderNewTabPage(currentWindow.id);
  });
}

/*
 * Perform our React rendering *after* the load event for the popup
 * (rather than the more traditional ondocumentready event)
 * because we observe that Chrome's http cache will not attempt to
 * re-validate cached resources accessed after the load event, and this
 * is essential for reasonable performance when loading favicons.
 *
 * See https://code.google.com/p/chromium/issues/detail?id=511699
 *
 */
function main() {
  window.onload = getFocusedAndRender;
}

main();