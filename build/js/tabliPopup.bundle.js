webpackJsonp([3],{

/***/ 0:
/*!******************************!*\
  !*** ./src/js/tabliPopup.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _renderCommon = __webpack_require__(/*! ./renderCommon */ 351);
	
	var RenderCommon = _interopRequireWildcard(_renderCommon);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
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
	  window.onload = function () {
	    return RenderCommon.getFocusedAndRender(false);
	  };
	}
	
	main();

/***/ },

/***/ 1:
/*!*********************************!*\
  !*** ./src/js/chromeBrowser.js ***!
  \*********************************/
/***/ function(module, exports) {

	"use strict";
	
	/**
	 * Implementation of Tabli browser interface for Google Chrome, using extensions API
	 *
	 * Only import this module from Chrome!
	 */
	var chromeBrowser = {
	
	  // make a tab (identified by tab id) the currently focused tab:
	  activateTab: function activateTab(tabId, callback) {
	    chrome.tabs.update(tabId, { active: true }, callback);
	  },
	
	  setFocusedWindow: function setFocusedWindow(windowId, callback) {
	    chrome.windows.update(windowId, { focused: true }, callback);
	  }
	};
	
	window.tabliBrowser = chromeBrowser;
	
	module.exports = chromeBrowser;

/***/ },

/***/ 351:
/*!********************************!*\
  !*** ./src/js/renderCommon.js ***!
  \********************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getFocusedAndRender = getFocusedAndRender;
	
	var _chromeBrowser = __webpack_require__(/*! ./chromeBrowser */ 1);
	
	var _chromeBrowser2 = _interopRequireDefault(_chromeBrowser);
	
	var _react = __webpack_require__(/*! react */ 9);
	
	var React = _interopRequireWildcard(_react);
	
	var _reactDom = __webpack_require__(/*! react-dom */ 64);
	
	var ReactDOM = _interopRequireWildcard(_reactDom);
	
	var _utils = __webpack_require__(/*! ./utils */ 352);
	
	var _index = __webpack_require__(/*! ../tabli-core/src/js/index */ 2);
	
	var Tabli = _interopRequireWildcard(_index);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var Popup = Tabli.components.Popup; /**
	                                     * common rendering entry point for popup and popout
	                                     */
	
	var actions = Tabli.actions;
	
	/**
	 * Main entry point to rendering the popup window
	 */
	function renderPopup(currentChromeWindow, isPopout) {
	
	  console.log("renderPopup: isPopout: ", isPopout);
	
	  var t_preRender = performance.now();
	  var bgPage = chrome.extension.getBackgroundPage();
	
	  var storeRef = bgPage.storeRef;
	
	  var parentNode = document.getElementById('windowList-region');
	
	  var appElement = React.createElement(Popup, { storeRef: storeRef, initialWinStore: storeRef.getValue(), isPopout: isPopout });
	  var appComponent = ReactDOM.render(appElement, parentNode); // eslint-disable-line no-unused-vars
	  var t_postRender = performance.now();
	  console.log('full render complete. render time: (', t_postRender - t_preRender, ' ms)');
	
	  // And sync our window state, which may update the UI...
	  actions.syncChromeWindows((0, _utils.logWrap)(function (uf) {
	    console.log("postLoadRender: window sync complete");
	    var savedStore = storeRef.getValue();
	    var syncStore = uf(savedStore);
	
	    // And set current focused window:
	    console.log("renderPopup: setting current window to ", currentChromeWindow);
	    var nextStore = syncStore.setCurrentWindow(currentChromeWindow);
	    if (!nextStore.equals(savedStore)) {
	      storeRef.setValue(nextStore);
	    } else {
	      console.log("doRender: nextStore.equals(savedStore) -- skipping setValue");
	    }
	
	    // logHTML("Updated savedHTML", renderedString);
	    var t_postSyncUpdate = performance.now();
	    console.log('syncChromeWindows and update complete: ', t_postSyncUpdate - t_preRender, ' ms');
	    document.getElementById('searchBox').focus();
	  }));
	}
	
	function getFocusedAndRender(isPopout) {
	  chrome.windows.getCurrent(null, function (currentChromeWindow) {
	    renderPopup(currentChromeWindow, isPopout);
	  });
	}

/***/ },

/***/ 352:
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
//# sourceMappingURL=tabliPopup.bundle.js.map