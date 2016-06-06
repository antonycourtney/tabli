webpackJsonp([1],{

/***/ 0:
/*!******************************!*\
  !*** ./src/js/renderTest.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _react = __webpack_require__(/*! react */ 10);
	
	var React = _interopRequireWildcard(_react);
	
	var _immutable = __webpack_require__(/*! immutable */ 6);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddonsPerf = __webpack_require__(/*! react-addons-perf */ 365);
	
	var Perf = _interopRequireWildcard(_reactAddonsPerf);
	
	var _reactDom = __webpack_require__(/*! react-dom */ 67);
	
	var ReactDOM = _interopRequireWildcard(_reactDom);
	
	var _server = __webpack_require__(/*! react-dom/server */ 360);
	
	var ReactDOMServer = _interopRequireWildcard(_server);
	
	var _index = __webpack_require__(/*! ../tabli-core/src/js/index */ 2);
	
	var Tabli = _interopRequireWildcard(_index);
	
	var _renderCommon = __webpack_require__(/*! ./renderCommon */ 366);
	
	var RenderCommon = _interopRequireWildcard(_renderCommon);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	var TabManagerState = Tabli.TabManagerState;
	var TabWindow = Tabli.TabWindow;
	var Popup = Tabli.components.Popup;
	var Styles = Tabli.components.Styles;
	var ViewRef = Tabli.ViewRef;
	
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
	
	  var t_preRender = performance.now();
	
	  // N.B. false last arg to prevent sync'ing current chrome windows
	  RenderCommon.renderPopup(storeRef, currentChromeWindow, false, false);
	
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

/***/ 360:
/*!*******************************!*\
  !*** ./~/react-dom/server.js ***!
  \*******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	module.exports = __webpack_require__(/*! react/lib/ReactDOMServer */ 361);


/***/ },

/***/ 361:
/*!***************************************!*\
  !*** ./~/react/lib/ReactDOMServer.js ***!
  \***************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-present, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMServer
	 */
	
	'use strict';
	
	var ReactDefaultInjection = __webpack_require__(/*! ./ReactDefaultInjection */ 72);
	var ReactServerRendering = __webpack_require__(/*! ./ReactServerRendering */ 362);
	var ReactVersion = __webpack_require__(/*! ./ReactVersion */ 40);
	
	ReactDefaultInjection.inject();
	
	var ReactDOMServer = {
	  renderToString: ReactServerRendering.renderToString,
	  renderToStaticMarkup: ReactServerRendering.renderToStaticMarkup,
	  version: ReactVersion
	};
	
	module.exports = ReactDOMServer;

/***/ },

/***/ 362:
/*!*********************************************!*\
  !*** ./~/react/lib/ReactServerRendering.js ***!
  \*********************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-present, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactServerRendering
	 */
	'use strict';
	
	var ReactDOMContainerInfo = __webpack_require__(/*! ./ReactDOMContainerInfo */ 192);
	var ReactDefaultBatchingStrategy = __webpack_require__(/*! ./ReactDefaultBatchingStrategy */ 163);
	var ReactElement = __webpack_require__(/*! ./ReactElement */ 17);
	var ReactMarkupChecksum = __webpack_require__(/*! ./ReactMarkupChecksum */ 194);
	var ReactServerBatchingStrategy = __webpack_require__(/*! ./ReactServerBatchingStrategy */ 363);
	var ReactServerRenderingTransaction = __webpack_require__(/*! ./ReactServerRenderingTransaction */ 364);
	var ReactUpdates = __webpack_require__(/*! ./ReactUpdates */ 89);
	
	var emptyObject = __webpack_require__(/*! fbjs/lib/emptyObject */ 30);
	var instantiateReactComponent = __webpack_require__(/*! ./instantiateReactComponent */ 150);
	var invariant = __webpack_require__(/*! fbjs/lib/invariant */ 16);
	
	/**
	 * @param {ReactElement} element
	 * @return {string} the HTML markup
	 */
	function renderToStringImpl(element, makeStaticMarkup) {
	  var transaction;
	  try {
	    ReactUpdates.injection.injectBatchingStrategy(ReactServerBatchingStrategy);
	
	    transaction = ReactServerRenderingTransaction.getPooled(makeStaticMarkup);
	
	    return transaction.perform(function () {
	      var componentInstance = instantiateReactComponent(element);
	      var markup = componentInstance.mountComponent(transaction, null, ReactDOMContainerInfo(), emptyObject);
	      if (!makeStaticMarkup) {
	        markup = ReactMarkupChecksum.addChecksumToMarkup(markup);
	      }
	      return markup;
	    }, null);
	  } finally {
	    ReactServerRenderingTransaction.release(transaction);
	    // Revert to the DOM batching strategy since these two renderers
	    // currently share these stateful modules.
	    ReactUpdates.injection.injectBatchingStrategy(ReactDefaultBatchingStrategy);
	  }
	}
	
	function renderToString(element) {
	  !ReactElement.isValidElement(element) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'renderToString(): You must pass a valid ReactElement.') : invariant(false) : void 0;
	  return renderToStringImpl(element, false);
	}
	
	function renderToStaticMarkup(element) {
	  !ReactElement.isValidElement(element) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'renderToStaticMarkup(): You must pass a valid ReactElement.') : invariant(false) : void 0;
	  return renderToStringImpl(element, true);
	}
	
	module.exports = {
	  renderToString: renderToString,
	  renderToStaticMarkup: renderToStaticMarkup
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! ./~/process/browser.js */ 12)))

/***/ },

/***/ 363:
/*!****************************************************!*\
  !*** ./~/react/lib/ReactServerBatchingStrategy.js ***!
  \****************************************************/
/***/ function(module, exports) {

	/**
	 * Copyright 2014-present, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactServerBatchingStrategy
	 */
	
	'use strict';
	
	var ReactServerBatchingStrategy = {
	  isBatchingUpdates: false,
	  batchedUpdates: function (callback) {
	    // Don't do anything here. During the server rendering we don't want to
	    // schedule any updates. We will simply ignore them.
	  }
	};
	
	module.exports = ReactServerBatchingStrategy;

/***/ },

/***/ 364:
/*!********************************************************!*\
  !*** ./~/react/lib/ReactServerRenderingTransaction.js ***!
  \********************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2014-present, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactServerRenderingTransaction
	 */
	
	'use strict';
	
	var _assign = __webpack_require__(/*! object-assign */ 13);
	
	var PooledClass = __webpack_require__(/*! ./PooledClass */ 15);
	var Transaction = __webpack_require__(/*! ./Transaction */ 96);
	
	/**
	 * Executed within the scope of the `Transaction` instance. Consider these as
	 * being member methods, but with an implied ordering while being isolated from
	 * each other.
	 */
	var TRANSACTION_WRAPPERS = [];
	
	var noopCallbackQueue = {
	  enqueue: function () {}
	};
	
	/**
	 * @class ReactServerRenderingTransaction
	 * @param {boolean} renderToStaticMarkup
	 */
	function ReactServerRenderingTransaction(renderToStaticMarkup) {
	  this.reinitializeTransaction();
	  this.renderToStaticMarkup = renderToStaticMarkup;
	  this.useCreateElement = false;
	}
	
	var Mixin = {
	  /**
	   * @see Transaction
	   * @abstract
	   * @final
	   * @return {array} Empty list of operation wrap procedures.
	   */
	  getTransactionWrappers: function () {
	    return TRANSACTION_WRAPPERS;
	  },
	
	  /**
	   * @return {object} The queue to collect `onDOMReady` callbacks with.
	   */
	  getReactMountReady: function () {
	    return noopCallbackQueue;
	  },
	
	  /**
	   * `PooledClass` looks for this, and will invoke this before allowing this
	   * instance to be reused.
	   */
	  destructor: function () {}
	};
	
	_assign(ReactServerRenderingTransaction.prototype, Transaction.Mixin, Mixin);
	
	PooledClass.addPoolingTo(ReactServerRenderingTransaction);
	
	module.exports = ReactServerRenderingTransaction;

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
	
	var _chromeBrowser = __webpack_require__(/*! ./chromeBrowser */ 1);
	
	var _chromeBrowser2 = _interopRequireDefault(_chromeBrowser);
	
	var _react = __webpack_require__(/*! react */ 10);
	
	var React = _interopRequireWildcard(_react);
	
	var _reactDom = __webpack_require__(/*! react-dom */ 67);
	
	var ReactDOM = _interopRequireWildcard(_reactDom);
	
	var _utils = __webpack_require__(/*! ./utils */ 367);
	
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
	function renderPopup(storeRef, currentChromeWindow, isPopout, doSync) {
	  console.log('renderPopup: isPopout: ', isPopout);
	
	  var t_preRender = performance.now();
	
	  var parentNode = document.getElementById('windowList-region');
	
	  var appElement = React.createElement(Popup, { storeRef: storeRef, initialWinStore: storeRef.getValue(), isPopout: isPopout });
	  var appComponent = ReactDOM.render(appElement, parentNode); // eslint-disable-line no-unused-vars
	  var t_postRender = performance.now();
	  console.log('full render complete. render time: (', t_postRender - t_preRender, ' ms)');
	
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
	      var t_postSyncUpdate = performance.now();
	      console.log('syncChromeWindows and update complete: ', t_postSyncUpdate - t_preRender, ' ms');
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