webpackJsonp([2],[
/* 0 */
/*!*************************!*\
  !*** ./src/js/popup.js ***!
  \*************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _actions = __webpack_require__(/*! ./actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _utils = __webpack_require__(/*! ./utils */ 7);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _componentsTabliPopup = __webpack_require__(/*! ./components/TabliPopup */ 215);
	
	var _componentsTabliPopup2 = _interopRequireDefault(_componentsTabliPopup);
	
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	
	function logHTML(labelStr, htmlStr) {
	  var fullLogStr = labelStr + ":\n%o";
	
	  var div = document.createElement('div');
	  div.innerHTML = htmlStr;
	  console.log(fullLogStr, div.firstChild);
	}
	
	/**
	 * Main entry point to rendering the popup window
	 */
	function renderPopup(currentWindowId) {
	  var t_preRender = performance.now();
	  var bgPage = chrome.extension.getBackgroundPage();
	
	  var storeRef = bgPage.storeRef;
	  var savedStore = bgPage.savedStore;
	  var savedHTML = bgPage.savedHTML;
	
	  var parentNode = document.getElementById('windowList-region');
	
	  /*
	   * We do a quick immediate render using saved HTML and then use setTimeout()
	   * to initate a more complete sync operation
	   */
	
	  if (savedHTML) {
	    parentNode.innerHTML = savedHTML;
	    var t_postSet = performance.now();
	    console.log("time to set initial HTML: ", t_postSet - t_preRender);
	    // logHTML("loaded HTML", savedHTML);
	  }
	
	  /*
	   * We make our initial call to create and render the React component tree on a zero timeout
	   * to give this handler a chance to complete and allow Chrome to render the initial
	   * HTML set from savedHTML
	   */
	
	  function doRender() {
	    /* First:let's render *before* sync'ing so that we match the pre-rendered HTML... */
	    /* Note (!!): We use savedStore here to ensured that the store state exactly matches savedHTML; we'll simply ignore
	     * any possible store updates that happened since last save
	     */
	    // console.log("doRender: About to render using savedStore: ", savedStore.toJS());
	    var appElement = React.createElement(_componentsTabliPopup2['default'], { storeRef: storeRef, initialWinStore: savedStore });
	    var appComponent = React.render(appElement, parentNode);
	    var t_postRender = performance.now();
	    console.log("full render complete. render time: (", t_postRender - t_preRender, " ms)");
	
	    // And sync our window state, which may update the UI...
	    actions.syncChromeWindows((0, _utils.logWrap)(function (uf) {
	      // console.log("postLoadRender: window sync complete");
	      var syncStore = uf(savedStore);
	
	      // And set current focused window:
	      var nextStore = syncStore.setCurrentWindow(currentWindowId);
	      storeRef.setValue(nextStore);
	
	      // logHTML("Updated savedHTML", renderedString);
	      var t_postSyncUpdate = performance.now();
	      console.log("syncChromeWindows and update complete: ", t_postSyncUpdate - t_preRender, " ms");
	      document.getElementById("searchBox").focus();
	    }));
	  }
	
	  setTimeout(doRender, 0);
	}
	
	function getFocusedAndRender() {
	  chrome.windows.getCurrent(null, function (currentWindow) {
	    renderPopup(currentWindow.id);
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

/***/ }
]);
//# sourceMappingURL=popup.bundle.js.map