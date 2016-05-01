webpackJsonp([0],{

/***/ 0:
/*!****************************!*\
  !*** ./src/js/bgHelper.js ***!
  \****************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _chromeBrowser = __webpack_require__(/*! ./chromeBrowser */ 1);
	
	var _chromeBrowser2 = _interopRequireDefault(_chromeBrowser);
	
	var _index = __webpack_require__(/*! ../tabli-core/src/js/index */ 2);
	
	var Tabli = _interopRequireWildcard(_index);
	
	var _lodash = __webpack_require__(/*! lodash */ 4);
	
	var _ = _interopRequireWildcard(_lodash);
	
	var _immutable = __webpack_require__(/*! immutable */ 6);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _react = __webpack_require__(/*! react */ 9);
	
	var React = _interopRequireWildcard(_react);
	
	var _server = __webpack_require__(/*! react-dom/server */ 344);
	
	var ReactDOMServer = _interopRequireWildcard(_server);
	
	var _oneref = __webpack_require__(/*! oneref */ 43);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * Background helper page.
	 * Gathering bookmark and window state and places in local storage so that
	 * popup rendering will be as fast as possible
	 */
	
	
	var TabManagerState = Tabli.TabManagerState;
	var TabWindow = Tabli.TabWindow;
	var Popup = Tabli.components.Popup;
	var actions = Tabli.actions;
	var ViewRef = Tabli.ViewRef;
	var utils = Tabli.utils;
	
	var tabmanFolderTitle = 'Tabli Saved Windows';
	var archiveFolderTitle = '_Archive';
	
	/* On startup load managed windows from bookmarks folder */
	function loadManagedWindows(winStore, tabManFolder) {
	  var folderTabWindows = [];
	  for (var i = 0; i < tabManFolder.children.length; i++) {
	    var windowFolder = tabManFolder.children[i];
	    if (windowFolder.title[0] === '_') {
	      continue;
	    }
	
	    var fc = windowFolder.children;
	    if (!fc) {
	      console.log('Found bookmarks folder with no children, skipping: ', fc);
	      continue;
	    }
	
	    folderTabWindows.push(TabWindow.makeFolderTabWindow(windowFolder));
	  }
	
	  return winStore.registerTabWindows(folderTabWindows);
	}
	
	/*
	 * given a specific parent Folder node, ensure a particular child exists.
	 * Will invoke callback either synchronously or asynchronously passing the node
	 * for the named child
	 */
	function ensureChildFolder(parentNode, childFolderName, callback) {
	  if (parentNode.children) {
	    for (var i = 0; i < parentNode.children.length; i++) {
	      var childFolder = parentNode.children[i];
	      if (childFolder.title.toLowerCase() === childFolderName.toLowerCase()) {
	        // exists
	        // console.log( "found target child folder: ", childFolderName );
	        callback(childFolder);
	        return true;
	      }
	    }
	  }
	
	  console.log('Child folder ', childFolderName, ' Not found, creating...');
	
	  // If we got here, child Folder doesn't exist
	  var folderObj = { parentId: parentNode.id, title: childFolderName };
	  chrome.bookmarks.create(folderObj, callback);
	}
	
	/**
	 * acquire main folder and archive folder and initialize
	 * window store
	 */
	function initWinStore(cb) {
	  var tabmanFolderId = null;
	  var archiveFolderId = null;
	
	  chrome.bookmarks.getTree(function (tree) {
	    var otherBookmarksNode = tree[0].children[1];
	
	    // console.log( "otherBookmarksNode: ", otherBookmarksNode );
	    ensureChildFolder(otherBookmarksNode, tabmanFolderTitle, function (tabManFolder) {
	      // console.log('tab manager folder acquired.');
	      tabmanFolderId = tabManFolder.id;
	      ensureChildFolder(tabManFolder, archiveFolderTitle, function (archiveFolder) {
	        // console.log('archive folder acquired.');
	        archiveFolderId = archiveFolder.id;
	        chrome.bookmarks.getSubTree(tabManFolder.id, function (subTreeNodes) {
	          // console.log("bookmarks.getSubTree for TabManFolder: ", subTreeNodes);
	          var baseWinStore = new TabManagerState({ folderId: tabmanFolderId, archiveFolderId: archiveFolderId });
	          var loadedWinStore = loadManagedWindows(baseWinStore, subTreeNodes[0]);
	          cb(loadedWinStore);
	        });
	      });
	    });
	  });
	}
	
	function setupConnectionListener(storeRef) {
	  chrome.runtime.onConnect.addListener(function (port) {
	    port.onMessage.addListener(function (msg) {
	      var listenerId = msg.listenerId;
	      port.onDisconnect.addListener(function () {
	        storeRef.removeViewListener(listenerId);
	        //        console.log("Removed view listener ", listenerId);
	        //        console.log("after remove: ", storeRef);
	      });
	    });
	  });
	}
	
	/**
	 * Download the specified object as JSON (for testing)
	 */
	function downloadJSON(dumpObj, filename) {
	  var dumpStr = JSON.stringify(dumpObj, null, 2);
	  var winBlob = new Blob([dumpStr], { type: 'application/json' });
	  var url = URL.createObjectURL(winBlob);
	  chrome.downloads.download({ url: url, filename: filename });
	}
	
	/**
	 * dump all windows -- useful for creating performance tests
	 *
	 * NOTE:  Requires the "downloads" permission in the manifest!
	 */
	function dumpAll(winStore) {
	  // eslint-disable-line no-unused-vars
	  var allWindows = winStore.getAll();
	
	  var jsWindows = allWindows.map(function (tw) {
	    return tw.toJS();
	  });
	
	  var dumpObj = { allWindows: jsWindows };
	
	  downloadJSON(dumpObj, 'winStoreSnap.json');
	}
	
	function dumpChromeWindows() {
	  // eslint-disable-line no-unused-vars
	  chrome.windows.getAll({ populate: true }, function (chromeWindows) {
	    downloadJSON({ chromeWindows: chromeWindows }, 'chromeWindowSnap.json');
	  });
	}
	
	/**
	 * create a TabMan element, render it to HTML and save it for fast loading when
	 * opening the popup
	 */
	
	function invokeLater(f) {
	  window.setTimeout(f, 0);
	}
	
	function onTabCreated(uf, tab, markActive) {
	  // console.log("onTabCreated: ", tab);
	  uf(function (state) {
	    var tabWindow = state.getTabWindowByChromeId(tab.windowId);
	    if (!tabWindow) {
	      console.warn("tabs.onCreated: window id not found: ", tab.windowId);
	      return state;
	    }
	    var st = state.handleTabCreated(tabWindow, tab);
	    var nw = st.getTabWindowByChromeId(tab.windowId);
	    var ast = markActive ? st.handleTabActivated(nw, tab.id) : st;
	    return ast;
	  });
	}
	
	function onTabRemoved(uf, windowId, tabId) {
	  uf(function (state) {
	    var tabWindow = state.getTabWindowByChromeId(windowId);
	    if (!tabWindow) {
	      console.warn("tabs.onTabRemoved: window id not found: ", windowId);
	      return state;
	    }
	    return state.handleTabClosed(tabWindow, tabId);
	  });
	}
	
	function registerEventHandlers(uf) {
	  // window events:
	  chrome.windows.onRemoved.addListener(function (windowId) {
	    uf(function (state) {
	      var tabWindow = state.getTabWindowByChromeId(windowId);
	      var st = tabWindow ? state.handleTabWindowClosed(tabWindow) : state;
	      return st;
	    });
	  });
	  chrome.windows.onCreated.addListener(function (chromeWindow) {
	    uf(function (state) {
	      return state.syncChromeWindow(chromeWindow);
	    });
	  });
	  chrome.windows.onFocusChanged.addListener(function (windowId) {
	    if (windowId === chrome.windows.WINDOW_ID_NONE) return;
	    uf(function (state) {
	      return state.setCurrentWindowId(windowId);
	    });
	  }, { windowTypes: ['normal'] });
	
	  // tab events:
	  chrome.tabs.onCreated.addListener(function (tab) {
	    return onTabCreated(uf, tab);
	  });
	  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	    uf(function (state) {
	      var tabWindow = state.getTabWindowByChromeId(tab.windowId);
	      if (!tabWindow) {
	        console.warn("tabs.onUpdated: window id not found: ", tab.windowId);
	        return state;
	      }
	      return state.handleTabUpdated(tabWindow, tabId, changeInfo);
	    });
	  });
	  chrome.tabs.onActivated.addListener(function (activeInfo) {
	    // console.log("tabs.onActivated: ", activeInfo);
	    uf(function (state) {
	      var tabWindow = state.getTabWindowByChromeId(activeInfo.windowId);
	      if (!tabWindow) {
	        console.warn("tabs.onActivated: window id not found: ", activeInfo.windowId, activeInfo);
	        return state;
	      }
	      var st = tabWindow ? state.handleTabActivated(tabWindow, activeInfo.tabId) : state;
	      return st;
	    });
	  });
	  chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	    if (removeInfo.isWindowClosing) {
	      // window closing, ignore...
	      return;
	    }
	    onTabRemoved(uf, removeInfo.windowId, tabId);
	  });
	  chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
	    console.log("tabs.onReplaced: added: ", addedTabId, ", removed: ", removedTabId);
	    uf(function (state) {
	      var tabWindow = state.getTabWindowByChromeTabId(removedTabId);
	      if (!tabWindow) {
	        console.warn("tabs.onReplaced: could not find window for removed tab: ", removedTabId);
	        return state;
	      }
	      var nextSt = state.handleTabClosed(tabWindow, removedTabId);
	
	      // And arrange for the added tab to be added to the window:
	      chrome.tabs.get(addedTabId, function (tab) {
	        return onTabCreated(uf, tab);
	      });
	      return nextSt;
	    });
	  });
	  chrome.tabs.onMoved.addListener(function (tabId, moveInfo) {
	    // console.log("tab.onMoved: ", tabId, moveInfo);
	    // Let's just refresh the whole window:
	    actions.syncChromeWindowById(moveInfo.windowId, uf);
	  });
	  chrome.tabs.onDetached.addListener(function (tabId, detachInfo) {
	    // just handle like tab closing:
	    onTabRemoved(uf, detachInfo.oldWindowId, tabId);
	  });
	  chrome.tabs.onAttached.addListener(function (tabId, attachInfo) {
	    // handle like tab creation:
	    chrome.tabs.get(tabId, function (tab) {
	      return onTabCreated(uf, tab, true);
	    });
	  });
	}
	
	/**
	 * Heuristic scan to find any open windows that seem to have come from saved windows
	 * and re-attach them on initial load of the background page. Mainly useful for
	 * development and for re-starting Tablie.
	 *
	 * Heuristics here are imperfect; only way to get this truly right would be with a proper
	 * session management API.
	 *
	 * calls cb with a TabManager state when complete.
	 *
	 */
	function reattachWindows(bmStore, cb) {
	
	  var MATCH_THRESHOLD = 0.4;
	
	  var urlIdMap = bmStore.getUrlBookmarkIdMap();
	
	  // type constructor for match info:
	  var MatchInfo = Immutable.Record({ windowId: -1, matches: Immutable.Map(), bestMatch: null, tabCount: 0 });
	
	  chrome.windows.getAll({ populate: true }, function (windowList) {
	
	    function getMatchInfo(w) {
	      // matches :: Array<Set<BookmarkId>>
	      var matchSets = w.tabs.map(function (t) {
	        return urlIdMap.get(t.url, null);
	      }).filter(function (x) {
	        return x;
	      });
	      // countMaps :: Array<Map<BookmarkId,Num>>
	      var countMaps = matchSets.map(function (s) {
	        return s.countBy(function (v) {
	          return v;
	        });
	      });
	
	      // Now let's reduce array, merging all maps into a single map, aggregating counts:
	      var aggMerge = function aggMerge(mA, mB) {
	        return mA.mergeWith(function (prev, next) {
	          return prev + next;
	        }, mB);
	      };
	
	      // matchMap :: Map<BookmarkId,Num>
	      var matchMap = countMaps.reduce(aggMerge, Immutable.Map());
	
	      // Ensure (# matches / # saved URLs) for each bookmark > MATCH_THRESHOLD
	      function aboveMatchThreshold(matchCount, bookmarkId) {
	        var savedTabWindow = bmStore.bookmarkIdMap.get(bookmarkId);
	        var savedUrlCount = savedTabWindow.tabItems.count();
	        var matchRatio = matchCount / savedUrlCount;
	        // console.log("match threshold for '", savedTabWindow.title, "': ", matchRatio, matchCount, savedUrlCount);
	        return matchRatio >= MATCH_THRESHOLD;
	      }
	
	      var threshMap = matchMap.filter(aboveMatchThreshold);
	
	      var bestMatch = utils.bestMatch(threshMap);
	
	      return new MatchInfo({ windowId: w.id, matches: matchMap, bestMatch: bestMatch, tabCount: w.tabs.length });
	    }
	
	    /**
	     * We could come up with better heuristics here, but for now we'll be conservative
	     * and only re-attach when there is an unambiguous best match
	     */
	    // Only look at windows that match exactly one bookmark folder
	    // (Could be improved by sorting entries on number of matches and picking best (if there is one))
	    var windowMatchInfo = Immutable.Seq(windowList).map(getMatchInfo).filter(function (mi) {
	      return mi.bestMatch;
	    });
	
	    // console.log("windowMatchInfo: ", windowMatchInfo.toJS());
	
	    // Now gather an inverse map of the form:
	    // Map<BookmarkId,Map<WindowId,Num>>
	    var bmMatches = windowMatchInfo.groupBy(function (mi) {
	      return mi.bestMatch;
	    });
	
	    // console.log("bmMatches: ", bmMatches.toJS());
	
	    // bmMatchMaps: Map<BookmarkId,Map<WindowId,Num>>
	    var bmMatchMaps = bmMatches.map(function (mis) {
	      // mis :: Seq<MatchInfo>
	
	      // mercifully each mi will have a distinct windowId at this point:
	      var entries = mis.map(function (mi) {
	        var matchTabCount = mi.matches.get(mi.bestMatch);
	        return [mi.windowId, matchTabCount];
	      });
	
	      return Immutable.Map(entries);
	    });
	
	    // console.log("bmMatchMaps: ", bmMatchMaps.toJS());
	
	    // bestBMMatches :: Seq.Keyed<BookarkId,WindowId>;
	    var bestBMMatches = bmMatchMaps.map(function (mm) {
	      return utils.bestMatch(mm);
	    }).filter(function (ct) {
	      return ct;
	    });
	    // console.log("bestBMMatches: ", bestBMMatches.toJS());
	
	    // Form a map from chrome window ids to chrome window snapshots:
	    var chromeWinMap = _.fromPairs(windowList.map(function (w) {
	      return [w.id, w];
	    }));
	
	    // And build up our attached state by attaching to each window in bestBMMatches:
	
	    var attacher = function attacher(st, windowId, bookmarkId) {
	      var chromeWindow = chromeWinMap[windowId];
	      var bmTabWindow = st.bookmarkIdMap.get(bookmarkId);
	      var nextSt = st.attachChromeWindow(bmTabWindow, chromeWindow);
	      return nextSt;
	    };
	
	    var attachedStore = bestBMMatches.reduce(attacher, bmStore);
	
	    cb(attachedStore);
	  });
	}
	
	function main() {
	  initWinStore(function (rawBMStore) {
	    reattachWindows(rawBMStore, function (bmStore) {
	      console.log("init: done reading bookmarks and re-attaching: ", bmStore.toJS());
	
	      // window.winStore = winStore;
	      chrome.windows.getCurrent(null, function (currentWindow) {
	        console.log("bgHelper: currentWindow: ", currentWindow);
	        actions.syncChromeWindows(function (uf) {
	          console.log('initial sync of chrome windows complete.');
	          var syncedStore = uf(bmStore).setCurrentWindow(currentWindow);
	          console.log("current window after initial sync: ", syncedStore.currentWindowId, syncedStore.getCurrentWindow());
	          window.storeRef = new ViewRef(syncedStore);
	
	          // dumpAll(syncedStore);
	          // dumpChromeWindows();
	
	          setupConnectionListener(window.storeRef);
	
	          var storeRefUpdater = (0, _oneref.refUpdater)(window.storeRef);
	          registerEventHandlers(storeRefUpdater);
	
	          /*
	           * OK, this really shows limits of our refUpdater strategy, which conflates the
	           * state updater action with the notion of a completion callback.
	           * We really want to use callback chaining to ensure we don't show the popout
	           * until after the popout is closed.
	           */
	          actions.closePopout(window.storeRef.getValue(), function (uf) {
	            storeRefUpdater(uf);
	            actions.showPopout(window.storeRef.getValue(), storeRefUpdater);
	          });
	        });
	      });
	    });
	  });
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

/***/ 344:
/*!*******************************!*\
  !*** ./~/react-dom/server.js ***!
  \*******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	module.exports = __webpack_require__(/*! react/lib/ReactDOMServer */ 345);


/***/ },

/***/ 345:
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
	
	var ReactDefaultInjection = __webpack_require__(/*! ./ReactDefaultInjection */ 68);
	var ReactServerRendering = __webpack_require__(/*! ./ReactServerRendering */ 346);
	var ReactVersion = __webpack_require__(/*! ./ReactVersion */ 38);
	
	ReactDefaultInjection.inject();
	
	var ReactDOMServer = {
	  renderToString: ReactServerRendering.renderToString,
	  renderToStaticMarkup: ReactServerRendering.renderToStaticMarkup,
	  version: ReactVersion
	};
	
	module.exports = ReactDOMServer;

/***/ },

/***/ 346:
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
	
	var ReactDOMContainerInfo = __webpack_require__(/*! ./ReactDOMContainerInfo */ 187);
	var ReactDefaultBatchingStrategy = __webpack_require__(/*! ./ReactDefaultBatchingStrategy */ 158);
	var ReactElement = __webpack_require__(/*! ./ReactElement */ 16);
	var ReactMarkupChecksum = __webpack_require__(/*! ./ReactMarkupChecksum */ 189);
	var ReactServerBatchingStrategy = __webpack_require__(/*! ./ReactServerBatchingStrategy */ 347);
	var ReactServerRenderingTransaction = __webpack_require__(/*! ./ReactServerRenderingTransaction */ 348);
	var ReactUpdates = __webpack_require__(/*! ./ReactUpdates */ 85);
	
	var emptyObject = __webpack_require__(/*! fbjs/lib/emptyObject */ 28);
	var instantiateReactComponent = __webpack_require__(/*! ./instantiateReactComponent */ 145);
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

/***/ 347:
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

/***/ 348:
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
	var Transaction = __webpack_require__(/*! ./Transaction */ 92);
	
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

/***/ }

});
//# sourceMappingURL=bgHelper.bundle.js.map