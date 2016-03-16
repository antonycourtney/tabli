webpackJsonp([1],{

/***/ 0:
/*!******************************!*\
  !*** ./src/js/renderTest.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _react = __webpack_require__(/*! react */ 9);
	
	var React = _interopRequireWildcard(_react);
	
	var _immutable = __webpack_require__(/*! immutable */ 6);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddonsPerf = __webpack_require__(/*! react-addons-perf */ 196);
	
	var Perf = _interopRequireWildcard(_reactAddonsPerf);
	
	var _reactDom = __webpack_require__(/*! react-dom */ 189);
	
	var ReactDOM = _interopRequireWildcard(_reactDom);
	
	var _server = __webpack_require__(/*! react-dom/server */ 195);
	
	var ReactDOMServer = _interopRequireWildcard(_server);
	
	var _index = __webpack_require__(/*! ../tabli-core/src/js/index */ 2);
	
	var Tabli = _interopRequireWildcard(_index);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	var TabManagerState = Tabli.TabManagerState;
	var TabWindow = Tabli.TabWindow;
	var Popup = Tabli.components.Popup;
	var Styles = Tabli.components.Styles;
	
	// make a TabWindow from its JSON
	function makeTabWindow(jsWin) {
	  var decItems = jsWin.tabItems.map(function (tiFields) {
	    return new TabWindow.TabItem(tiFields);
	  });
	
	  var itemWin = Object.assign({}, jsWin, { tabItems: Immutable.Seq(decItems) });
	
	  var decWin = new TabWindow.TabWindow(itemWin);
	  return decWin;
	}
	
	function renderPage(testData) {
	  var allWindows = testData.allWindows;
	
	  var tabWindows = allWindows.map(makeTabWindow);
	
	  var emptyWinStore = new TabManagerState();
	
	  var bgPage = chrome.extension.getBackgroundPage();
	
	  var renderTestSavedHTML = bgPage.renderTestSavedHTML;
	
	  /*
	    const savedNode = bgPage.savedNode;
	    console.log("Saved node from bg page: ", savedNode);
	  */
	
	  var mockWinStore = emptyWinStore.registerTabWindows(tabWindows);
	  console.log('Created mockWinStore and registered test windows');
	  console.log('mock winStore: ', mockWinStore.toJS());
	
	  var t_preRender = performance.now();
	  var parentNode = document.getElementById('windowList-region');
	
	  if (Perf) {
	    Perf.start();
	  }
	
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
	    console.log('Got saved HTML, setting...');
	    parentNode.innerHTML = renderTestSavedHTML;
	    var t_postSet = performance.now();
	    console.log('time to set initial HTML: ', t_postSet - t_preRender);
	  }
	  /*
	   * Use setTimeout so we have a chance to finish the initial render
	   */
	
	  // pass noListener since we don't want to receive updates from the store.
	  // There won't be any such updates (since we created the store) but the listener mechanism
	  // uses chrome messages to bg page as workaround for lack of window close event on popup, and we don't want
	  // that connection.
	
	  var appElement = React.createElement(
	    'div',
	    { style: Styles.renderTestContainer },
	    React.createElement(Popup, { storeRef: null, initialWinStore: mockWinStore, noListener: true })
	  );
	  ReactDOM.render(appElement, parentNode);
	
	  var t_postRender = performance.now();
	  if (Perf) {
	    Perf.stop();
	  }
	  console.log('initial render complete. render time: (', t_postRender - t_preRender, ' ms)');
	  if (Perf) {
	    console.log('inclusive:');
	    Perf.printInclusive();
	    console.log('exclusive:');
	    Perf.printExclusive();
	    console.log('wasted:');
	    Perf.printWasted();
	  }
	
	  console.log('After rendering, parentNode: ', parentNode);
	
	  var renderedString = ReactDOMServer.renderToString(appElement);
	
	  // console.log("rendered string: ", renderedString);
	  // bgPage.savedNode = parentNode.firstChild;
	  bgPage.renderTestSavedHTML = renderedString;
	}
	
	var testStateUrl = 'testData/winSnap.json';
	
	function loadTestData(callback) {
	  var request = new XMLHttpRequest();
	  request.open('GET', testStateUrl, true);
	  request.onload = function () {
	    if (request.status >= 200 && request.status < 400) {
	      var data = JSON.parse(request.responseText);
	      callback(data);
	    } else {
	      // We reached our target server, but it returned an error
	      console.error('request failed, error: ', request.status, request);
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

/***/ },

/***/ 195:
/*!*******************************!*\
  !*** ./~/react-dom/server.js ***!
  \*******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	module.exports = __webpack_require__(/*! react/lib/ReactDOMServer */ 156);


/***/ },

/***/ 196:
/*!**************************************!*\
  !*** ./~/react-addons-perf/index.js ***!
  \**************************************/
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(/*! react/lib/ReactDefaultPerf */ 150);

/***/ }

});
//# sourceMappingURL=renderTest.bundle.js.map