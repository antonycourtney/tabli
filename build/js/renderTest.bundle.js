webpackJsonp([1],{

/***/ 0:
/*!******************************!*\
  !*** ./src/js/renderTest.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _immutable = __webpack_require__(/*! immutable */ 6);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddonsPerf = __webpack_require__(/*! react-addons-perf */ 365);
	
	var Perf = _interopRequireWildcard(_reactAddonsPerf);
	
	var _index = __webpack_require__(/*! ../tabli-core/src/js/index */ 2);
	
	var Tabli = _interopRequireWildcard(_index);
	
	var _renderCommon = __webpack_require__(/*! ./renderCommon */ 366);
	
	var RenderCommon = _interopRequireWildcard(_renderCommon);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	/* globals XMLHttpRequest */
	
	var TabManagerState = Tabli.TabManagerState;
	var TabWindow = Tabli.TabWindow;
	var ViewRef = Tabli.ViewRef;
	
	// make a TabWindow from its JSON
	function makeTabWindow(jsWin) {
	  // eslint-disable-line no-unused-vars
	  var decItems = jsWin.tabItems.map(function (tiFields) {
	    return new TabWindow.TabItem(tiFields);
	  });
	
	  var itemWin = Object.assign({}, jsWin, { tabItems: Immutable.Seq(decItems) });
	
	  var decWin = new TabWindow.TabWindow(itemWin);
	  return decWin;
	}
	
	function renderPage(testData) {
	  var testChromeWindows = testData.chromeWindows;
	
	  console.log('renderPage: testData: ', testData);
	
	  var emptyWinStore = new TabManagerState();
	  var mockWinStore = emptyWinStore.syncWindowList(testChromeWindows).set('showRelNotes', false);
	
	  console.log('Created mockWinStore and registered test windows');
	  console.log('mock winStore: ', mockWinStore.toJS());
	  var storeRef = new ViewRef(mockWinStore);
	
	  var currentChromeWindow = testChromeWindows[0];
	
	  if (Perf) {
	    Perf.start();
	  }
	
	  var tPreRender = performance.now();
	
	  // N.B. false last arg to prevent sync'ing current chrome windows
	  RenderCommon.renderPopup(storeRef, currentChromeWindow, false, false);
	
	  var tPostRender = performance.now();
	  if (Perf) {
	    Perf.stop();
	  }
	  console.log('initial render complete. render time: (', tPostRender - tPreRender, ' ms)');
	  if (Perf) {
	    console.log('inclusive:');
	    Perf.printInclusive();
	    console.log('exclusive:');
	    Perf.printExclusive();
	    console.log('wasted:');
	    Perf.printWasted();
	  }
	}
	
	var testStateUrl = 'testData/renderTest-chromeWindowSnap.json';
	
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

/***/ 365:
/*!**************************************!*\
  !*** ./~/react-addons-perf/index.js ***!
  \**************************************/
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(/*! react/lib/ReactDefaultPerf */ 189);

/***/ },

/***/ 366:
/*!********************************!*\
  !*** ./src/js/renderCommon.js ***!
  \********************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.renderPopup = renderPopup;
	exports.getFocusedAndRender = getFocusedAndRender;
	
	var _react = __webpack_require__(/*! react */ 10);
	
	var React = _interopRequireWildcard(_react);
	
	var _reactDom = __webpack_require__(/*! react-dom */ 67);
	
	var ReactDOM = _interopRequireWildcard(_reactDom);
	
	var _utils = __webpack_require__(/*! ./utils */ 367);
	
	var _index = __webpack_require__(/*! ../tabli-core/src/js/index */ 2);
	
	var Tabli = _interopRequireWildcard(_index);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	/**
	 * common rendering entry point for popup and popout
	 */
	
	
	var Popup = Tabli.components.Popup;
	var actions = Tabli.actions;
	
	/**
	 * Main entry point to rendering the popup window
	 */
	function renderPopup(storeRef, currentChromeWindow, isPopout, doSync) {
	  console.log('renderPopup: isPopout: ', isPopout);
	
	  var tPreRender = performance.now();
	
	  var parentNode = document.getElementById('windowList-region');
	
	  var appElement = React.createElement(Popup, { storeRef: storeRef, initialWinStore: storeRef.getValue(), isPopout: isPopout });
	  var appComponent = ReactDOM.render(appElement, parentNode); // eslint-disable-line no-unused-vars
	  var tPostRender = performance.now();
	  console.log('full render complete. render time: (', tPostRender - tPreRender, ' ms)');
	
	  // And sync our window state, which may update the UI...
	  if (doSync) {
	    actions.syncChromeWindows((0, _utils.logWrap)(function (uf) {
	      console.log('postLoadRender: window sync complete');
	      var savedStore = storeRef.getValue();
	      var syncStore = uf(savedStore);
	
	      // And set current focused window:
	      console.log('renderPopup: setting current window to ', currentChromeWindow);
	      var nextStore = syncStore.setCurrentWindow(currentChromeWindow);
	      if (!nextStore.equals(savedStore)) {
	        storeRef.setValue(nextStore);
	      } else {
	        console.log('doRender: nextStore.equals(savedStore) -- skipping setValue');
	      }
	
	      // logHTML("Updated savedHTML", renderedString)
	      var tPostSyncUpdate = performance.now();
	      console.log('syncChromeWindows and update complete: ', tPostSyncUpdate - tPreRender, ' ms');
	      document.getElementById('searchBox').focus();
	    }));
	  }
	}
	
	function getFocusedAndRender(isPopout) {
	  var bgPage = chrome.extension.getBackgroundPage();
	  var storeRef = bgPage.storeRef;
	  chrome.windows.getCurrent(null, function (currentChromeWindow) {
	    renderPopup(storeRef, currentChromeWindow, isPopout, true);
	  });
	}

/***/ },

/***/ 367:
/*!*************************!*\
  !*** ./src/js/utils.js ***!
  \*************************/
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.logWrap = logWrap;
	// wrapper to log exceptions
	function logWrap(f) {
	  function wf() {
	    var ret;
	    try {
	      ret = f.apply(this, arguments);
	    } catch (e) {
	      console.error('logWrap: caught exception invoking function: ');
	      console.error(e.stack);
	      throw e;
	    }
	
	    return ret;
	  }
	
	  return wf;
	}

/***/ }

});
//# sourceMappingURL=renderTest.bundle.js.map