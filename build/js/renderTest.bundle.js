webpackJsonp([2],[
/* 0 */
/*!******************************!*\
  !*** ./src/js/renderTest.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var React = _interopRequireWildcard(_reactAddons);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _tabWindow = __webpack_require__(/*! ./tabWindow */ 5);
	
	var TabWindow = _interopRequireWildcard(_tabWindow);
	
	var _tabManagerState = __webpack_require__(/*! ./tabManagerState */ 1);
	
	var _tabManagerState2 = _interopRequireDefault(_tabManagerState);
	
	var _lodash = __webpack_require__(/*! lodash */ 2);
	
	var _ = _interopRequireWildcard(_lodash);
	
	var _components = __webpack_require__(/*! ./components */ 182);
	
	var Components = _interopRequireWildcard(_components);
	
	var _utils = __webpack_require__(/*! ./utils */ 7);
	
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
	
	  var emptyWinStore = new _tabManagerState2['default']();
	
	  var bgPage = chrome.extension.getBackgroundPage();
	
	  var renderTestSavedHTML = bgPage.renderTestSavedHTML;
	
	  /*
	    const savedNode = bgPage.savedNode;
	    console.log("Saved node from bg page: ", savedNode);
	  */
	
	  var mockWinStore = emptyWinStore.registerTabWindows(tabWindows);
	  console.log("Created mockWinStore and registered test windows");
	  console.log("mock winStore: ", mockWinStore.toJS());
	
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

/***/ },
/* 1 */
/*!***********************************!*\
  !*** ./src/js/tabManagerState.js ***!
  \***********************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * application state for tab manager
	 *
	 * We'll instantiate and initialize this in the bgHelper and attach it to the background window,
	 * and then retrieve the instance from the background window in the popup
	 */
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _lodash = __webpack_require__(/*! lodash */ 2);
	
	var _ = _interopRequireWildcard(_lodash);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _tabWindow = __webpack_require__(/*! ./tabWindow */ 5);
	
	var TabWindow = _interopRequireWildcard(_tabWindow);
	
	var TabManagerState = (function (_Immutable$Record) {
	  _inherits(TabManagerState, _Immutable$Record);
	
	  function TabManagerState() {
	    _classCallCheck(this, TabManagerState);
	
	    _get(Object.getPrototypeOf(TabManagerState.prototype), 'constructor', this).apply(this, arguments);
	  }
	
	  _createClass(TabManagerState, [{
	    key: 'registerTabWindow',
	
	    /**
	     * Update store to include the specified window, indexed by 
	     * open window id or bookmark id
	     *
	     * Note that if an earlier snapshot of tabWindow is in the store, it will be
	     * replaced
	     */
	    value: function registerTabWindow(tabWindow) {
	      var nextWindowIdMap = tabWindow.open ? this.windowIdMap.set(tabWindow.openWindowId, tabWindow) : this.windowIdMap;
	      var nextBookmarkIdMap = tabWindow.saved ? this.bookmarkIdMap.set(tabWindow.savedFolderId, tabWindow) : this.bookmarkIdMap;
	
	      return this.set('windowIdMap', nextWindowIdMap).set('bookmarkIdMap', nextBookmarkIdMap);
	    }
	  }, {
	    key: 'registerTabWindows',
	    value: function registerTabWindows(tabWindows) {
	      return _.reduce(tabWindows, function (acc, w) {
	        return acc.registerTabWindow(w);
	      }, this);
	    }
	  }, {
	    key: 'handleTabWindowClosed',
	    value: function handleTabWindowClosed(tabWindow) {
	      /*
	       * We only remove window from map of open windows (windowIdMap) but then we re-register
	       * reverted window to ensure that a reverted version of saved window stays in
	       * bookmarkIdMap.
	       */
	      var closedWindowIdMap = this.windowIdMap['delete'](tabWindow.openWindowId);
	
	      var revertedWindow = TabWindow.removeOpenWindowState(tabWindow);
	
	      return this.set('windowIdMap', closedWindowIdMap).registerTabWindow(revertedWindow);
	    }
	  }, {
	    key: 'handleTabClosed',
	    value: function handleTabClosed(tabWindow, tabId) {
	      var updWindow = TabWindow.closeTab(tabWindow, tabId);
	      return this.registerTabWindow(updWindow);
	    }
	  }, {
	    key: 'handleTabSaved',
	    value: function handleTabSaved(tabWindow, tabItem, tabNode) {
	      var updWindow = TabWindow.saveTab(tabWindow, tabItem, tabNode);
	      return this.registerTabWindow(updWindow);
	    }
	  }, {
	    key: 'handleTabUnsaved',
	    value: function handleTabUnsaved(tabWindow, tabItem) {
	      var updWindow = TabWindow.unsaveTab(tabWindow, tabItem);
	      return this.registerTabWindow(updWindow);
	    }
	
	    /**
	     * attach a Chrome window to a specific tab window (after opening a saved window)
	     */
	  }, {
	    key: 'attachChromeWindow',
	    value: function attachChromeWindow(tabWindow, chromeWindow) {
	      // Was this Chrome window id previously associated with some other tab window?
	      var oldTabWindow = this.windowIdMap.get(chromeWindow.id);
	
	      // A store without oldTabWindow
	      var rmStore = oldTabWindow ? this.handleTabWindowClosed(oldTabWindow) : this;
	
	      var attachedTabWindow = TabWindow.updateWindow(tabWindow, chromeWindow);
	
	      return rmStore.registerTabWindow(attachedTabWindow);
	    }
	
	    /**
	     * Synchronize internal state of our store with snapshot
	     * of current Chrome window state
	     *
	     * @param chromeWindow window to synchronize
	     */
	  }, {
	    key: 'syncChromeWindow',
	    value: function syncChromeWindow(chromeWindow) {
	      var prevTabWindow = this.windowIdMap.get(chromeWindow.id);
	      var tabWindow = prevTabWindow ? TabWindow.updateWindow(prevTabWindow, chromeWindow) : TabWindow.makeChromeTabWindow(chromeWindow);
	
	      return this.registerTabWindow(tabWindow);
	    }
	
	    /**
	     * synchronize the currently open windows from chrome.windows.getAll with 
	     * internal map of open windows
	     */
	  }, {
	    key: 'syncWindowList',
	    value: function syncWindowList(chromeWindowList) {
	      var tabWindows = this.getOpen();
	
	      // Iterate through tab windows (our current list of open windows)
	      // closing any not in chromeWindowList:
	      var chromeIds = _.pluck(chromeWindowList, 'id');
	      var chromeIdSet = new Set(chromeIds);
	
	      var closedWindows = _.filter(tabWindows, function (tw) {
	        return !chromeIdSet.has(tw.openWindowId);
	      });
	
	      var closedWinStore = _.reduce(closedWindows, function (acc, tw) {
	        return acc.handleTabWindowClosed(tw);
	      }, this);
	
	      // Now update all open windows:
	      return _.reduce(chromeWindowList, function (acc, cw) {
	        return acc.syncChromeWindow(cw);
	      }, closedWinStore);
	    }
	  }, {
	    key: 'setCurrentWindow',
	    value: function setCurrentWindow(windowId) {
	      var tabWindow = this.getTabWindowByChromeId(windowId);
	
	      if (!tabWindow) {
	        console.log("setCurrentWindow: window id ", windowId, "not found");
	        return;
	      }
	
	      // TODO: We really should find any other window with focus===true and clear it
	      var updWindow = tabWindow.set('focused', true);
	      return this.registerTabWindow(updWindow);
	    }
	  }, {
	    key: 'removeBookmarkIdMapEntry',
	    value: function removeBookmarkIdMapEntry(tabWindow) {
	      return this.set('bookmarkIdMap', this.bookmarkIdMap['delete'](tabWindow.savedFolderId));
	    }
	  }, {
	    key: 'unmanageWindow',
	    value: function unmanageWindow(tabWindow) {
	      // Get a view of this store with tabWindow removed from bookmarkIdMap:
	      var rmStore = this.removeBookmarkIdMapEntry(tabWindow);
	
	      // disconnect from the previously associated bookmark folder and re-register
	      var umWindow = TabWindow.removeSavedWindowState(tabWindow);
	      return rmStore.registerTabWindow(umWindow);
	    }
	
	    /**
	     * attach a bookmark folder to a specific chrome window
	     */
	  }, {
	    key: 'attachBookmarkFolder',
	    value: function attachBookmarkFolder(bookmarkFolder, chromeWindow) {
	      var folderTabWindow = TabWindow.makeFolderTabWindow(bookmarkFolder);
	
	      var mergedTabWindow = TabWindow.updateWindow(folderTabWindow, chromeWindow);
	
	      // And re-register in store maps:
	      return this.registerTabWindow(mergedTabWindow);
	    }
	
	    /**
	     * get the currently open tab windows
	     */
	  }, {
	    key: 'getOpen',
	    value: function getOpen() {
	      var openWindows = this.windowIdMap.toIndexedSeq().toArray();
	      return openWindows;
	    }
	  }, {
	    key: 'getAll',
	    value: function getAll() {
	      var openWindows = this.getOpen();
	      var closedSavedWindows = this.bookmarkIdMap.toIndexedSeq().filter(function (w) {
	        return !w.open;
	      }).toArray();
	      return openWindows.concat(closedSavedWindows);
	    }
	
	    // returns a tabWindow or undefined
	  }, {
	    key: 'getTabWindowByChromeId',
	    value: function getTabWindowByChromeId(windowId) {
	      return this.windowIdMap.get(windowId);
	    }
	  }, {
	    key: 'countOpenWindows',
	    value: function countOpenWindows() {
	      return this.windowIdMap.count();
	    }
	  }, {
	    key: 'countSavedWindows',
	    value: function countSavedWindows() {
	      return this.bookmarkIdMap.count();
	    }
	  }, {
	    key: 'countOpenTabs',
	    value: function countOpenTabs() {
	      return this.windowIdMap.reduce(function (count, w) {
	        return count + w.openTabCount;
	      }, 0);
	    }
	  }]);
	
	  return TabManagerState;
	})(Immutable.Record({
	  windowIdMap: Immutable.Map(), // maps from chrome window id for open windows
	  bookmarkIdMap: Immutable.Map(), // maps from bookmark id for saved windows
	  folderId: -1,
	  archiveFolderId: -1
	}));
	
	exports['default'] = TabManagerState;
	module.exports = exports['default'];

/***/ }
]);
//# sourceMappingURL=renderTest.bundle.js.map