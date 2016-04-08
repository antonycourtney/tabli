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
	
	var _react = __webpack_require__(/*! react */ 9);
	
	var React = _interopRequireWildcard(_react);
	
	var _server = __webpack_require__(/*! react-dom/server */ 195);
	
	var ReactDOMServer = _interopRequireWildcard(_server);
	
	var _oneref = __webpack_require__(/*! oneref */ 169);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var TabManagerState = Tabli.TabManagerState; /**
	                                              * Background helper page.
	                                              * Gathering bookmark and window state and places in local storage so that
	                                              * popup rendering will be as fast as possible
	                                              */
	
	var TabWindow = Tabli.TabWindow;
	var Popup = Tabli.components.Popup;
	var actions = Tabli.actions;
	var ViewRef = Tabli.ViewRef;
	
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
	      console.log('tab manager folder acquired.');
	      tabmanFolderId = tabManFolder.id;
	      ensureChildFolder(tabManFolder, archiveFolderTitle, function (archiveFolder) {
	        console.log('archive folder acquired.');
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
	        console.log("Removed view listener ", listenerId);
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
	function makeRenderListener(storeRef) {
	  function renderAndSave() {
	    var winStore = storeRef.getValue();
	    // console.log("renderAndSave");
	    if (winStore.equals(window.savedStore)) {
	      // console.log("renderAndSave: current and save store match, skipping render...");
	      return;
	    }
	    /* Let's create a dummy app element to render our current store
	     * React.renderToString() will remount the component, so really want a fresh element here with exactly
	     * the store state we wish to render and save.
	     */
	    var renderAppElement = React.createElement(Popup, { storeRef: null, initialWinStore: winStore, noListener: true });
	    var renderedString = ReactDOMServer.renderToString(renderAppElement);
	
	    // console.log("renderAndSave: updated saved store and HTML");
	    window.savedStore = winStore;
	    window.savedHTML = renderedString;
	
	    /*
	    console.warn("**** dumping winStore and chrome windows! (DEV ONLY)");
	    dumpAll(winStore);
	    dumpChromeWindows();
	    */
	  }
	
	  return renderAndSave;
	}
	
	function invokeLater(f) {
	  window.setTimeout(f, 0);
	}
	
	function onTabCreated(uf, tab) {
	  uf(function (state) {
	    var tabWindow = state.getTabWindowByChromeId(tab.windowId);
	    if (!tabWindow) {
	      console.warn("tabs.onCreated: window id not found: ", tab.windowId);
	      return state;
	    }
	    return state.handleTabCreated(tabWindow, tab);
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
	    uf(function (state) {
	      var tabWindow = state.getTabWindowByChromeId(removeInfo.windowId);
	      if (!tabWindow) {
	        console.warn("tabs.onActivated: window id not found: ", removeInfo.windowId);
	        return state;
	      }
	      if (removeInfo.isWindowClosing) {
	        // window closing, ignore...
	        return state;
	      }
	      return state.handleTabClosed(tabWindow, tabId);
	    });
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
	}
	
	function main() {
	  initWinStore(function (bmStore) {
	    // console.log("init: done reading bookmarks: ", bmStore);
	    // window.winStore = winStore;
	    chrome.windows.getCurrent(null, function (currentWindow) {
	      console.log("bgHelper: currentWindow: ", currentWindow);
	      actions.syncChromeWindows(function (uf) {
	        console.log('initial sync of chrome windows complete.');
	        var syncedStore = uf(bmStore).setCurrentWindow(currentWindow);
	        console.log("window ids in store: ", _.keys(syncedStore.windowIdMap.toJS()));
	        console.log("current window after initial sync: ", syncedStore.currentWindowId, syncedStore.getCurrentWindow());
	        window.storeRef = new ViewRef(syncedStore);
	
	        // dumpAll(syncedStore);
	        // dumpChromeWindows();
	
	        var renderListener = makeRenderListener(window.storeRef);
	
	        // And call it once to get started:
	        renderListener();
	
	        /*
	         * The renderListener is just doing a background render to enable us to
	         * display an initial server-rendered preview of the HTML when opening the popup
	         * and (hopefully) speed up the actual render since DOM changes should be
	         * minimized.
	         *
	         * Let's throttle this way down to avoid spending too many cycles building
	         * this non-interactive preview.
	         */
	        var throttledRenderListener = _.debounce(renderListener, 2000);
	        window.storeRef.on('change', throttledRenderListener);
	
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

/***/ 195:
/*!*******************************!*\
  !*** ./~/react-dom/server.js ***!
  \*******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	module.exports = __webpack_require__(/*! react/lib/ReactDOMServer */ 156);


/***/ }

});
//# sourceMappingURL=bgHelper.bundle.js.map