/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!****************************!*\
  !*** ./src/js/bgHelper.js ***!
  \****************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Background helper page.
	 * Gathering bookmark and window state and places in local storage so that
	 * popup rendering will be as fast as possible
	 */
	'use strict';
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var _tabWindowStore = __webpack_require__(/*! ./tabWindowStore */ 1);
	
	var _tabWindowStore2 = _interopRequireDefault(_tabWindowStore);
	
	var _tabWindow = __webpack_require__(/*! ./tabWindow */ 3);
	
	var TabWindow = _interopRequireWildcard(_tabWindow);
	
	var _actions = __webpack_require__(/*! ./actions */ 5);
	
	var actions = _interopRequireWildcard(_actions);
	
	var popupPort = null;
	var tabmanFolderId = null;
	var tabmanFolderTitle = "Subjective Tab Manager";
	
	var archiveFolderId = null;
	var archiveFolderTitle = "_Archive";
	
	/*
	 * begin managing the specified tab window
	 */
	function manageWindow(tabWindow, opts) {
	  // and write out a Bookmarks folder for this newly managed window:
	  if (!tabmanFolderId) {
	    alert("Could not save bookmarks -- no tab manager folder");
	  }
	  var windowFolder = { parentId: tabmanFolderId,
	    title: opts.title
	  };
	  chrome.bookmarks.create(windowFolder, function (windowFolderNode) {
	    console.log("succesfully created bookmarks folder ", windowFolderNode);
	    console.log("for window: ", tabWindow);
	    var tabs = TabWindow.chromeWindow.tabs;
	    for (var i = 0; i < tabs.length; i++) {
	      var tab = tabs[i];
	      // bookmark for this tab:
	      var tabMark = { parentId: windowFolderNode.id, title: tab.title, url: tab.url };
	      chrome.bookmarks.create(tabMark, function (tabNode) {
	        console.log("succesfully bookmarked tab ", tabNode);
	      });
	    }
	    // Now do an explicit get of subtree to get node populated with children
	    chrome.bookmarks.getSubTree(windowFolderNode.id, function (folderNodes) {
	      var fullFolderNode = folderNodes[0];
	      TabWindow.bookmarkFolder = fullFolderNode;
	
	      // Note: Only now do we actually change the state to managed!
	      // This is to avoid a nasty race condition where the bookmarkFolder would be undefined
	      // or have no children because of the asynchrony of creating bookmarks.
	      // There might still be a race condition here since
	      // the bookmarks for children may not have been created yet.
	      // Haven't seen evidence of this so far.
	      TabWindow._managed = true;
	      TabWindow._managedTitle = opts.title;
	    });
	  });
	}
	
	/* stop managing the specified window...move all bookmarks for this managed window to Recycle Bin */
	function unmanageWindow(tabWindow) {
	  TabWindow._managed = false;
	
	  if (!archiveFolderId) {
	    alert("could not move managed window folder to archive -- no archive folder");
	    return;
	  }
	  chrome.bookmarks.move(TabWindow.bookmarkFolder.id, { parentId: archiveFolderId });
	  TabWindow.bookmarkFolder = null; // disconnect from this bookmark folder
	}
	
	/* On startup load managed windows from bookmarks folder */
	function loadManagedWindows(winStore, tabManFolder) {
	  var folderTabWindows = [];
	  for (var i = 0; i < tabManFolder.children.length; i++) {
	    var windowFolder = tabManFolder.children[i];
	    if (windowFolder.title[0] === "_") {
	      continue;
	    }
	    var fc = windowFolder.children;
	    if (!fc) {
	      console.log("Found bookmarks folder with no children, skipping: ", fc);
	      continue;
	    }
	    folderTabWindows.push(TabWindow.makeFolderTabWindow(windowFolder));
	  }
	  winStore.addTabWindows(folderTabWindows);
	}
	
	/*
	 * given a specific parent Folder node, ensure a particular child exists.
	 * Will invoke callback either synchronously or asynchronously passing the node
	 * for the named child
	 */
	function ensureChildFolder(parentNode, childFolderName, callback) {
	  for (var i = 0; i < parentNode.children.length; i++) {
	    var childFolder = parentNode.children[i];
	    if (childFolder.title.toLowerCase() === childFolderName.toLowerCase()) {
	      // exists
	      console.log("found target child folder: ", childFolderName);
	      callback(childFolder);
	      return true;
	    }
	  }
	  console.log("Child folder ", childFolderName, " Not found, creating...");
	  // If we got here, child Folder doesn't exist
	  var folderObj = { parentId: parentNode.id, title: childFolderName };
	  chrome.bookmarks.create(folderObj, callback);
	}
	
	function initBookmarks(winStore, cb) {
	  chrome.bookmarks.getTree(function (tree) {
	    var otherBookmarksNode = tree[0].children[1];
	    console.log("otherBookmarksNode: ", otherBookmarksNode);
	    ensureChildFolder(otherBookmarksNode, tabmanFolderTitle, function (tabManFolder) {
	      console.log("tab manager folder acquired.");
	      tabmanFolderId = tabManFolder.id;
	      ensureChildFolder(tabManFolder, archiveFolderTitle, function (archiveFolder) {
	        console.log("archive folder acquired.");
	        archiveFolderId = archiveFolder.id;
	        chrome.bookmarks.getSubTree(tabManFolder.id, function (subTreeNodes) {
	          console.log("bookmarks.getSubTree for TabManFolder: ", subTreeNodes);
	          loadManagedWindows(winStore, subTreeNodes[0]);
	          cb();
	        });
	      });
	    });
	  });
	}
	
	function main() {
	  var winStore = new _tabWindowStore2['default']();
	  window.winStore = winStore;
	  initBookmarks(winStore, function () {
	    console.log("init: done reading bookmarks.");
	    actions.syncChromeWindows(winStore);
	  });
	}
	
	main();

/***/ },
/* 1 */
/*!**********************************!*\
  !*** ./src/js/tabWindowStore.js ***!
  \**********************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * long-lived application state for Subjective tab manager
	 *
	 * We'll instantiate and initialize this in the bgHelper and attach it to the background window,
	 * and then retrieve the instance from the background window in the popup
	 */
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _underscore = __webpack_require__(/*! underscore */ 2);
	
	var _ = _interopRequireWildcard(_underscore);
	
	var _tabWindow = __webpack_require__(/*! ./tabWindow */ 3);
	
	var TabWindow = _interopRequireWildcard(_tabWindow);
	
	var _events = __webpack_require__(/*! events */ 4);
	
	var _events2 = _interopRequireDefault(_events);
	
	/*
	 * find the index of a tab in a ChromeWindow by its tab Id
	 *
	 * just dumb linear search for now
	 */
	function findTabIndex(chromeWindow, targetTabId) {
	  for (var i = 0; i < chromeWindow.tabs.length; i++) {
	    var tab = chromeWindow.tabs[i];
	    if (tab.id == targetTabId) return i;
	  }
	  return null;
	}
	
	/**
	 * find the TabWindow and index for a particular tab id.
	 *
	 * TODO / FIXME: Could be improved by maintaining a map by tab id
	 *
	 * spectacularly inefficient (linear)
	 * returns:
	 *    [ TabWindow t, Number tabIndex ]
	 * or
	 *     [] -- if not found
	 */
	function findTabId(tabWindows, targetTabId) {
	  for (var i = 0; i < tabWindows.length; i++) {
	    var tabWindow = tabWindows[i];
	    if (tabWindow && tabWindow.open) {
	      var targetIdx = findTabIndex(tabWindow.chromeWindow, targetTabId);
	      if (targetIdx != null) return [tabWindow, targetIdx];
	    }
	  }
	  return [];
	}
	
	var TabWindowStore = (function (_EventEmitter) {
	  _inherits(TabWindowStore, _EventEmitter);
	
	  function TabWindowStore() {
	    _classCallCheck(this, TabWindowStore);
	
	    _get(Object.getPrototypeOf(TabWindowStore.prototype), 'constructor', this).call(this);
	    this.windowIdMap = {}; // maps from chrome window id for open windows
	    this.bookmarkIdMap = {};
	    this.notifyCallback = null;
	  }
	
	  /*
	   * add a new Tab window to global maps:
	   */
	
	  _createClass(TabWindowStore, [{
	    key: 'addTabWindow',
	    value: function addTabWindow(tabWindow) {
	      var chromeWindow = tabWindow.chromeWindow;
	      if (chromeWindow) {
	        this.windowIdMap[chromeWindow.id] = tabWindow;
	      }
	      if (tabWindow.bookmarkFolder) {
	        this.bookmarkIdMap[tabWindow.bookmarkFolder.id] = tabWindow;
	      }
	    }
	  }, {
	    key: 'addTabWindows',
	    value: function addTabWindows(tabWindows) {
	      var _this = this;
	
	      _.each(tabWindows, function (w) {
	        _this.addTabWindow(w);
	      });
	    }
	
	    /* We distinguish between removing an entry from map of open windows (windowIdMap)
	     * because when closing a bookmarked window, we only wish to remove it from former
	     */
	  }, {
	    key: 'handleTabWindowClosed',
	    value: function handleTabWindowClosed(tabWindow) {
	      console.log("handleTabWindowClosed: ", tabWindow);
	      var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
	      if (windowId) delete this.windowIdMap[windowId];
	      this.emit("change");
	    }
	  }, {
	    key: 'removeBookmarkIdMapEntry',
	    value: function removeBookmarkIdMapEntry(tabWindow) {
	      console.log("removeBookmarkIdMapEntry: ", tabWindow);
	      var bookmarkId = tabWindow.bookmarkFolder && tabWindow.bookmarkFolder.id;
	      if (bookmarkId) delete this.bookmarkIdMap[bookmarkId];
	      this.emit("change");
	    }
	  }, {
	    key: 'revertTabWindow',
	    value: function revertTabWindow(tabWindow, callback) {
	      var tabs = tabWindow.chromeWindow.tabs;
	      var currentTabIds = tabs.map(function (t) {
	        return t.id;
	      });
	
	      // re-open bookmarks:
	      var urls = tabWindow.bookmarkFolder.children.map(function (bm) {
	        return bm.url;
	      });
	      for (var i = 0; i < urls.length; i++) {
	        // need to open it:
	        var tabInfo = { windowId: tabWindow.chromeWindow.id, url: urls[i] };
	        chrome.tabs.create(tabInfo);
	      };
	
	      // blow away all the existing tabs:
	      chrome.tabs.remove(currentTabIds, function () {
	        var windowId = tabWindow.chromeWindow.id;
	        tabWindow.chromeWindow = null;
	        // refresh window details:
	        chrome.windows.get(windowId, { populate: true }, function (chromeWindow) {
	          tabWindow.chromeWindow = chromeWindow;
	          callback();
	        });
	      });
	    }
	  }, {
	    key: 'attachChromeWindow',
	    value: function attachChromeWindow(tabWindow, chromeWindow) {
	      console.log("attachChromeWindow: ", tabWindow, chromeWindow);
	      // Was this Chrome window id previously associated with some other tab window?
	      var oldTabWindow = this.windowIdMap[chromeWindow.id];
	      if (oldTabWindow) {
	        // This better not be a managed window...
	        console.log("found previous tab window -- detaching");
	        console.log("oldTabWindow: ", oldTabWindow);
	        this.removeTabWindow(oldTabWindow);
	      }
	      tabWindow.chromeWindow = chromeWindow;
	      tabWindow.open = true;
	      this.windowIdMap[chromeWindow.id] = tabWindow;
	    }
	  }, {
	    key: 'handleChromeWindowRemoved',
	    value: function handleChromeWindowRemoved(windowId) {
	      console.log("handleChromeWindowRemoved: ", windowId);
	      var tabWindow = this.windowIdMap[windowId];
	      if (!tabWindow) {
	        console.warn("window id not found -- ignoring");
	      } else {
	        if (!tabWindow.isManaged()) {
	          // unmanaged window -- just remove
	          this.removeTabWindow(tabWindow);
	        } else {
	          // managed window -- mark as closed and dissociate chrome window
	          tabWindow.open = false;
	          tabWindow.chromeWindow = null;
	          this.removeWindowMapEntries(tabWindow);
	        }
	      }
	    }
	  }, {
	    key: 'handleChromeWindowFocusChanged',
	    value: function handleChromeWindowFocusChanged(windowId) {
	      /* TODO / FIXME: more efficient rep for focused window */
	      var tabWindows = this.getAll();
	
	      for (var i = 0; i < tabWindows.length; i++) {
	        var tabWindow = tabWindows[i];
	        if (tabWindow) {
	          tabWindow._focused = false;
	        }
	      }
	      if (windowId != chrome.windows.WINDOW_ID_NONE) {
	        var tabWindow = this.windowIdMap[windowId];
	        if (!tabWindow) {
	          console.warn("Got focus event for unknown window id ", windowId);
	          return;
	        }
	        tabWindow._focused = true;
	      }
	    }
	  }, {
	    key: 'handleChromeTabActivated',
	    value: function handleChromeTabActivated(tabId, windowId) {
	      var tabWindow = this.windowIdMap[windowId];
	      if (!tabWindow) {
	        console.warn("window id not found -- ignoring");
	      } else {
	        var tabs = tabWindow.chromeWindow.tabs;
	        if (tabs) {
	          for (var i = 0; i < tabs.length; i++) {
	            var tab = tabs[i];
	            tab.active = tab.id == tabId;
	          }
	        }
	      }
	    }
	  }, {
	    key: 'handleChromeTabCreated',
	    value: function handleChromeTabCreated(tab) {
	      var tabWindow = this.windowIdMap[tab.windowId];
	      if (!tabWindow) {
	        console.warn("Got tab created event for unknown window ", tab);
	      } else {
	        console.log("handleChromeTabCreated: ", tabWindow, tab);
	        if (!tabWindow.chromeWindow) {
	          console.warn("got tab created for bad chromeWindow");
	        }
	        if (!tabWindow.chromeWindow.tabs) {
	          console.warn("first tab in chrome window; initializing...");
	          tabWindow.chromeWindow.tabs = [tab];
	        } else {
	          // append this tab onto tabs at index:
	          tabWindow.chromeWindow.tabs.splice(tab.index, 0, tab);
	        }
	      }
	    }
	  }, {
	    key: 'handleTabClosed',
	    value: function handleTabClosed(windowId, tabId) {
	      var tabWindow = this.windowIdMap[windowId];
	      if (!tabWindow) {
	        console.warn("Got tab removed event for unknown window ", windowId, tabId);
	        return;
	      }
	      var chromeWindow = tabWindow.chromeWindow;
	      var tabIndex = findTabIndex(tabWindow.chromeWindow, tabId);
	      if (tabIndex != null) {
	        tabWindow.chromeWindow.tabs.splice(tabIndex, 1);
	      }
	      this.emit("change");
	    }
	  }, {
	    key: 'handleChromeTabRemoved',
	    value: function handleChromeTabRemoved(tabId, removeInfo) {
	      if (removeInfo.isWindowClosing) {
	        console.log("handleChromeTabRemoved: window closing, ignoring...");
	        // Window is closing, ignore...
	        return;
	      }
	      this.handleTabClosed(removeInfo.windowId, tabId);
	    }
	  }, {
	    key: 'handleChromeTabUpdated',
	    value: function handleChromeTabUpdated(tabId, changeInfo, tab) {
	      console.log("handleChromeTabUpdated: ", tabId, changeInfo, tab);
	      var tabWindow = this.windowIdMap[tab.windowId];
	      if (!tabWindow) {
	        console.warn("Got tab updated event for unknown window ", tab);
	        return;
	      }
	      console.log("handleChromeTabUpdated: ", tabWindow, tab);
	      if (!tabWindow.chromeWindow) {
	        console.warn("got tab Updated for bad chromeWindow");
	      }
	      if (!tabWindow.chromeWindow.tabs) {
	        console.warn("No tabs in chrome Window; dropping update...");
	        tabWindow.chromeWindow.tabs = [tab];
	      } else {
	        /* we should be able to trust tab.index, but this seems safer... */
	        var tabIndex = findTabIndex(tabWindow.chromeWindow, tabId);
	        if (tabIndex == null) {
	          console.warn("Got tab update for unknown tab: ", tabId, tab);
	          return;
	        }
	        tabWindow.chromeWindow.tabs[tabIndex] = tab;
	      }
	    }
	  }, {
	    key: 'handleChromeTabReplaced',
	    value: function handleChromeTabReplaced(addedTabId, removedTabId) {
	      console.log("handleChromeTabReplaced: ", addedTabId, removedTabId);
	      var tabWindows = this.getAll();
	
	      var _findTabId = findTabId(tabWindows, removedTabId);
	
	      var _findTabId2 = _slicedToArray(_findTabId, 2);
	
	      var removedTabWindow = _findTabId2[0];
	      var removedIndex = _findTabId2[1];
	
	      if (removedTabWindow) {
	        var tab = removedTabWindow.chromeWindow.tabs[removedIndex];
	        console.log("found removed tab: ", tab);
	        tab.id = addedTabId;
	        // Unfortunately we may not get any events giving us essential info on the
	        // added tab.
	        // Call chrome.tabs.get and then call handleTabUpdate directly
	        chrome.tabs.get(addedTabId, function (tab) {
	          console.log("Got replaced tab detail: ", tab);
	          window.fluxState.flux.actions.chromeTabUpdated(tab.id, {}, tab);
	        });
	      } else {
	        console.log("removed tab id not found!");
	      }
	    }
	
	    /**
	     * Synchronize internal state of our store with snapshot
	     * of current Chrome window state
	     */
	  }, {
	    key: 'syncChromeWindow',
	    value: function syncChromeWindow(chromeWindow) {
	      var tabWindow = this.windowIdMap[chromeWindow.id];
	      if (!tabWindow) {
	        console.log("syncChromeWindow: detected new window id: ", chromeWindow.id);
	        tabWindow = TabWindow.makeChromeTabWindow(chromeWindow);
	        this.addTabWindow(tabWindow);
	      } else {
	        // console.log( "syncChromeWindow: cache hit for window id: ", chromeWindow.id );
	        // Set chromeWindow to current snapshot of tab contents:
	        tabWindow.chromeWindow = chromeWindow;
	        tabWindow.open = true;
	      }
	    }
	  }, {
	    key: 'handleChromeWindowCreated',
	    value: function handleChromeWindowCreated(chromeWindow) {
	      this.syncChromeWindow(chromeWindow);
	    }
	
	    /**
	     * synchronize the currently open windows from chrome.windows.getAll with 
	     * internal map of open windows
	     */
	  }, {
	    key: 'syncWindowList',
	    value: function syncWindowList(chromeWindowList) {
	      var _this2 = this;
	
	      var tabWindows = this.getOpen();
	
	      // Iterate through tab windows (our current list of open windows)
	      // closing any not in chromeWindowList:
	      var chromeIds = _.pluck(chromeWindowList, 'id');
	      var chromeIdSet = new Set(chromeIds);
	      tabWindows.forEach(function (tw) {
	        if (!chromeIdSet.has(tw.chromeWindow.id)) {
	          console.log("syncWindowList: detected closed window: ", tw);
	          // mark it closed (only matters for bookmarked windows):
	          tw.open = false;
	          // And remove it from open window map:
	          _this2.handleTabWindowClosed(tw);
	        }
	      });
	
	      // Now iterate through chromeWindowList and find any chrome windows not in our map of open windows:
	      chromeWindowList.forEach(function (cw) {
	        _this2.syncChromeWindow(cw);
	      });
	
	      this.emit("change");
	    }
	
	    /**
	     * get the currently open tab windows
	     */
	  }, {
	    key: 'getOpen',
	    value: function getOpen() {
	      var openWindows = _.values(this.windowIdMap);
	      return openWindows;
	    }
	  }, {
	    key: 'getAll',
	    value: function getAll() {
	      var openWindows = _.values(this.windowIdMap);
	      var managedWindows = _.values(this.bookmarkIdMap);
	      var closedManagedWindows = _.filter(managedWindows, function (w) {
	        return !w.open;
	      });
	      return closedManagedWindows.concat(openWindows);
	    }
	
	    // returns a tabWindow or undefined
	  }, {
	    key: 'getTabWindowByChromeId',
	    value: function getTabWindowByChromeId(chromeId) {
	      return this.windowIdMap[chromeId];
	    }
	
	    /*
	     * Set a view listener, and ensure there is at most one.
	     *
	     * We have our own interface here because we don't have a reliable destructor / close event on the
	     * chrome extension popup where 
	     */
	  }, {
	    key: 'setViewListener',
	    value: function setViewListener(listener) {
	      if (this.viewListener) {
	        console.log("setViewListener: clearing old view listener");
	        this.removeListener("change", this.viewListener);
	      }
	      this.viewListener = listener;
	      this.on("change", listener);
	    }
	  }]);
	
	  return TabWindowStore;
	})(_events2['default']);
	
	exports['default'] = TabWindowStore;
	module.exports = exports['default'];

/***/ },
/* 2 */
/*!************************************!*\
  !*** ./~/underscore/underscore.js ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;//     Underscore.js 1.7.0
	//     http://underscorejs.org
	//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	//     Underscore may be freely distributed under the MIT license.
	
	(function() {
	
	  // Baseline setup
	  // --------------
	
	  // Establish the root object, `window` in the browser, or `exports` on the server.
	  var root = this;
	
	  // Save the previous value of the `_` variable.
	  var previousUnderscore = root._;
	
	  // Save bytes in the minified (but not gzipped) version:
	  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
	
	  // Create quick reference variables for speed access to core prototypes.
	  var
	    push             = ArrayProto.push,
	    slice            = ArrayProto.slice,
	    concat           = ArrayProto.concat,
	    toString         = ObjProto.toString,
	    hasOwnProperty   = ObjProto.hasOwnProperty;
	
	  // All **ECMAScript 5** native function implementations that we hope to use
	  // are declared here.
	  var
	    nativeIsArray      = Array.isArray,
	    nativeKeys         = Object.keys,
	    nativeBind         = FuncProto.bind;
	
	  // Create a safe reference to the Underscore object for use below.
	  var _ = function(obj) {
	    if (obj instanceof _) return obj;
	    if (!(this instanceof _)) return new _(obj);
	    this._wrapped = obj;
	  };
	
	  // Export the Underscore object for **Node.js**, with
	  // backwards-compatibility for the old `require()` API. If we're in
	  // the browser, add `_` as a global object.
	  if (true) {
	    if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports = _;
	    }
	    exports._ = _;
	  } else {
	    root._ = _;
	  }
	
	  // Current version.
	  _.VERSION = '1.7.0';
	
	  // Internal function that returns an efficient (for current engines) version
	  // of the passed-in callback, to be repeatedly applied in other Underscore
	  // functions.
	  var createCallback = function(func, context, argCount) {
	    if (context === void 0) return func;
	    switch (argCount == null ? 3 : argCount) {
	      case 1: return function(value) {
	        return func.call(context, value);
	      };
	      case 2: return function(value, other) {
	        return func.call(context, value, other);
	      };
	      case 3: return function(value, index, collection) {
	        return func.call(context, value, index, collection);
	      };
	      case 4: return function(accumulator, value, index, collection) {
	        return func.call(context, accumulator, value, index, collection);
	      };
	    }
	    return function() {
	      return func.apply(context, arguments);
	    };
	  };
	
	  // A mostly-internal function to generate callbacks that can be applied
	  // to each element in a collection, returning the desired result — either
	  // identity, an arbitrary callback, a property matcher, or a property accessor.
	  _.iteratee = function(value, context, argCount) {
	    if (value == null) return _.identity;
	    if (_.isFunction(value)) return createCallback(value, context, argCount);
	    if (_.isObject(value)) return _.matches(value);
	    return _.property(value);
	  };
	
	  // Collection Functions
	  // --------------------
	
	  // The cornerstone, an `each` implementation, aka `forEach`.
	  // Handles raw objects in addition to array-likes. Treats all
	  // sparse array-likes as if they were dense.
	  _.each = _.forEach = function(obj, iteratee, context) {
	    if (obj == null) return obj;
	    iteratee = createCallback(iteratee, context);
	    var i, length = obj.length;
	    if (length === +length) {
	      for (i = 0; i < length; i++) {
	        iteratee(obj[i], i, obj);
	      }
	    } else {
	      var keys = _.keys(obj);
	      for (i = 0, length = keys.length; i < length; i++) {
	        iteratee(obj[keys[i]], keys[i], obj);
	      }
	    }
	    return obj;
	  };
	
	  // Return the results of applying the iteratee to each element.
	  _.map = _.collect = function(obj, iteratee, context) {
	    if (obj == null) return [];
	    iteratee = _.iteratee(iteratee, context);
	    var keys = obj.length !== +obj.length && _.keys(obj),
	        length = (keys || obj).length,
	        results = Array(length),
	        currentKey;
	    for (var index = 0; index < length; index++) {
	      currentKey = keys ? keys[index] : index;
	      results[index] = iteratee(obj[currentKey], currentKey, obj);
	    }
	    return results;
	  };
	
	  var reduceError = 'Reduce of empty array with no initial value';
	
	  // **Reduce** builds up a single result from a list of values, aka `inject`,
	  // or `foldl`.
	  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
	    if (obj == null) obj = [];
	    iteratee = createCallback(iteratee, context, 4);
	    var keys = obj.length !== +obj.length && _.keys(obj),
	        length = (keys || obj).length,
	        index = 0, currentKey;
	    if (arguments.length < 3) {
	      if (!length) throw new TypeError(reduceError);
	      memo = obj[keys ? keys[index++] : index++];
	    }
	    for (; index < length; index++) {
	      currentKey = keys ? keys[index] : index;
	      memo = iteratee(memo, obj[currentKey], currentKey, obj);
	    }
	    return memo;
	  };
	
	  // The right-associative version of reduce, also known as `foldr`.
	  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
	    if (obj == null) obj = [];
	    iteratee = createCallback(iteratee, context, 4);
	    var keys = obj.length !== + obj.length && _.keys(obj),
	        index = (keys || obj).length,
	        currentKey;
	    if (arguments.length < 3) {
	      if (!index) throw new TypeError(reduceError);
	      memo = obj[keys ? keys[--index] : --index];
	    }
	    while (index--) {
	      currentKey = keys ? keys[index] : index;
	      memo = iteratee(memo, obj[currentKey], currentKey, obj);
	    }
	    return memo;
	  };
	
	  // Return the first value which passes a truth test. Aliased as `detect`.
	  _.find = _.detect = function(obj, predicate, context) {
	    var result;
	    predicate = _.iteratee(predicate, context);
	    _.some(obj, function(value, index, list) {
	      if (predicate(value, index, list)) {
	        result = value;
	        return true;
	      }
	    });
	    return result;
	  };
	
	  // Return all the elements that pass a truth test.
	  // Aliased as `select`.
	  _.filter = _.select = function(obj, predicate, context) {
	    var results = [];
	    if (obj == null) return results;
	    predicate = _.iteratee(predicate, context);
	    _.each(obj, function(value, index, list) {
	      if (predicate(value, index, list)) results.push(value);
	    });
	    return results;
	  };
	
	  // Return all the elements for which a truth test fails.
	  _.reject = function(obj, predicate, context) {
	    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
	  };
	
	  // Determine whether all of the elements match a truth test.
	  // Aliased as `all`.
	  _.every = _.all = function(obj, predicate, context) {
	    if (obj == null) return true;
	    predicate = _.iteratee(predicate, context);
	    var keys = obj.length !== +obj.length && _.keys(obj),
	        length = (keys || obj).length,
	        index, currentKey;
	    for (index = 0; index < length; index++) {
	      currentKey = keys ? keys[index] : index;
	      if (!predicate(obj[currentKey], currentKey, obj)) return false;
	    }
	    return true;
	  };
	
	  // Determine if at least one element in the object matches a truth test.
	  // Aliased as `any`.
	  _.some = _.any = function(obj, predicate, context) {
	    if (obj == null) return false;
	    predicate = _.iteratee(predicate, context);
	    var keys = obj.length !== +obj.length && _.keys(obj),
	        length = (keys || obj).length,
	        index, currentKey;
	    for (index = 0; index < length; index++) {
	      currentKey = keys ? keys[index] : index;
	      if (predicate(obj[currentKey], currentKey, obj)) return true;
	    }
	    return false;
	  };
	
	  // Determine if the array or object contains a given value (using `===`).
	  // Aliased as `include`.
	  _.contains = _.include = function(obj, target) {
	    if (obj == null) return false;
	    if (obj.length !== +obj.length) obj = _.values(obj);
	    return _.indexOf(obj, target) >= 0;
	  };
	
	  // Invoke a method (with arguments) on every item in a collection.
	  _.invoke = function(obj, method) {
	    var args = slice.call(arguments, 2);
	    var isFunc = _.isFunction(method);
	    return _.map(obj, function(value) {
	      return (isFunc ? method : value[method]).apply(value, args);
	    });
	  };
	
	  // Convenience version of a common use case of `map`: fetching a property.
	  _.pluck = function(obj, key) {
	    return _.map(obj, _.property(key));
	  };
	
	  // Convenience version of a common use case of `filter`: selecting only objects
	  // containing specific `key:value` pairs.
	  _.where = function(obj, attrs) {
	    return _.filter(obj, _.matches(attrs));
	  };
	
	  // Convenience version of a common use case of `find`: getting the first object
	  // containing specific `key:value` pairs.
	  _.findWhere = function(obj, attrs) {
	    return _.find(obj, _.matches(attrs));
	  };
	
	  // Return the maximum element (or element-based computation).
	  _.max = function(obj, iteratee, context) {
	    var result = -Infinity, lastComputed = -Infinity,
	        value, computed;
	    if (iteratee == null && obj != null) {
	      obj = obj.length === +obj.length ? obj : _.values(obj);
	      for (var i = 0, length = obj.length; i < length; i++) {
	        value = obj[i];
	        if (value > result) {
	          result = value;
	        }
	      }
	    } else {
	      iteratee = _.iteratee(iteratee, context);
	      _.each(obj, function(value, index, list) {
	        computed = iteratee(value, index, list);
	        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
	          result = value;
	          lastComputed = computed;
	        }
	      });
	    }
	    return result;
	  };
	
	  // Return the minimum element (or element-based computation).
	  _.min = function(obj, iteratee, context) {
	    var result = Infinity, lastComputed = Infinity,
	        value, computed;
	    if (iteratee == null && obj != null) {
	      obj = obj.length === +obj.length ? obj : _.values(obj);
	      for (var i = 0, length = obj.length; i < length; i++) {
	        value = obj[i];
	        if (value < result) {
	          result = value;
	        }
	      }
	    } else {
	      iteratee = _.iteratee(iteratee, context);
	      _.each(obj, function(value, index, list) {
	        computed = iteratee(value, index, list);
	        if (computed < lastComputed || computed === Infinity && result === Infinity) {
	          result = value;
	          lastComputed = computed;
	        }
	      });
	    }
	    return result;
	  };
	
	  // Shuffle a collection, using the modern version of the
	  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
	  _.shuffle = function(obj) {
	    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
	    var length = set.length;
	    var shuffled = Array(length);
	    for (var index = 0, rand; index < length; index++) {
	      rand = _.random(0, index);
	      if (rand !== index) shuffled[index] = shuffled[rand];
	      shuffled[rand] = set[index];
	    }
	    return shuffled;
	  };
	
	  // Sample **n** random values from a collection.
	  // If **n** is not specified, returns a single random element.
	  // The internal `guard` argument allows it to work with `map`.
	  _.sample = function(obj, n, guard) {
	    if (n == null || guard) {
	      if (obj.length !== +obj.length) obj = _.values(obj);
	      return obj[_.random(obj.length - 1)];
	    }
	    return _.shuffle(obj).slice(0, Math.max(0, n));
	  };
	
	  // Sort the object's values by a criterion produced by an iteratee.
	  _.sortBy = function(obj, iteratee, context) {
	    iteratee = _.iteratee(iteratee, context);
	    return _.pluck(_.map(obj, function(value, index, list) {
	      return {
	        value: value,
	        index: index,
	        criteria: iteratee(value, index, list)
	      };
	    }).sort(function(left, right) {
	      var a = left.criteria;
	      var b = right.criteria;
	      if (a !== b) {
	        if (a > b || a === void 0) return 1;
	        if (a < b || b === void 0) return -1;
	      }
	      return left.index - right.index;
	    }), 'value');
	  };
	
	  // An internal function used for aggregate "group by" operations.
	  var group = function(behavior) {
	    return function(obj, iteratee, context) {
	      var result = {};
	      iteratee = _.iteratee(iteratee, context);
	      _.each(obj, function(value, index) {
	        var key = iteratee(value, index, obj);
	        behavior(result, value, key);
	      });
	      return result;
	    };
	  };
	
	  // Groups the object's values by a criterion. Pass either a string attribute
	  // to group by, or a function that returns the criterion.
	  _.groupBy = group(function(result, value, key) {
	    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
	  });
	
	  // Indexes the object's values by a criterion, similar to `groupBy`, but for
	  // when you know that your index values will be unique.
	  _.indexBy = group(function(result, value, key) {
	    result[key] = value;
	  });
	
	  // Counts instances of an object that group by a certain criterion. Pass
	  // either a string attribute to count by, or a function that returns the
	  // criterion.
	  _.countBy = group(function(result, value, key) {
	    if (_.has(result, key)) result[key]++; else result[key] = 1;
	  });
	
	  // Use a comparator function to figure out the smallest index at which
	  // an object should be inserted so as to maintain order. Uses binary search.
	  _.sortedIndex = function(array, obj, iteratee, context) {
	    iteratee = _.iteratee(iteratee, context, 1);
	    var value = iteratee(obj);
	    var low = 0, high = array.length;
	    while (low < high) {
	      var mid = low + high >>> 1;
	      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
	    }
	    return low;
	  };
	
	  // Safely create a real, live array from anything iterable.
	  _.toArray = function(obj) {
	    if (!obj) return [];
	    if (_.isArray(obj)) return slice.call(obj);
	    if (obj.length === +obj.length) return _.map(obj, _.identity);
	    return _.values(obj);
	  };
	
	  // Return the number of elements in an object.
	  _.size = function(obj) {
	    if (obj == null) return 0;
	    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
	  };
	
	  // Split a collection into two arrays: one whose elements all satisfy the given
	  // predicate, and one whose elements all do not satisfy the predicate.
	  _.partition = function(obj, predicate, context) {
	    predicate = _.iteratee(predicate, context);
	    var pass = [], fail = [];
	    _.each(obj, function(value, key, obj) {
	      (predicate(value, key, obj) ? pass : fail).push(value);
	    });
	    return [pass, fail];
	  };
	
	  // Array Functions
	  // ---------------
	
	  // Get the first element of an array. Passing **n** will return the first N
	  // values in the array. Aliased as `head` and `take`. The **guard** check
	  // allows it to work with `_.map`.
	  _.first = _.head = _.take = function(array, n, guard) {
	    if (array == null) return void 0;
	    if (n == null || guard) return array[0];
	    if (n < 0) return [];
	    return slice.call(array, 0, n);
	  };
	
	  // Returns everything but the last entry of the array. Especially useful on
	  // the arguments object. Passing **n** will return all the values in
	  // the array, excluding the last N. The **guard** check allows it to work with
	  // `_.map`.
	  _.initial = function(array, n, guard) {
	    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
	  };
	
	  // Get the last element of an array. Passing **n** will return the last N
	  // values in the array. The **guard** check allows it to work with `_.map`.
	  _.last = function(array, n, guard) {
	    if (array == null) return void 0;
	    if (n == null || guard) return array[array.length - 1];
	    return slice.call(array, Math.max(array.length - n, 0));
	  };
	
	  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
	  // Especially useful on the arguments object. Passing an **n** will return
	  // the rest N values in the array. The **guard**
	  // check allows it to work with `_.map`.
	  _.rest = _.tail = _.drop = function(array, n, guard) {
	    return slice.call(array, n == null || guard ? 1 : n);
	  };
	
	  // Trim out all falsy values from an array.
	  _.compact = function(array) {
	    return _.filter(array, _.identity);
	  };
	
	  // Internal implementation of a recursive `flatten` function.
	  var flatten = function(input, shallow, strict, output) {
	    if (shallow && _.every(input, _.isArray)) {
	      return concat.apply(output, input);
	    }
	    for (var i = 0, length = input.length; i < length; i++) {
	      var value = input[i];
	      if (!_.isArray(value) && !_.isArguments(value)) {
	        if (!strict) output.push(value);
	      } else if (shallow) {
	        push.apply(output, value);
	      } else {
	        flatten(value, shallow, strict, output);
	      }
	    }
	    return output;
	  };
	
	  // Flatten out an array, either recursively (by default), or just one level.
	  _.flatten = function(array, shallow) {
	    return flatten(array, shallow, false, []);
	  };
	
	  // Return a version of the array that does not contain the specified value(s).
	  _.without = function(array) {
	    return _.difference(array, slice.call(arguments, 1));
	  };
	
	  // Produce a duplicate-free version of the array. If the array has already
	  // been sorted, you have the option of using a faster algorithm.
	  // Aliased as `unique`.
	  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
	    if (array == null) return [];
	    if (!_.isBoolean(isSorted)) {
	      context = iteratee;
	      iteratee = isSorted;
	      isSorted = false;
	    }
	    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
	    var result = [];
	    var seen = [];
	    for (var i = 0, length = array.length; i < length; i++) {
	      var value = array[i];
	      if (isSorted) {
	        if (!i || seen !== value) result.push(value);
	        seen = value;
	      } else if (iteratee) {
	        var computed = iteratee(value, i, array);
	        if (_.indexOf(seen, computed) < 0) {
	          seen.push(computed);
	          result.push(value);
	        }
	      } else if (_.indexOf(result, value) < 0) {
	        result.push(value);
	      }
	    }
	    return result;
	  };
	
	  // Produce an array that contains the union: each distinct element from all of
	  // the passed-in arrays.
	  _.union = function() {
	    return _.uniq(flatten(arguments, true, true, []));
	  };
	
	  // Produce an array that contains every item shared between all the
	  // passed-in arrays.
	  _.intersection = function(array) {
	    if (array == null) return [];
	    var result = [];
	    var argsLength = arguments.length;
	    for (var i = 0, length = array.length; i < length; i++) {
	      var item = array[i];
	      if (_.contains(result, item)) continue;
	      for (var j = 1; j < argsLength; j++) {
	        if (!_.contains(arguments[j], item)) break;
	      }
	      if (j === argsLength) result.push(item);
	    }
	    return result;
	  };
	
	  // Take the difference between one array and a number of other arrays.
	  // Only the elements present in just the first array will remain.
	  _.difference = function(array) {
	    var rest = flatten(slice.call(arguments, 1), true, true, []);
	    return _.filter(array, function(value){
	      return !_.contains(rest, value);
	    });
	  };
	
	  // Zip together multiple lists into a single array -- elements that share
	  // an index go together.
	  _.zip = function(array) {
	    if (array == null) return [];
	    var length = _.max(arguments, 'length').length;
	    var results = Array(length);
	    for (var i = 0; i < length; i++) {
	      results[i] = _.pluck(arguments, i);
	    }
	    return results;
	  };
	
	  // Converts lists into objects. Pass either a single array of `[key, value]`
	  // pairs, or two parallel arrays of the same length -- one of keys, and one of
	  // the corresponding values.
	  _.object = function(list, values) {
	    if (list == null) return {};
	    var result = {};
	    for (var i = 0, length = list.length; i < length; i++) {
	      if (values) {
	        result[list[i]] = values[i];
	      } else {
	        result[list[i][0]] = list[i][1];
	      }
	    }
	    return result;
	  };
	
	  // Return the position of the first occurrence of an item in an array,
	  // or -1 if the item is not included in the array.
	  // If the array is large and already in sort order, pass `true`
	  // for **isSorted** to use binary search.
	  _.indexOf = function(array, item, isSorted) {
	    if (array == null) return -1;
	    var i = 0, length = array.length;
	    if (isSorted) {
	      if (typeof isSorted == 'number') {
	        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
	      } else {
	        i = _.sortedIndex(array, item);
	        return array[i] === item ? i : -1;
	      }
	    }
	    for (; i < length; i++) if (array[i] === item) return i;
	    return -1;
	  };
	
	  _.lastIndexOf = function(array, item, from) {
	    if (array == null) return -1;
	    var idx = array.length;
	    if (typeof from == 'number') {
	      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
	    }
	    while (--idx >= 0) if (array[idx] === item) return idx;
	    return -1;
	  };
	
	  // Generate an integer Array containing an arithmetic progression. A port of
	  // the native Python `range()` function. See
	  // [the Python documentation](http://docs.python.org/library/functions.html#range).
	  _.range = function(start, stop, step) {
	    if (arguments.length <= 1) {
	      stop = start || 0;
	      start = 0;
	    }
	    step = step || 1;
	
	    var length = Math.max(Math.ceil((stop - start) / step), 0);
	    var range = Array(length);
	
	    for (var idx = 0; idx < length; idx++, start += step) {
	      range[idx] = start;
	    }
	
	    return range;
	  };
	
	  // Function (ahem) Functions
	  // ------------------
	
	  // Reusable constructor function for prototype setting.
	  var Ctor = function(){};
	
	  // Create a function bound to a given object (assigning `this`, and arguments,
	  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
	  // available.
	  _.bind = function(func, context) {
	    var args, bound;
	    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
	    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
	    args = slice.call(arguments, 2);
	    bound = function() {
	      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
	      Ctor.prototype = func.prototype;
	      var self = new Ctor;
	      Ctor.prototype = null;
	      var result = func.apply(self, args.concat(slice.call(arguments)));
	      if (_.isObject(result)) return result;
	      return self;
	    };
	    return bound;
	  };
	
	  // Partially apply a function by creating a version that has had some of its
	  // arguments pre-filled, without changing its dynamic `this` context. _ acts
	  // as a placeholder, allowing any combination of arguments to be pre-filled.
	  _.partial = function(func) {
	    var boundArgs = slice.call(arguments, 1);
	    return function() {
	      var position = 0;
	      var args = boundArgs.slice();
	      for (var i = 0, length = args.length; i < length; i++) {
	        if (args[i] === _) args[i] = arguments[position++];
	      }
	      while (position < arguments.length) args.push(arguments[position++]);
	      return func.apply(this, args);
	    };
	  };
	
	  // Bind a number of an object's methods to that object. Remaining arguments
	  // are the method names to be bound. Useful for ensuring that all callbacks
	  // defined on an object belong to it.
	  _.bindAll = function(obj) {
	    var i, length = arguments.length, key;
	    if (length <= 1) throw new Error('bindAll must be passed function names');
	    for (i = 1; i < length; i++) {
	      key = arguments[i];
	      obj[key] = _.bind(obj[key], obj);
	    }
	    return obj;
	  };
	
	  // Memoize an expensive function by storing its results.
	  _.memoize = function(func, hasher) {
	    var memoize = function(key) {
	      var cache = memoize.cache;
	      var address = hasher ? hasher.apply(this, arguments) : key;
	      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
	      return cache[address];
	    };
	    memoize.cache = {};
	    return memoize;
	  };
	
	  // Delays a function for the given number of milliseconds, and then calls
	  // it with the arguments supplied.
	  _.delay = function(func, wait) {
	    var args = slice.call(arguments, 2);
	    return setTimeout(function(){
	      return func.apply(null, args);
	    }, wait);
	  };
	
	  // Defers a function, scheduling it to run after the current call stack has
	  // cleared.
	  _.defer = function(func) {
	    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
	  };
	
	  // Returns a function, that, when invoked, will only be triggered at most once
	  // during a given window of time. Normally, the throttled function will run
	  // as much as it can, without ever going more than once per `wait` duration;
	  // but if you'd like to disable the execution on the leading edge, pass
	  // `{leading: false}`. To disable execution on the trailing edge, ditto.
	  _.throttle = function(func, wait, options) {
	    var context, args, result;
	    var timeout = null;
	    var previous = 0;
	    if (!options) options = {};
	    var later = function() {
	      previous = options.leading === false ? 0 : _.now();
	      timeout = null;
	      result = func.apply(context, args);
	      if (!timeout) context = args = null;
	    };
	    return function() {
	      var now = _.now();
	      if (!previous && options.leading === false) previous = now;
	      var remaining = wait - (now - previous);
	      context = this;
	      args = arguments;
	      if (remaining <= 0 || remaining > wait) {
	        clearTimeout(timeout);
	        timeout = null;
	        previous = now;
	        result = func.apply(context, args);
	        if (!timeout) context = args = null;
	      } else if (!timeout && options.trailing !== false) {
	        timeout = setTimeout(later, remaining);
	      }
	      return result;
	    };
	  };
	
	  // Returns a function, that, as long as it continues to be invoked, will not
	  // be triggered. The function will be called after it stops being called for
	  // N milliseconds. If `immediate` is passed, trigger the function on the
	  // leading edge, instead of the trailing.
	  _.debounce = function(func, wait, immediate) {
	    var timeout, args, context, timestamp, result;
	
	    var later = function() {
	      var last = _.now() - timestamp;
	
	      if (last < wait && last > 0) {
	        timeout = setTimeout(later, wait - last);
	      } else {
	        timeout = null;
	        if (!immediate) {
	          result = func.apply(context, args);
	          if (!timeout) context = args = null;
	        }
	      }
	    };
	
	    return function() {
	      context = this;
	      args = arguments;
	      timestamp = _.now();
	      var callNow = immediate && !timeout;
	      if (!timeout) timeout = setTimeout(later, wait);
	      if (callNow) {
	        result = func.apply(context, args);
	        context = args = null;
	      }
	
	      return result;
	    };
	  };
	
	  // Returns the first function passed as an argument to the second,
	  // allowing you to adjust arguments, run code before and after, and
	  // conditionally execute the original function.
	  _.wrap = function(func, wrapper) {
	    return _.partial(wrapper, func);
	  };
	
	  // Returns a negated version of the passed-in predicate.
	  _.negate = function(predicate) {
	    return function() {
	      return !predicate.apply(this, arguments);
	    };
	  };
	
	  // Returns a function that is the composition of a list of functions, each
	  // consuming the return value of the function that follows.
	  _.compose = function() {
	    var args = arguments;
	    var start = args.length - 1;
	    return function() {
	      var i = start;
	      var result = args[start].apply(this, arguments);
	      while (i--) result = args[i].call(this, result);
	      return result;
	    };
	  };
	
	  // Returns a function that will only be executed after being called N times.
	  _.after = function(times, func) {
	    return function() {
	      if (--times < 1) {
	        return func.apply(this, arguments);
	      }
	    };
	  };
	
	  // Returns a function that will only be executed before being called N times.
	  _.before = function(times, func) {
	    var memo;
	    return function() {
	      if (--times > 0) {
	        memo = func.apply(this, arguments);
	      } else {
	        func = null;
	      }
	      return memo;
	    };
	  };
	
	  // Returns a function that will be executed at most one time, no matter how
	  // often you call it. Useful for lazy initialization.
	  _.once = _.partial(_.before, 2);
	
	  // Object Functions
	  // ----------------
	
	  // Retrieve the names of an object's properties.
	  // Delegates to **ECMAScript 5**'s native `Object.keys`
	  _.keys = function(obj) {
	    if (!_.isObject(obj)) return [];
	    if (nativeKeys) return nativeKeys(obj);
	    var keys = [];
	    for (var key in obj) if (_.has(obj, key)) keys.push(key);
	    return keys;
	  };
	
	  // Retrieve the values of an object's properties.
	  _.values = function(obj) {
	    var keys = _.keys(obj);
	    var length = keys.length;
	    var values = Array(length);
	    for (var i = 0; i < length; i++) {
	      values[i] = obj[keys[i]];
	    }
	    return values;
	  };
	
	  // Convert an object into a list of `[key, value]` pairs.
	  _.pairs = function(obj) {
	    var keys = _.keys(obj);
	    var length = keys.length;
	    var pairs = Array(length);
	    for (var i = 0; i < length; i++) {
	      pairs[i] = [keys[i], obj[keys[i]]];
	    }
	    return pairs;
	  };
	
	  // Invert the keys and values of an object. The values must be serializable.
	  _.invert = function(obj) {
	    var result = {};
	    var keys = _.keys(obj);
	    for (var i = 0, length = keys.length; i < length; i++) {
	      result[obj[keys[i]]] = keys[i];
	    }
	    return result;
	  };
	
	  // Return a sorted list of the function names available on the object.
	  // Aliased as `methods`
	  _.functions = _.methods = function(obj) {
	    var names = [];
	    for (var key in obj) {
	      if (_.isFunction(obj[key])) names.push(key);
	    }
	    return names.sort();
	  };
	
	  // Extend a given object with all the properties in passed-in object(s).
	  _.extend = function(obj) {
	    if (!_.isObject(obj)) return obj;
	    var source, prop;
	    for (var i = 1, length = arguments.length; i < length; i++) {
	      source = arguments[i];
	      for (prop in source) {
	        if (hasOwnProperty.call(source, prop)) {
	            obj[prop] = source[prop];
	        }
	      }
	    }
	    return obj;
	  };
	
	  // Return a copy of the object only containing the whitelisted properties.
	  _.pick = function(obj, iteratee, context) {
	    var result = {}, key;
	    if (obj == null) return result;
	    if (_.isFunction(iteratee)) {
	      iteratee = createCallback(iteratee, context);
	      for (key in obj) {
	        var value = obj[key];
	        if (iteratee(value, key, obj)) result[key] = value;
	      }
	    } else {
	      var keys = concat.apply([], slice.call(arguments, 1));
	      obj = new Object(obj);
	      for (var i = 0, length = keys.length; i < length; i++) {
	        key = keys[i];
	        if (key in obj) result[key] = obj[key];
	      }
	    }
	    return result;
	  };
	
	   // Return a copy of the object without the blacklisted properties.
	  _.omit = function(obj, iteratee, context) {
	    if (_.isFunction(iteratee)) {
	      iteratee = _.negate(iteratee);
	    } else {
	      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
	      iteratee = function(value, key) {
	        return !_.contains(keys, key);
	      };
	    }
	    return _.pick(obj, iteratee, context);
	  };
	
	  // Fill in a given object with default properties.
	  _.defaults = function(obj) {
	    if (!_.isObject(obj)) return obj;
	    for (var i = 1, length = arguments.length; i < length; i++) {
	      var source = arguments[i];
	      for (var prop in source) {
	        if (obj[prop] === void 0) obj[prop] = source[prop];
	      }
	    }
	    return obj;
	  };
	
	  // Create a (shallow-cloned) duplicate of an object.
	  _.clone = function(obj) {
	    if (!_.isObject(obj)) return obj;
	    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
	  };
	
	  // Invokes interceptor with the obj, and then returns obj.
	  // The primary purpose of this method is to "tap into" a method chain, in
	  // order to perform operations on intermediate results within the chain.
	  _.tap = function(obj, interceptor) {
	    interceptor(obj);
	    return obj;
	  };
	
	  // Internal recursive comparison function for `isEqual`.
	  var eq = function(a, b, aStack, bStack) {
	    // Identical objects are equal. `0 === -0`, but they aren't identical.
	    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
	    if (a === b) return a !== 0 || 1 / a === 1 / b;
	    // A strict comparison is necessary because `null == undefined`.
	    if (a == null || b == null) return a === b;
	    // Unwrap any wrapped objects.
	    if (a instanceof _) a = a._wrapped;
	    if (b instanceof _) b = b._wrapped;
	    // Compare `[[Class]]` names.
	    var className = toString.call(a);
	    if (className !== toString.call(b)) return false;
	    switch (className) {
	      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
	      case '[object RegExp]':
	      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
	      case '[object String]':
	        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
	        // equivalent to `new String("5")`.
	        return '' + a === '' + b;
	      case '[object Number]':
	        // `NaN`s are equivalent, but non-reflexive.
	        // Object(NaN) is equivalent to NaN
	        if (+a !== +a) return +b !== +b;
	        // An `egal` comparison is performed for other numeric values.
	        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
	      case '[object Date]':
	      case '[object Boolean]':
	        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
	        // millisecond representations. Note that invalid dates with millisecond representations
	        // of `NaN` are not equivalent.
	        return +a === +b;
	    }
	    if (typeof a != 'object' || typeof b != 'object') return false;
	    // Assume equality for cyclic structures. The algorithm for detecting cyclic
	    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
	    var length = aStack.length;
	    while (length--) {
	      // Linear search. Performance is inversely proportional to the number of
	      // unique nested structures.
	      if (aStack[length] === a) return bStack[length] === b;
	    }
	    // Objects with different constructors are not equivalent, but `Object`s
	    // from different frames are.
	    var aCtor = a.constructor, bCtor = b.constructor;
	    if (
	      aCtor !== bCtor &&
	      // Handle Object.create(x) cases
	      'constructor' in a && 'constructor' in b &&
	      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
	        _.isFunction(bCtor) && bCtor instanceof bCtor)
	    ) {
	      return false;
	    }
	    // Add the first object to the stack of traversed objects.
	    aStack.push(a);
	    bStack.push(b);
	    var size, result;
	    // Recursively compare objects and arrays.
	    if (className === '[object Array]') {
	      // Compare array lengths to determine if a deep comparison is necessary.
	      size = a.length;
	      result = size === b.length;
	      if (result) {
	        // Deep compare the contents, ignoring non-numeric properties.
	        while (size--) {
	          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
	        }
	      }
	    } else {
	      // Deep compare objects.
	      var keys = _.keys(a), key;
	      size = keys.length;
	      // Ensure that both objects contain the same number of properties before comparing deep equality.
	      result = _.keys(b).length === size;
	      if (result) {
	        while (size--) {
	          // Deep compare each member
	          key = keys[size];
	          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
	        }
	      }
	    }
	    // Remove the first object from the stack of traversed objects.
	    aStack.pop();
	    bStack.pop();
	    return result;
	  };
	
	  // Perform a deep comparison to check if two objects are equal.
	  _.isEqual = function(a, b) {
	    return eq(a, b, [], []);
	  };
	
	  // Is a given array, string, or object empty?
	  // An "empty" object has no enumerable own-properties.
	  _.isEmpty = function(obj) {
	    if (obj == null) return true;
	    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
	    for (var key in obj) if (_.has(obj, key)) return false;
	    return true;
	  };
	
	  // Is a given value a DOM element?
	  _.isElement = function(obj) {
	    return !!(obj && obj.nodeType === 1);
	  };
	
	  // Is a given value an array?
	  // Delegates to ECMA5's native Array.isArray
	  _.isArray = nativeIsArray || function(obj) {
	    return toString.call(obj) === '[object Array]';
	  };
	
	  // Is a given variable an object?
	  _.isObject = function(obj) {
	    var type = typeof obj;
	    return type === 'function' || type === 'object' && !!obj;
	  };
	
	  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
	  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
	    _['is' + name] = function(obj) {
	      return toString.call(obj) === '[object ' + name + ']';
	    };
	  });
	
	  // Define a fallback version of the method in browsers (ahem, IE), where
	  // there isn't any inspectable "Arguments" type.
	  if (!_.isArguments(arguments)) {
	    _.isArguments = function(obj) {
	      return _.has(obj, 'callee');
	    };
	  }
	
	  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
	  if (true) {
	    _.isFunction = function(obj) {
	      return typeof obj == 'function' || false;
	    };
	  }
	
	  // Is a given object a finite number?
	  _.isFinite = function(obj) {
	    return isFinite(obj) && !isNaN(parseFloat(obj));
	  };
	
	  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
	  _.isNaN = function(obj) {
	    return _.isNumber(obj) && obj !== +obj;
	  };
	
	  // Is a given value a boolean?
	  _.isBoolean = function(obj) {
	    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
	  };
	
	  // Is a given value equal to null?
	  _.isNull = function(obj) {
	    return obj === null;
	  };
	
	  // Is a given variable undefined?
	  _.isUndefined = function(obj) {
	    return obj === void 0;
	  };
	
	  // Shortcut function for checking if an object has a given property directly
	  // on itself (in other words, not on a prototype).
	  _.has = function(obj, key) {
	    return obj != null && hasOwnProperty.call(obj, key);
	  };
	
	  // Utility Functions
	  // -----------------
	
	  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
	  // previous owner. Returns a reference to the Underscore object.
	  _.noConflict = function() {
	    root._ = previousUnderscore;
	    return this;
	  };
	
	  // Keep the identity function around for default iteratees.
	  _.identity = function(value) {
	    return value;
	  };
	
	  _.constant = function(value) {
	    return function() {
	      return value;
	    };
	  };
	
	  _.noop = function(){};
	
	  _.property = function(key) {
	    return function(obj) {
	      return obj[key];
	    };
	  };
	
	  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
	  _.matches = function(attrs) {
	    var pairs = _.pairs(attrs), length = pairs.length;
	    return function(obj) {
	      if (obj == null) return !length;
	      obj = new Object(obj);
	      for (var i = 0; i < length; i++) {
	        var pair = pairs[i], key = pair[0];
	        if (pair[1] !== obj[key] || !(key in obj)) return false;
	      }
	      return true;
	    };
	  };
	
	  // Run a function **n** times.
	  _.times = function(n, iteratee, context) {
	    var accum = Array(Math.max(0, n));
	    iteratee = createCallback(iteratee, context, 1);
	    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
	    return accum;
	  };
	
	  // Return a random integer between min and max (inclusive).
	  _.random = function(min, max) {
	    if (max == null) {
	      max = min;
	      min = 0;
	    }
	    return min + Math.floor(Math.random() * (max - min + 1));
	  };
	
	  // A (possibly faster) way to get the current timestamp as an integer.
	  _.now = Date.now || function() {
	    return new Date().getTime();
	  };
	
	   // List of HTML entities for escaping.
	  var escapeMap = {
	    '&': '&amp;',
	    '<': '&lt;',
	    '>': '&gt;',
	    '"': '&quot;',
	    "'": '&#x27;',
	    '`': '&#x60;'
	  };
	  var unescapeMap = _.invert(escapeMap);
	
	  // Functions for escaping and unescaping strings to/from HTML interpolation.
	  var createEscaper = function(map) {
	    var escaper = function(match) {
	      return map[match];
	    };
	    // Regexes for identifying a key that needs to be escaped
	    var source = '(?:' + _.keys(map).join('|') + ')';
	    var testRegexp = RegExp(source);
	    var replaceRegexp = RegExp(source, 'g');
	    return function(string) {
	      string = string == null ? '' : '' + string;
	      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
	    };
	  };
	  _.escape = createEscaper(escapeMap);
	  _.unescape = createEscaper(unescapeMap);
	
	  // If the value of the named `property` is a function then invoke it with the
	  // `object` as context; otherwise, return it.
	  _.result = function(object, property) {
	    if (object == null) return void 0;
	    var value = object[property];
	    return _.isFunction(value) ? object[property]() : value;
	  };
	
	  // Generate a unique integer id (unique within the entire client session).
	  // Useful for temporary DOM ids.
	  var idCounter = 0;
	  _.uniqueId = function(prefix) {
	    var id = ++idCounter + '';
	    return prefix ? prefix + id : id;
	  };
	
	  // By default, Underscore uses ERB-style template delimiters, change the
	  // following template settings to use alternative delimiters.
	  _.templateSettings = {
	    evaluate    : /<%([\s\S]+?)%>/g,
	    interpolate : /<%=([\s\S]+?)%>/g,
	    escape      : /<%-([\s\S]+?)%>/g
	  };
	
	  // When customizing `templateSettings`, if you don't want to define an
	  // interpolation, evaluation or escaping regex, we need one that is
	  // guaranteed not to match.
	  var noMatch = /(.)^/;
	
	  // Certain characters need to be escaped so that they can be put into a
	  // string literal.
	  var escapes = {
	    "'":      "'",
	    '\\':     '\\',
	    '\r':     'r',
	    '\n':     'n',
	    '\u2028': 'u2028',
	    '\u2029': 'u2029'
	  };
	
	  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;
	
	  var escapeChar = function(match) {
	    return '\\' + escapes[match];
	  };
	
	  // JavaScript micro-templating, similar to John Resig's implementation.
	  // Underscore templating handles arbitrary delimiters, preserves whitespace,
	  // and correctly escapes quotes within interpolated code.
	  // NB: `oldSettings` only exists for backwards compatibility.
	  _.template = function(text, settings, oldSettings) {
	    if (!settings && oldSettings) settings = oldSettings;
	    settings = _.defaults({}, settings, _.templateSettings);
	
	    // Combine delimiters into one regular expression via alternation.
	    var matcher = RegExp([
	      (settings.escape || noMatch).source,
	      (settings.interpolate || noMatch).source,
	      (settings.evaluate || noMatch).source
	    ].join('|') + '|$', 'g');
	
	    // Compile the template source, escaping string literals appropriately.
	    var index = 0;
	    var source = "__p+='";
	    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
	      source += text.slice(index, offset).replace(escaper, escapeChar);
	      index = offset + match.length;
	
	      if (escape) {
	        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
	      } else if (interpolate) {
	        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
	      } else if (evaluate) {
	        source += "';\n" + evaluate + "\n__p+='";
	      }
	
	      // Adobe VMs need the match returned to produce the correct offest.
	      return match;
	    });
	    source += "';\n";
	
	    // If a variable is not specified, place data values in local scope.
	    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
	
	    source = "var __t,__p='',__j=Array.prototype.join," +
	      "print=function(){__p+=__j.call(arguments,'');};\n" +
	      source + 'return __p;\n';
	
	    try {
	      var render = new Function(settings.variable || 'obj', '_', source);
	    } catch (e) {
	      e.source = source;
	      throw e;
	    }
	
	    var template = function(data) {
	      return render.call(this, data, _);
	    };
	
	    // Provide the compiled source as a convenience for precompilation.
	    var argument = settings.variable || 'obj';
	    template.source = 'function(' + argument + '){\n' + source + '}';
	
	    return template;
	  };
	
	  // Add a "chain" function. Start chaining a wrapped Underscore object.
	  _.chain = function(obj) {
	    var instance = _(obj);
	    instance._chain = true;
	    return instance;
	  };
	
	  // OOP
	  // ---------------
	  // If Underscore is called as a function, it returns a wrapped object that
	  // can be used OO-style. This wrapper holds altered versions of all the
	  // underscore functions. Wrapped objects may be chained.
	
	  // Helper function to continue chaining intermediate results.
	  var result = function(obj) {
	    return this._chain ? _(obj).chain() : obj;
	  };
	
	  // Add your own custom functions to the Underscore object.
	  _.mixin = function(obj) {
	    _.each(_.functions(obj), function(name) {
	      var func = _[name] = obj[name];
	      _.prototype[name] = function() {
	        var args = [this._wrapped];
	        push.apply(args, arguments);
	        return result.call(this, func.apply(_, args));
	      };
	    });
	  };
	
	  // Add all of the Underscore functions to the wrapper object.
	  _.mixin(_);
	
	  // Add all mutator Array functions to the wrapper.
	  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
	    var method = ArrayProto[name];
	    _.prototype[name] = function() {
	      var obj = this._wrapped;
	      method.apply(obj, arguments);
	      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
	      return result.call(this, obj);
	    };
	  });
	
	  // Add all accessor Array functions to the wrapper.
	  _.each(['concat', 'join', 'slice'], function(name) {
	    var method = ArrayProto[name];
	    _.prototype[name] = function() {
	      return result.call(this, method.apply(this._wrapped, arguments));
	    };
	  });
	
	  // Extracts the result from a wrapped and chained object.
	  _.prototype.value = function() {
	    return this._wrapped;
	  };
	
	  // AMD registration happens at the end for compatibility with AMD loaders
	  // that may not enforce next-turn semantics on modules. Even though general
	  // practice for AMD registration is to be anonymous, underscore registers
	  // as a named module because, like jQuery, it is a base library that is
	  // popular enough to be bundled in a third party lib, but not be part of
	  // an AMD load request. Those cases could generate an error when an
	  // anonymous define() is called outside of a loader request.
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
	      return _;
	    }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  }
	}.call(this));


/***/ },
/* 3 */
/*!*****************************!*\
  !*** ./src/js/tabWindow.js ***!
  \*****************************/
/***/ function(module, exports) {

	/**
	 * Representations of windows and bookmark folders
	 */
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.makeChromeTabWindow = makeChromeTabWindow;
	exports.makeFolderTabWindow = makeFolderTabWindow;
	exports.deserialize = deserialize;
	function makeBookmarkedTabItem(bm) {
	  var ret = Object.create(bm);
	  ret.bookmarked = true;
	  ret.open = false;
	  ret.bookmark = bm;
	  return ret;
	};
	
	function makeOpenTabItem(ot) {
	  var ret = Object.create(ot);
	  ret.bookmarked = false;
	  ret.open = true;
	  return ret;
	};
	
	/*
	 * Gather open tabs and a set of non-opened bookmarks from the given bookmarks 
	 * list for a managed window that is open
	 */
	function getManagedOpenTabInfo(openTabs, bookmarks) {
	  var urlMap = {};
	  var tabs = openTabs.map(function (ot) {
	    var item = makeOpenTabItem(ot);
	    urlMap[ot.url] = item;
	    return item;
	  });
	  var closedBookmarks = [];
	  for (var i = 0; i < bookmarks.length; i++) {
	    var bm = bookmarks[i];
	    var obm = urlMap[bm.url];
	    if (obm) {
	      obm.bookmarked = true;
	      obm.bookmark = bm;
	    } else {
	      closedBookmarks.push(makeBookmarkedTabItem(bm));
	    }
	  }
	  return { openTabs: tabs, closedBookmarks: closedBookmarks };
	}
	
	/*
	 * For a managed, open window, return a list of tab items
	 * representing both open tabs and closed bookmarks, making
	 * best effort to preserve a sensible order
	 */
	function getManagedOpenTabs(chromeWindow, bookmarkFolder) {
	  var tabInfo = getManagedOpenTabInfo(chromeWindow.tabs, bookmarkFolder.children);
	  /*
	   * So it's actually not possible to come up with a perfect ordering here, since we
	   * want to preserve both bookmark order (whether open or closed) and order of
	   * currently open tabs.
	   * As a compromise, we'll present bookmarked, opened tabs for as long as they
	   * match the bookmark ordering, then we'll inject the closed bookmarks, then
	   * everything else.
	   */
	  var outTabs = [];
	  var openTabs = tabInfo.openTabs.slice();
	  var bookmarks = bookmarkFolder.children.slice();
	
	  while (openTabs.length > 0 && bookmarks.length > 0) {
	    var tab = openTabs.shift();
	    var bm = bookmarks.shift();
	    if (tab.bookmarked && bm.url === tab.url) {
	      outTabs.push(tab);
	      tab = null;
	      bm = null;
	    } else {
	      break;
	    }
	  }
	  // we hit a non-matching tab, now inject closed bookmarks:
	  outTabs = outTabs.concat(tabInfo.closedBookmarks);
	  if (tab) {
	    outTabs.push(tab);
	  }
	  // and inject the remaining tabs:
	  outTabs = outTabs.concat(openTabs);
	
	  return outTabs;
	}
	
	var tabWindowPrototype = {
	  _managed: false,
	  _managedTitle: "",
	  chromeWindow: null,
	  bookmarkFolder: null,
	  open: false,
	
	  reloadBookmarkFolder: function reloadBookmarkFolder() {
	    var tabWindow = this;
	    chrome.bookmarks.getSubTree(this.bookmarkFolder.id, function (folderNodes) {
	      var fullFolderNode = folderNodes[0];
	      tabWindow.bookmarkFolder = fullFolderNode;
	    });
	  },
	
	  getTitle: function getTitle() {
	    if (this._managed) {
	      return this.bookmarkFolder.title;
	    } else {
	      var tabs = this.chromeWindow.tabs;
	      if (!tabs) return ""; // window initializing
	
	      // linear search to find active tab to use as window title
	      for (var j = 0; j < tabs.length; j++) {
	        var tab = tabs[j];
	        if (tab.active) {
	          return tab.title;
	        }
	      }
	    }
	    return ""; // shouldn't happen
	  },
	
	  isManaged: function isManaged() {
	    return this._managed;
	  },
	
	  isFocused: function isFocused() {
	    return this.open && this.chromeWindow && this.chromeWindow.focused;
	  },
	
	  // Get a set of tab-like items for rendering
	  getTabItems: function getTabItems() {
	    var tabs;
	
	    if (this.isManaged()) {
	      if (this.open) {
	        tabs = getManagedOpenTabs(this.chromeWindow, this.bookmarkFolder);
	      } else {
	        tabs = this.bookmarkFolder.children.map(makeBookmarkedTabItem);
	      }
	    } else {
	      tabs = this.chromeWindow.tabs;
	      if (!tabs) return [];
	      tabs = tabs.map(makeOpenTabItem);
	    }
	
	    return tabs;
	  },
	
	  /*
	   * return bookmark Id or chrome Id dependending on tabWindow type
	   */
	  getEncodedId: function getEncodedId() {
	    var idType;
	    var id;
	
	    if (this.bookmarkFolder) {
	      idType = "bookmark";
	      id = this.bookmarkFolder.id;
	    } else {
	      idType = "window";
	      id = this.chromeWindow.id;
	    }
	    return { idType: idType, id: id };
	  }
	};
	
	/*  
	 * initialize a tab window from a (unmanaged) chrome Window
	 */
	
	function makeChromeTabWindow(chromeWindow) {
	  var ret = Object.create(tabWindowPrototype);
	  ret.chromeWindow = chromeWindow;
	  ret.open = true;
	  return ret;
	}
	
	/*
	 * initialize an unopened window from a bookmarks folder
	 */
	
	function makeFolderTabWindow(bookmarkFolder) {
	  var ret = Object.create(tabWindowPrototype);
	  ret._managed = true;
	  ret.bookmarkFolder = bookmarkFolder;
	
	  return ret;
	}
	
	/*
	 * deserialize a TabWindow from its payload:
	 */
	
	function deserialize(payload) {
	  if (payload._managed) {
	    return makeFolderTabWindow(payload.bookmarkFolder);
	  } else {
	    return makeChromeTabWindow(payload.chromeWindow);
	  }
	}

/***/ },
/* 4 */
/*!****************************!*\
  !*** ./~/events/events.js ***!
  \****************************/
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;
	
	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;
	
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;
	
	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;
	
	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};
	
	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;
	
	  if (!this._events)
	    this._events = {};
	
	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }
	
	  handler = this._events[type];
	
	  if (isUndefined(handler))
	    return false;
	
	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        len = arguments.length;
	        args = new Array(len - 1);
	        for (i = 1; i < len; i++)
	          args[i - 1] = arguments[i];
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    len = arguments.length;
	    args = new Array(len - 1);
	    for (i = 1; i < len; i++)
	      args[i - 1] = arguments[i];
	
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }
	
	  return true;
	};
	
	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events)
	    this._events = {};
	
	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);
	
	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];
	
	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    var m;
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }
	
	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.on = EventEmitter.prototype.addListener;
	
	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  var fired = false;
	
	  function g() {
	    this.removeListener(type, g);
	
	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }
	
	  g.listener = listener;
	  this.on(type, g);
	
	  return this;
	};
	
	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events || !this._events[type])
	    return this;
	
	  list = this._events[type];
	  length = list.length;
	  position = -1;
	
	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }
	
	    if (position < 0)
	      return this;
	
	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }
	
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;
	
	  if (!this._events)
	    return this;
	
	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }
	
	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }
	
	  listeners = this._events[type];
	
	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];
	
	  return this;
	};
	
	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};
	
	EventEmitter.listenerCount = function(emitter, type) {
	  var ret;
	  if (!emitter._events || !emitter._events[type])
	    ret = 0;
	  else if (isFunction(emitter._events[type]))
	    ret = 1;
	  else
	    ret = emitter._events[type].length;
	  return ret;
	};
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	
	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 5 */
/*!***************************!*\
  !*** ./src/js/actions.js ***!
  \***************************/
/***/ function(module, exports) {

	'use strict';
	
	/**
	 * get all open Chrome windows and synchronize state with our tab window store
	 *
	 * cb -- if non-null, no-argument callback to call when complete
	 *
	 */
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.syncChromeWindows = syncChromeWindows;
	exports.openTabWindow = openTabWindow;
	exports.activateTab = activateTab;
	exports.closeTab = closeTab;
	exports.closeTabWindow = closeTabWindow;
	
	function syncChromeWindows(winStore, cb) {
	  var t_preGet = performance.now();
	  chrome.windows.getAll({ populate: true }, function (windowList) {
	    var t_postGet = performance.now();
	    console.log("syncChromeWindows: chrome.windows.getAll took ", t_postGet - t_preGet, " ms");
	    winStore.syncWindowList(windowList);
	    if (cb) cb();
	  });
	}
	
	/**
	 * restore a bookmark window.
	 *
	 * N.B.: NOT exported; called from openTabWindow
	 */
	function restoreBookmarkWindow(winStore, tabWindow) {
	  console.log("restoreBookmarkWindow: ", tabWindow);
	  var self = this;
	  /*
	   * special case handling of replacing the contents of a fresh window 
	   */
	  chrome.windows.getLastFocused({ populate: true }, function (currentChromeWindow) {
	    var urls = [];
	    var tabs = tabWindow.getTabItems();
	    var urls = tabs.map(function (item) {
	      return item.url;
	    });
	    function cf(chromeWindow) {
	      console.log("restoreBookmarkWindow: cf");
	      winStore.attachChromeWindow(tabWindow, chromeWindow);
	    }
	    console.log("current chrome window: ", currentChromeWindow);
	    if (currentChromeWindow.tabs.length === 1 && currentChromeWindow.tabs[0].url === "chrome://newtab/") {
	      console.log("found new window -- replacing contents");
	      var origTabId = currentChromeWindow.tabs[0].id;
	      // new window -- replace contents with urls:
	      for (var i = 0; i < urls.length; i++) {
	        // First use our existing tab:
	        if (i == 0) {
	          chrome.tabs.update(origTabId, { url: urls[i] });
	        } else {
	          var tabInfo = { windowId: currentChromeWindow.id, url: urls[i] };
	          chrome.tabs.create(tabInfo);
	        }
	      }
	    } else {
	      // normal case -- create a new window for these urls:
	      chrome.windows.create({ url: urls, focused: true, type: 'normal' }, cf);
	    }
	  });
	}
	
	function openTabWindow(winStore, tabWindow) {
	  var self = this;
	
	  var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
	  if (tabWindow.open) {
	    // existing, open window -- just transfer focus
	    chrome.windows.update(windowId, { focused: true });
	    // TODO: update focus in winStore
	  } else {
	      // bookmarked window -- need to open it!
	      restoreBookmarkWindow(winStore, tabWindow);
	    }
	}
	
	// activate a specific tab:
	function activateTab(winStore, tabWindow, tab, tabIndex) {
	  var self = this;
	  console.log("activateTab: ", tabWindow, tab);
	  if (tabWindow.open) {
	    // OK, so we know this window is open.  What about the specific tab?
	    if (tab.open) {
	      // Tab is already open, just make it active:
	      console.log("making tab active");
	      chrome.tabs.update(tab.id, { active: true }, function () {
	        console.log("making tab's window active");
	        chrome.windows.update(tabWindow.chromeWindow.id, { focused: true });
	      });
	    } else {
	      // restore this bookmarked tab:
	      var createOpts = {
	        windowId: tabWindow.chromeWindow.id,
	        url: tab.url,
	        index: tabIndex,
	        active: true
	      };
	      console.log("restoring bookmarked tab");
	      chrome.tabs.create(createOpts, callback);
	    }
	  } else {
	    console.log("activateTab: opening non-open window");
	    openTabWindow(tabWindow);
	    // TODO: activate chosen tab after opening window!
	  }
	}
	
	function closeTab(winStore, windowId, tabId) {
	  console.log("closeTab: closing tab ", windowId, tabId);;
	  var self = this;
	  chrome.tabs.remove(tabId, function () {
	    winStore.handleTabClosed(windowId, tabId);
	  });
	}
	
	function closeTabWindow(winStore, tabWindow) {
	  console.log("closeTabWindow: ", tabWindow);
	  if (!tabWindow.open) {
	    console.log("closeTabWindow: request to close non-open window, ignoring...");
	    return;
	  }
	  var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
	  if (!windowId) {
	    console.log("closeTabWindow: no valid chrome window, ignoring....");
	    return;
	  }
	  var self = this;
	  chrome.windows.remove(windowId, function () {
	    tabWindow.open = false;
	    winStore.handleTabWindowClosed(tabWindow);
	  });
	}

/***/ }
/******/ ]);
//# sourceMappingURL=bgHelper.bundle.js.map