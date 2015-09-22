webpackJsonp([2],[
/* 0 */
/*!******************************!*\
  !*** ./src/js/renderTest.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 165);
	
	var React = _interopRequireWildcard(_reactAddons);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _tabWindow = __webpack_require__(/*! ./tabWindow */ 5);
	
	var TabWindow = _interopRequireWildcard(_tabWindow);
	
	var _tabWindowStore = __webpack_require__(/*! ./tabWindowStore */ 1);
	
	var _tabWindowStore2 = _interopRequireDefault(_tabWindowStore);
	
	var _lodash = __webpack_require__(/*! lodash */ 2);
	
	var _ = _interopRequireWildcard(_lodash);
	
	var _actions = __webpack_require__(/*! ./actions */ 7);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _components = __webpack_require__(/*! ./components */ 183);
	
	var Components = _interopRequireWildcard(_components);
	
	var _utils = __webpack_require__(/*! ./utils */ 8);
	
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	
	// make a TabWindow from its JSON
	function makeTabWindow(jsWin) {
	  var decItems = jsWin.tabItems.map(function (tiFields) {
	    return new TabWindow.TabItem(tiFields);
	  });
	
	  jsWin.tabItems = Immutable.Seq(decItems);
	
	  var decWin = new TabWindow.TabWindow(jsWin);
	  return decWin;
	}
	
	function renderPage(testData) {
	  var allWindows = testData.allWindows;
	
	  var tabWindows = allWindows.map(makeTabWindow);
	
	  var mockWinStore = new _tabWindowStore2['default'](-1, -1);
	
	  var bgPage = chrome.extension.getBackgroundPage();
	
	  var renderTestSavedHTML = bgPage.renderTestSavedHTML;
	
	  /*
	    const savedNode = bgPage.savedNode;
	    console.log("Saved node from bg page: ", savedNode);
	  */
	
	  mockWinStore.registerTabWindows(tabWindows);
	  console.log("Created mockWinStore and registered test windows");
	  var t_preRender = performance.now();
	  var parentNode = document.getElementById('windowList-region');
	
	  if (Perf) Perf.start();
	
	  /*
	  if (savedNode) {
	    var newNode = document.importNode(savedNode, true);
	    if (parentNode.firstChild===null) {
	      parentNode.appendChild(newNode);
	    } else {
	      parentNode.replaceChild(newNode,parentNode.firstChild);
	    }
	  }
	  */
	  if (renderTestSavedHTML) {
	    console.log("Got saved HTML, setting...");
	    parentNode.innerHTML = renderTestSavedHTML;
	    var t_postSet = performance.now();
	    console.log("time to set initial HTML: ", t_postSet - t_preRender);
	  }
	  /*
	   * Use setTimeout so we have a chance to finish the initial render
	   */
	  // pass noListener since we don't want to receive updates from the store.
	  // There won't be any such updates (since we created the store) but the listener mechanism
	  // uses chrome messages to bg page as workaround for lack of window close event on popup, and we don't want
	  // that connection.
	  var appElement = React.createElement(Components.TabMan, { winStore: mockWinStore, noListener: true });
	  React.render(appElement, parentNode);
	
	  var t_postRender = performance.now();
	  if (Perf) Perf.stop();
	  console.log("initial render complete. render time: (", t_postRender - t_preRender, " ms)");
	  if (Perf) {
	    console.log("inclusive:");
	    Perf.printInclusive();
	    console.log("exclusive:");
	    Perf.printExclusive();
	    console.log("wasted:");
	    Perf.printWasted();
	  }
	  console.log("After rendering, parentNode: ", parentNode);
	
	  var renderedString = React.renderToString(appElement);
	  // console.log("rendered string: ", renderedString);
	  // bgPage.savedNode = parentNode.firstChild;
	  bgPage.renderTestSavedHTML = renderedString;
	}
	
	var testStateUrl = "testData/winSnap.json";
	
	function loadTestData(callback) {
	  var request = new XMLHttpRequest();
	  request.open('GET', testStateUrl, true);
	  request.onload = function () {
	    if (request.status >= 200 && request.status < 400) {
	      var data = JSON.parse(request.responseText);
	      callback(data);
	    } else {
	      // We reached our target server, but it returned an error
	      console.error("request failed, error: ", request.status, request);
	    }
	  };
	  request.send();
	}
	
	/**
	 * Main entry point to rendering the popup window
	 */
	function renderTest() {
	  loadTestData(renderPage);
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
	  window.onload = renderTest;
	}
	
	main();

/***/ }
]);
//# sourceMappingURL=renderTest.bundle.js.map