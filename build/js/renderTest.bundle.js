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
	
	var _reactAddonsPerf = __webpack_require__(/*! react-addons-perf */ 207);
	
	var Perf = _interopRequireWildcard(_reactAddonsPerf);
	
	var _reactDom = __webpack_require__(/*! react-dom */ 64);
	
	var ReactDOM = _interopRequireWildcard(_reactDom);
	
	var _server = __webpack_require__(/*! react-dom/server */ 202);
	
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

/***/ 202:
/*!*******************************!*\
  !*** ./~/react-dom/server.js ***!
  \*******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	module.exports = __webpack_require__(/*! react/lib/ReactDOMServer */ 203);


/***/ },

/***/ 203:
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
	
	var ReactDefaultInjection = __webpack_require__(/*! ./ReactDefaultInjection */ 69);
	var ReactServerRendering = __webpack_require__(/*! ./ReactServerRendering */ 204);
	var ReactVersion = __webpack_require__(/*! ./ReactVersion */ 38);
	
	ReactDefaultInjection.inject();
	
	var ReactDOMServer = {
	  renderToString: ReactServerRendering.renderToString,
	  renderToStaticMarkup: ReactServerRendering.renderToStaticMarkup,
	  version: ReactVersion
	};
	
	module.exports = ReactDOMServer;

/***/ },

/***/ 204:
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
	
	var ReactDOMContainerInfo = __webpack_require__(/*! ./ReactDOMContainerInfo */ 188);
	var ReactDefaultBatchingStrategy = __webpack_require__(/*! ./ReactDefaultBatchingStrategy */ 159);
	var ReactElement = __webpack_require__(/*! ./ReactElement */ 16);
	var ReactMarkupChecksum = __webpack_require__(/*! ./ReactMarkupChecksum */ 190);
	var ReactServerBatchingStrategy = __webpack_require__(/*! ./ReactServerBatchingStrategy */ 205);
	var ReactServerRenderingTransaction = __webpack_require__(/*! ./ReactServerRenderingTransaction */ 206);
	var ReactUpdates = __webpack_require__(/*! ./ReactUpdates */ 86);
	
	var emptyObject = __webpack_require__(/*! fbjs/lib/emptyObject */ 28);
	var instantiateReactComponent = __webpack_require__(/*! ./instantiateReactComponent */ 146);
	var invariant = __webpack_require__(/*! fbjs/lib/invariant */ 15);
	
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
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! ./~/process/browser.js */ 11)))

/***/ },

/***/ 205:
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

/***/ 206:
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
	
	var _assign = __webpack_require__(/*! object-assign */ 12);
	
	var PooledClass = __webpack_require__(/*! ./PooledClass */ 14);
	var Transaction = __webpack_require__(/*! ./Transaction */ 93);
	
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

/***/ 207:
/*!**************************************!*\
  !*** ./~/react-addons-perf/index.js ***!
  \**************************************/
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(/*! react/lib/ReactDefaultPerf */ 185);

/***/ }

});
//# sourceMappingURL=renderTest.bundle.js.map