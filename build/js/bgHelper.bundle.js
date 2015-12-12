webpackJsonp([0],{

/***/ 0:
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
	
	var _tabManagerState = __webpack_require__(/*! ./tabManagerState */ 1);
	
	var _tabManagerState2 = _interopRequireDefault(_tabManagerState);
	
	var _tabWindow = __webpack_require__(/*! ./tabWindow */ 5);
	
	var TabWindow = _interopRequireWildcard(_tabWindow);
	
	var _actions = __webpack_require__(/*! ./actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _viewRef = __webpack_require__(/*! ./viewRef */ 415);
	
	var _viewRef2 = _interopRequireDefault(_viewRef);
	
	var _componentsTabliPopup = __webpack_require__(/*! ./components/TabliPopup */ 417);
	
	var _componentsTabliPopup2 = _interopRequireDefault(_componentsTabliPopup);
	
	var popupPort = null;
	var tabmanFolderTitle = "Tabli Saved Windows";
	var archiveFolderTitle = "_Archive";
	
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
	  console.log("Child folder ", childFolderName, " Not found, creating...");
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
	      console.log("tab manager folder acquired.");
	      tabmanFolderId = tabManFolder.id;
	      ensureChildFolder(tabManFolder, archiveFolderTitle, function (archiveFolder) {
	        console.log("archive folder acquired.");
	        archiveFolderId = archiveFolder.id;
	        chrome.bookmarks.getSubTree(tabManFolder.id, function (subTreeNodes) {
	          // console.log("bookmarks.getSubTree for TabManFolder: ", subTreeNodes);
	          var baseWinStore = new _tabManagerState2['default']({ folderId: tabmanFolderId, archiveFolderId: archiveFolderId });
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
	        // console.log("Removed view listener ", listenerId);
	      });
	    });
	  });
	}
	
	/**
	 * Download the specified object as JSON (for testing)
	 */
	function downloadJSON(dumpObj, filename) {
	  var dumpStr = JSON.stringify(dumpObj, null, 2);
	  var winBlob = new Blob([dumpStr], { type: "application/json" });
	  var url = URL.createObjectURL(winBlob);
	  chrome.downloads.download({ url: url, filename: filename });
	}
	
	/**
	 * dump all windows -- useful for creating performance tests
	 *
	 * NOTE:  Requires the "downloads" permission in the manifest!
	 */
	function dumpAll(winStore) {
	  var allWindows = winStore.getAll();
	
	  var jsWindows = allWindows.map(function (tw) {
	    return tw.toJS();
	  });
	
	  var dumpObj = { allWindows: jsWindows };
	
	  downloadJSON(dumpObj, 'winStoreSnap.json');
	}
	
	function dumpChromeWindows() {
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
	
	    /* Let's create a dummy app element to render our current store 
	     * React.renderToString() will remount the component, so really want a fresh element here with exactly
	     * the store state we wish to render and save.
	     */
	    var renderAppElement = React.createElement(_componentsTabliPopup2['default'], { storeRef: null, initialWinStore: winStore, noListener: true });
	    var renderedString = React.renderToString(renderAppElement);
	    // console.log("renderAndSave: updated saved store and HTML");
	    window.savedStore = winStore;
	    window.savedHTML = renderedString;
	  }
	  return renderAndSave;
	}
	
	function main() {
	  initWinStore(function (bmStore) {
	    // console.log("init: done reading bookmarks: ", bmStore);
	    // window.winStore = winStore;
	    actions.syncChromeWindows(function (uf) {
	      console.log("initial sync of chrome windows complete.");
	      var syncedStore = uf(bmStore);
	
	      window.storeRef = new _viewRef2['default'](syncedStore);
	
	      // dumpAll(winStore);
	      // dumpChromeWindows();
	
	      var renderListener = makeRenderListener(window.storeRef);
	      // And call it once to get started:
	      renderListener();
	      storeRef.on("change", renderListener);
	
	      setupConnectionListener(window.storeRef);
	    });
	  });
	}
	
	main();

/***/ },

/***/ 1:
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
	      // console.log("handleTabWindowClosed: ", tabWindow.toJS());
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
	      // console.log("attachChromeWindow: ", tabWindow.toJS(), chromeWindow);
	
	      // Was this Chrome window id previously associated with some other tab window?
	      var oldTabWindow = this.windowIdMap.get(chromeWindow.id);
	
	      // A store without oldTabWindow
	      var rmStore = oldTabWindow ? this.handleTabWindowClosed(oldTabWindow) : this;
	
	      var attachedTabWindow = TabWindow.updateWindow(tabWindow, chromeWindow);
	
	      console.log("attachChromeWindow: attachedTabWindow: ", attachedTabWindow.toJS());
	
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
	      /*
	      if (!prevTabWindow) {
	        console.log("syncChromeWindow: detected new chromeWindow: ", chromeWindow);
	      }
	      */
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

/***/ },

/***/ 412:
/*!************************************!*\
  !*** ./src/js/components/Modal.js ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _styles = __webpack_require__(/*! ./styles */ 400);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 402);
	
	var Util = _interopRequireWildcard(_util);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _HeaderButton = __webpack_require__(/*! ./HeaderButton */ 405);
	
	var _HeaderButton2 = _interopRequireDefault(_HeaderButton);
	
	/*
	 * generic modal dialog component
	 */
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	var Dialog = React.createClass({
	  displayName: 'Dialog',
	
	  handleClose: function handleClose(event) {
	    console.log("Modal.handleClose: ", event, arguments);
	    event.preventDefault();
	    this.props.onClose(event);
	  },
	
	  render: function render() {
	    var modalDiv = null;
	
	    var titleStyle = Util.merge(_styles2['default'].text, _styles2['default'].noWrap, _styles2['default'].modalTitle, _styles2['default'].open);
	    var closeStyle = Util.merge(_styles2['default'].headerButton, _styles2['default'].closeButton);
	    var closeButton = React.createElement(_HeaderButton2['default'], { baseStyle: closeStyle, visible: true,
	      hoverStyle: _styles2['default'].closeButtonHover, title: 'Close Window',
	      onClick: this.handleClose });
	    modalDiv = React.createElement(
	      'div',
	      { style: _styles2['default'].modalOverlay },
	      React.createElement(
	        'div',
	        { style: _styles2['default'].modalContainer },
	        React.createElement(
	          'div',
	          { style: Util.merge(_styles2['default'].windowHeader, _styles2['default'].noWrap) },
	          React.createElement(
	            'span',
	            { style: titleStyle },
	            this.props.title
	          ),
	          React.createElement('div', { style: _styles2['default'].spacer }),
	          closeButton
	        ),
	        this.props.children
	      )
	    );
	    return modalDiv;
	  },
	
	  componentDidMount: function componentDidMount() {
	    console.log("Modal: componentDidMount");
	  }
	});
	
	exports.Dialog = Dialog;
	var Info = React.createClass({
	  displayName: 'Info',
	
	  render: function render() {
	    return React.createElement(
	      'div',
	      { style: _styles2['default'].dialogInfo },
	      React.createElement(
	        'div',
	        { style: _styles2['default'].dialogInfoContents },
	        this.props.children
	      )
	    );
	  }
	});
	
	exports.Info = Info;
	var Body = React.createClass({
	  displayName: 'Body',
	
	  render: function render() {
	    return React.createElement(
	      'div',
	      { style: _styles2['default'].modalBodyContainer },
	      this.props.children
	    );
	  }
	});
	exports.Body = Body;

/***/ },

/***/ 413:
/*!******************************************!*\
  !*** ./src/js/components/RevertModal.js ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _styles = __webpack_require__(/*! ./styles */ 400);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 402);
	
	var Util = _interopRequireWildcard(_util);
	
	var _constants = __webpack_require__(/*! ./constants */ 401);
	
	var Constants = _interopRequireWildcard(_constants);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _Modal = __webpack_require__(/*! ./Modal */ 412);
	
	var Modal = _interopRequireWildcard(_Modal);
	
	/*
	 * Modal dialog for reverting a bookmarked window
	 */
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	var RevertModal = React.createClass({
	  displayName: 'RevertModal',
	
	  handleKeyDown: function handleKeyDown(e) {
	    if (e.keyCode == Constants.KEY_ESC) {
	      // ESC key
	      e.preventDefault();
	      this.props.onClose(e);
	    } else if (e.keyCode == Constants.KEY_ENTER) {
	      this.handleSubmit(e);
	    }
	  },
	  handleSubmit: function handleSubmit(e) {
	    e.preventDefault();
	    this.props.onSubmit(this.props.tabWindow);
	  },
	  renderItem: function renderItem(tabItem) {
	    var fiSrc = tabItem.favIconUrl ? tabItem.favIconUrl : "";
	    // Skip the chrome FAVICONs; they just throw when accessed.
	    if (fiSrc.indexOf("chrome://theme/") == 0) {
	      fiSrc = "";
	    }
	    var tabFavIcon = React.createElement('img', { style: _styles2['default'].favIcon, src: fiSrc });
	    var tabOpenStyle = tabItem.open ? null : _styles2['default'].closed;
	    var tabActiveStyle = tabItem.active ? _styles2['default'].activeSpan : null;
	    var tabTitleStyles = Util.merge(_styles2['default'].text, _styles2['default'].tabTitle, _styles2['default'].noWrap, tabOpenStyle, tabActiveStyle);
	    return React.createElement(
	      'div',
	      { style: _styles2['default'].noWrap },
	      tabFavIcon,
	      React.createElement(
	        'span',
	        { style: tabTitleStyles },
	        tabItem.title
	      ),
	      React.createElement('div', { style: _styles2['default'].spacer })
	    );
	  },
	  renderTabItems: function renderTabItems(tabItems) {
	    var itemElems = tabItems.map(this.renderItem);
	    return React.createElement(
	      'div',
	      { style: _styles2['default'].tabList },
	      itemElems
	    );
	  },
	  render: function render() {
	    var tabWindow = this.props.tabWindow;
	    var revertedTabWindow = TabWindow.removeOpenWindowState(tabWindow);
	    var savedUrlsSet = Immutable.Set(revertedTabWindow.tabItems.map(function (ti) {
	      return ti.url;
	    }));
	
	    var itemsToClose = tabWindow.tabItems.filter(function (ti) {
	      return !savedUrlsSet.has(ti.url);
	    });
	    var closeItemsElem = this.renderTabItems(itemsToClose);
	
	    var itemsToReload = tabWindow.tabItems.filter(function (ti) {
	      return savedUrlsSet.has(ti.url);
	    });
	    var reloadItemsElem = this.renderTabItems(itemsToReload);
	
	    var closeSection = null;
	    if (itemsToClose.count() > 0) {
	      closeSection = React.createElement(
	        'div',
	        null,
	        React.createElement(
	          'p',
	          null,
	          'The following tabs will be closed:'
	        ),
	        React.createElement(
	          'div',
	          { style: _styles2['default'].simpleTabContainer },
	          closeItemsElem
	        ),
	        React.createElement('br', null)
	      );
	    }
	    return React.createElement(
	      Modal.Dialog,
	      { title: 'Revert Saved Window?', onClose: this.props.onClose },
	      React.createElement(
	        Modal.Body,
	        null,
	        React.createElement(
	          'div',
	          { style: _styles2['default'].dialogInfoContents },
	          closeSection,
	          React.createElement(
	            'p',
	            null,
	            'The following tabs will be reloaded:'
	          ),
	          React.createElement(
	            'div',
	            { style: _styles2['default'].simpleTabContainer },
	            reloadItemsElem
	          ),
	          React.createElement('br', null),
	          React.createElement(
	            'p',
	            null,
	            'This action can not be undone.'
	          )
	        ),
	        React.createElement(
	          'div',
	          { style: Util.merge(_styles2['default'].alignRight) },
	          React.createElement(
	            'div',
	            { style: Util.merge(_styles2['default'].dialogButton, _styles2['default'].primaryButton),
	              onClick: this.handleSubmit,
	              ref: 'okButton',
	              tabIndex: 0,
	              onKeyDown: this.handleKeyDown },
	            'OK'
	          ),
	          React.createElement(
	            'div',
	            { style: _styles2['default'].dialogButton,
	              onClick: this.props.onClose,
	              tabIndex: 0
	            },
	            'Cancel'
	          )
	        )
	      )
	    );
	  },
	
	  /* HACK - get focus to the OK button, because tabIndex getting ignored. */
	  componentDidMount: function componentDidMount() {
	    console.log("revertModal: did mount");
	    this.refs.okButton.getDOMNode().focus();
	  }
	});
	
	exports['default'] = RevertModal;
	module.exports = exports['default'];

/***/ },

/***/ 414:
/*!****************************************!*\
  !*** ./src/js/components/SaveModal.js ***!
  \****************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _styles = __webpack_require__(/*! ./styles */ 400);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 402);
	
	var Util = _interopRequireWildcard(_util);
	
	var _constants = __webpack_require__(/*! ./constants */ 401);
	
	var Constants = _interopRequireWildcard(_constants);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _Modal = __webpack_require__(/*! ./Modal */ 412);
	
	var Modal = _interopRequireWildcard(_Modal);
	
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	
	var SaveModal = React.createClass({
	  displayName: 'SaveModal',
	
	  handleKeyDown: function handleKeyDown(e) {
	    if (e.keyCode == Constants.KEY_ESC) {
	      // ESC key
	      e.preventDefault();
	      this.props.onClose(e);
	    }
	  },
	  handleSubmit: function handleSubmit(e) {
	    e.preventDefault();
	    var titleStr = this.refs.titleInput.getDOMNode().value;
	    console.log("handleSubmit: title: ", titleStr);
	    this.props.onSubmit(titleStr);
	  },
	  render: function render() {
	    return React.createElement(
	      Modal.Dialog,
	      { title: 'Save Tabs', focusRef: 'titleInput', onClose: this.props.onClose },
	      React.createElement(
	        Modal.Info,
	        null,
	        React.createElement(
	          'span',
	          null,
	          'Save all tabs in this window'
	        )
	      ),
	      React.createElement(
	        Modal.Body,
	        null,
	        React.createElement(
	          'div',
	          { style: _styles2['default'].centerContents },
	          React.createElement(
	            'form',
	            { className: 'dialog-form', onSubmit: this.handleSubmit },
	            React.createElement(
	              'fieldset',
	              null,
	              React.createElement(
	                'label',
	                { htmlFor: 'title' },
	                'Window Title'
	              ),
	              React.createElement('input', { type: 'text', name: 'title', id: 'title', ref: 'titleInput',
	                autoFocus: true,
	                defaultValue: this.props.initialTitle,
	                onKeyDown: this.handleKeyDown
	              })
	            )
	          )
	        )
	      )
	    );
	  },
	
	  componentDidMount: function componentDidMount() {
	    console.log("SaveModal: did mount");
	    var titleElem = this.refs.titleInput.getDOMNode();
	    /* titleElem.val(this.props.initialTitle); */
	    var titleLen = this.props.initialTitle.length;
	    window.setTimeout(function () {
	      console.log("timer func");
	      titleElem.setSelectionRange(0, titleLen);
	    }, 0);
	  }
	});
	
	exports['default'] = SaveModal;
	module.exports = exports['default'];

/***/ },

/***/ 415:
/*!***************************!*\
  !*** ./src/js/viewRef.js ***!
  \***************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _oneref = __webpack_require__(/*! oneref */ 185);
	
	var OneRef = _interopRequireWildcard(_oneref);
	
	/**
	 * A wrapper around OneRef.Ref that tracks listeners by numeric id
	 * so that we can share a ref between background page and popup
	 * in Chrome extension and clean up when popup goes away
	 *
	 * 
	 */
	
	var ViewRef = (function (_OneRef$Ref) {
	  _inherits(ViewRef, _OneRef$Ref);
	
	  /**
	   * construct a new ViewRef with initial value v
	   */
	
	  function ViewRef(v) {
	    _classCallCheck(this, ViewRef);
	
	    _get(Object.getPrototypeOf(ViewRef.prototype), 'constructor', this).call(this, v);
	    this.viewListeners = [];
	  }
	
	  /*
	   * Add a view listener and return its listener id
	   *
	   * We have our own interface here because we don't have a reliable destructor / close event 
	   * on the chrome extension popup window, and our GC technique requires us to have
	   * numeric id's (rather than object references) that we can encode in a Chrome JSON 
	   * message
	   */
	
	  _createClass(ViewRef, [{
	    key: 'addViewListener',
	    value: function addViewListener(listener) {
	      // check to ensure this listener not yet registered:
	      var idx = this.viewListeners.indexOf(listener);
	      if (idx === -1) {
	        idx = this.viewListeners.length;
	        this.viewListeners.push(listener);
	        this.on("change", listener);
	      }
	      return idx;
	    }
	  }, {
	    key: 'removeViewListener',
	    value: function removeViewListener(id) {
	      // console.log("removeViewListener: removing listener id ", id);
	      var listener = this.viewListeners[id];
	      if (listener) {
	        this.removeListener("change", listener);
	      } else {
	        console.warn("removeViewListener: No listener found for id ", id);
	      }
	      delete this.viewListeners[id];
	    }
	  }]);
	
	  return ViewRef;
	})(OneRef.Ref);
	
	exports['default'] = ViewRef;
	module.exports = exports['default'];

/***/ },

/***/ 416:
/*!**********************************************!*\
  !*** ./src/js/components/SelectablePopup.js ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _styles = __webpack_require__(/*! ./styles */ 400);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 402);
	
	var Util = _interopRequireWildcard(_util);
	
	var _SearchBar = __webpack_require__(/*! ./SearchBar */ 410);
	
	var _SearchBar2 = _interopRequireDefault(_SearchBar);
	
	var _TabWindowList = __webpack_require__(/*! ./TabWindowList */ 411);
	
	var _TabWindowList2 = _interopRequireDefault(_TabWindowList);
	
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	
	function tabCount(searchStr, filteredTabWindow) {
	  var ret = searchStr.length > 0 ? filteredTabWindow.itemMatches.count() : filteredTabWindow.tabWindow.tabItems.count();
	  return ret;
	}
	
	function selectedTab(filteredTabWindow, searchStr, tabIndex) {
	  if (searchStr.length == 0) {
	    var tabWindow = filteredTabWindow.tabWindow;
	    var tabItem = tabWindow.tabItems.get(tabIndex);
	    return tabItem;
	  } else {
	    var filteredItem = filteredTabWindow.itemMatches.get(tabIndex);
	    return filteredItem.tabItem;
	  }
	}
	
	/**
	 * An element that manages the selection.
	 *
	 * We want this as a distinct element from its parent TabMan, because it does local state management
	 * and validation that should happen with respect to the (already calculated) props containing
	 * filtered windows that we receive from above
	 */
	var SelectablePopup = React.createClass({
	  displayName: 'SelectablePopup',
	
	  getInitialState: function getInitialState() {
	    return {
	      selectedWindowIndex: 0,
	      selectedTabIndex: 0
	    };
	  },
	
	  handlePrevSelection: function handlePrevSelection(byPage) {
	    if (this.props.filteredWindows.length === 0) return;
	    var selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex];
	    // const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count();
	
	    if (selectedWindow.tabWindow.open && this.state.selectedTabIndex > 0 && !byPage) {
	      this.setState({ selectedTabIndex: this.state.selectedTabIndex - 1 });
	    } else {
	      // Already on first tab, try to back up to previous window:
	      if (this.state.selectedWindowIndex > 0) {
	        var prevWindowIndex = this.state.selectedWindowIndex - 1;
	        var prevWindow = this.props.filteredWindows[prevWindowIndex];
	        var prevTabCount = this.props.searchStr.length > 0 ? prevWindow.itemMatches.count() : prevWindow.tabWindow.tabItems.count();
	
	        this.setState({ selectedWindowIndex: prevWindowIndex, selectedTabIndex: prevTabCount - 1 });
	      }
	    }
	  },
	
	  handleNextSelection: function handleNextSelection(byPage) {
	    if (this.props.filteredWindows.length === 0) return;
	    var selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex];
	    var tabCount = this.props.searchStr.length > 0 ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count();
	
	    // We'd prefer to use expanded state of window rather then open/closed state,
	    // but that's hidden in the component...
	    if (selectedWindow.tabWindow.open && this.state.selectedTabIndex + 1 < tabCount && !byPage) {
	      this.setState({ selectedTabIndex: this.state.selectedTabIndex + 1 });
	    } else {
	      // Already on last tab, try to advance to next window:
	      if (this.state.selectedWindowIndex + 1 < this.props.filteredWindows.length) {
	        this.setState({ selectedWindowIndex: this.state.selectedWindowIndex + 1, selectedTabIndex: 0 });
	      }
	    }
	  },
	
	  handleSelectionEnter: function handleSelectionEnter() {
	    if (this.props.filteredWindows.length == 0) return;
	
	    // TODO: deal with this.state.selectedTabIndex==-1
	
	    var selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex];
	    var selectedTabItem = selectedTab(selectedWindow, this.props.searchStr, this.state.selectedTabIndex);
	    console.log("opening: ", selectedTabItem.toJS());
	    actions.activateTab(selectedWindow.tabWindow, selectedTabItem, this.state.selectedTabIndex, this.props.storeUpdateHandler);
	  },
	
	  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
	    var selectedWindowIndex = this.state.selectedWindowIndex;
	    var selectedTabIndex = this.state.selectedTabIndex;
	    var nextFilteredWindows = nextProps.filteredWindows;
	
	    if (selectedWindowIndex >= nextFilteredWindows.length) {
	      if (nextFilteredWindows.length == 0) {
	        this.setState({ selectedWindowIndex: 0, selectedTabIndex: -1 });
	        console.log("resetting indices");
	      } else {
	        var lastWindow = nextFilteredWindows[nextFilteredWindows.length - 1];
	        this.setState({ selectedWindowIndex: nextFilteredWindows.length - 1, selectedTabIndex: tabCount(this.props.searchStr, lastWindow) - 1 });
	      }
	    } else {
	      var nextSelectedWindow = nextFilteredWindows[selectedWindowIndex];
	      var nextTabIndex = Math.min(this.state.selectedTabIndex, tabCount(this.props.searchStr, nextSelectedWindow) - 1);
	      this.setState({ selectedTabIndex: nextTabIndex });
	    }
	  },
	
	  render: function render() {
	    var winStore = this.props.winStore;
	    var openTabCount = winStore.countOpenTabs();
	    var openWinCount = winStore.countOpenWindows();
	    var savedCount = winStore.countSavedWindows();
	
	    // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
	    var summarySentence = "Tabs: " + openTabCount + " Open. Windows: " + openWinCount + " Open, " + savedCount + " Saved.";
	
	    return React.createElement(
	      'div',
	      null,
	      React.createElement(
	        'div',
	        { style: _styles2['default'].popupHeader },
	        React.createElement(_SearchBar2['default'], { onSearchInput: this.props.onSearchInput,
	          onSearchUp: this.handlePrevSelection,
	          onSearchDown: this.handleNextSelection,
	          onSearchEnter: this.handleSelectionEnter
	        })
	      ),
	      React.createElement(
	        'div',
	        { style: _styles2['default'].popupBody },
	        React.createElement(_TabWindowList2['default'], { winStore: this.props.winStore,
	          storeUpdateHandler: this.props.storeUpdateHandler,
	          filteredWindows: this.props.filteredWindows,
	          appComponent: this.props.appComponent,
	          searchStr: this.props.searchStr,
	          searchRE: this.props.searchRE,
	          selectedWindowIndex: this.state.selectedWindowIndex,
	          selectedTabIndex: this.state.selectedTabIndex
	        })
	      ),
	      React.createElement(
	        'div',
	        { style: _styles2['default'].popupFooter },
	        React.createElement(
	          'span',
	          { style: Util.merge(_styles2['default'].closed, _styles2['default'].summarySpan) },
	          summarySentence
	        )
	      )
	    );
	  }
	});
	
	exports['default'] = SelectablePopup;
	module.exports = exports['default'];

/***/ },

/***/ 417:
/*!*****************************************!*\
  !*** ./src/js/components/TabliPopup.js ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _styles = __webpack_require__(/*! ./styles */ 400);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 402);
	
	var Util = _interopRequireWildcard(_util);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _searchOps = __webpack_require__(/*! ../searchOps */ 184);
	
	var searchOps = _interopRequireWildcard(_searchOps);
	
	var _oneref = __webpack_require__(/*! oneref */ 185);
	
	var _tabWindow = __webpack_require__(/*! ../tabWindow */ 5);
	
	var TabWindow = _interopRequireWildcard(_tabWindow);
	
	__webpack_require__(/*! babel/polyfill */ 217);
	
	var _Modal = __webpack_require__(/*! ./Modal */ 412);
	
	var Modal = _interopRequireWildcard(_Modal);
	
	var _RevertModal = __webpack_require__(/*! ./RevertModal */ 413);
	
	var _RevertModal2 = _interopRequireDefault(_RevertModal);
	
	var _SaveModal = __webpack_require__(/*! ./SaveModal */ 414);
	
	var _SaveModal2 = _interopRequireDefault(_SaveModal);
	
	var _SelectablePopup = __webpack_require__(/*! ./SelectablePopup */ 416);
	
	var _SelectablePopup2 = _interopRequireDefault(_SelectablePopup);
	
	/*
	 * sort criteria for window list:
	 *   open windows first, then alpha by title
	 */
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	function windowCmpFn(tabWindowA, tabWindowB) {
	  // focused window very first:
	  var fA = tabWindowA.focused;
	  var fB = tabWindowB.focused;
	  if (fA != fB) {
	    if (fA) return -1;else return 1;
	  }
	
	  // open windows first:
	  if (tabWindowA.open != tabWindowB.open) {
	    if (tabWindowA.open) return -1;else return 1;
	  }
	  var tA = tabWindowA.title;
	  var tB = tabWindowB.title;
	  return tA.localeCompare(tB);
	}
	
	var TabliPopup = React.createClass({
	  displayName: 'TabliPopup',
	
	  storeAsState: function storeAsState(winStore) {
	    var tabWindows = winStore.getAll();
	
	    var sortedWindows = tabWindows.sort(windowCmpFn);
	
	    return {
	      winStore: winStore,
	      sortedWindows: sortedWindows
	    };
	  },
	
	  getInitialState: function getInitialState() {
	    var st = this.storeAsState(this.props.initialWinStore);
	
	    var w0 = st.sortedWindows[0];
	
	    st.saveModalIsOpen = false;
	    st.revertModalIsOpen = false;
	    st.revertTabWindow = null;
	    st.searchStr = '';
	    st.searchRE = null;
	    return st;
	  },
	
	  handleSearchInput: function handleSearchInput(searchStr) {
	    searchStr = searchStr.trim();
	
	    var searchRE = null;
	    if (searchStr.length > 0) {
	      searchRE = new RegExp(searchStr, "i");
	    }
	    console.log("search input: '" + searchStr + "'");
	    this.setState({ searchStr: searchStr, searchRE: searchRE });
	  },
	
	  openSaveModal: function openSaveModal(tabWindow) {
	    var initialTitle = tabWindow.title;
	    this.setState({ saveModalIsOpen: true, saveInitialTitle: initialTitle, saveTabWindow: tabWindow });
	  },
	
	  closeSaveModal: function closeSaveModal() {
	    this.setState({ saveModalIsOpen: false });
	  },
	
	  openRevertModal: function openRevertModal(filteredTabWindow) {
	    this.setState({ revertModalIsOpen: true, revertTabWindow: filteredTabWindow.tabWindow });
	  },
	
	  closeRevertModal: function closeRevertModal() {
	    this.setState({ revertModalIsOpen: false, revertTabWindow: null });
	  },
	
	  /* handler for save modal */
	  doSave: function doSave(titleStr) {
	    var storeRef = this.props.storeRef;
	    var tabliFolderId = storeRef.getValue().folderId;
	    actions.manageWindow(tabliFolderId, this.state.saveTabWindow, titleStr, (0, _oneref.refUpdater)(storeRef));
	    this.closeSaveModal();
	  },
	
	  doRevert: function doRevert(tabWindow) {
	    var updateHandler = (0, _oneref.refUpdater)(this.props.storeRef);
	    actions.revertWindow(this.state.revertTabWindow, updateHandler);
	    this.closeRevertModal();
	  },
	
	  /* render save modal (or not) based on this.state.saveModalIsOpen */
	  renderSaveModal: function renderSaveModal() {
	    var modal = null;
	    if (this.state.saveModalIsOpen) {
	      modal = React.createElement(_SaveModal2['default'], { initialTitle: this.state.saveInitialTitle,
	        tabWindow: this.state.saveTabWindow,
	        onClose: this.closeSaveModal,
	        onSubmit: this.doSave,
	        appComponent: this
	      });
	    }
	    return modal;
	  },
	
	  /* render revert modal (or not) based on this.state.revertModalIsOpen */
	  renderRevertModal: function renderRevertModal() {
	    var modal = null;
	    if (this.state.revertModalIsOpen) {
	      modal = React.createElement(_RevertModal2['default'], {
	        tabWindow: this.state.revertTabWindow,
	        onClose: this.closeRevertModal,
	        onSubmit: this.doRevert,
	        appComponent: this
	      });
	    }
	    return modal;
	  },
	
	  render: function render() {
	    try {
	      var saveModal = this.renderSaveModal();
	      var revertModal = this.renderRevertModal();
	      var filteredWindows = searchOps.filterTabWindows(this.state.sortedWindows, this.state.searchRE);
	      var ret = React.createElement(
	        'div',
	        null,
	        React.createElement(_SelectablePopup2['default'], {
	          onSearchInput: this.handleSearchInput,
	          winStore: this.state.winStore,
	          storeUpdateHandler: (0, _oneref.refUpdater)(this.props.storeRef),
	          filteredWindows: filteredWindows,
	          appComponent: this,
	          searchStr: this.state.searchStr,
	          searchRE: this.state.searchRE
	        }),
	        saveModal,
	        revertModal
	      );
	    } catch (e) {
	      console.error("App Component: caught exception during render: ");
	      console.error(e.stack);
	      throw e;
	    }
	    return ret;
	  },
	
	  componentWillMount: function componentWillMount() {
	    var _this = this;
	
	    if (this.props.noListener) return;
	
	    var storeRef = this.props.storeRef;
	    /*
	     * This listener is essential for triggering a (recursive) re-render
	     * in response to a state change.
	     */
	    var listenerId = storeRef.addViewListener(function () {
	      console.log("TabliPopup: viewListener: updating store from storeRef");
	      _this.setState(_this.storeAsState(storeRef.getValue()));
	    });
	    // console.log("componentWillMount: added view listener: ", listenerId);
	    sendHelperMessage({ listenerId: listenerId });
	  }
	});
	
	/**
	 * send message to BGhelper
	 */
	function sendHelperMessage(msg) {
	  var port = chrome.runtime.connect({ name: "popup" });
	  port.postMessage(msg);
	  port.onMessage.addListener(function (msg) {
	    console.log("Got response message: ", msg);
	  });
	}
	
	exports['default'] = TabliPopup;
	module.exports = exports['default'];

/***/ }

});
//# sourceMappingURL=bgHelper.bundle.js.map