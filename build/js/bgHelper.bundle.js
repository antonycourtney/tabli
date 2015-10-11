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
	
	var _tabWindowStore = __webpack_require__(/*! ./tabWindowStore */ 1);
	
	var _tabWindowStore2 = _interopRequireDefault(_tabWindowStore);
	
	var _tabWindow = __webpack_require__(/*! ./tabWindow */ 5);
	
	var TabWindow = _interopRequireWildcard(_tabWindow);
	
	var _actions = __webpack_require__(/*! ./actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _components = __webpack_require__(/*! ./components */ 182);
	
	var Components = _interopRequireWildcard(_components);
	
	var _viewRef = __webpack_require__(/*! ./viewRef */ 400);
	
	var _viewRef2 = _interopRequireDefault(_viewRef);
	
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
	        console.log("found target child folder: ", childFolderName);
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
	    console.log("otherBookmarksNode: ", otherBookmarksNode);
	    ensureChildFolder(otherBookmarksNode, tabmanFolderTitle, function (tabManFolder) {
	      console.log("tab manager folder acquired.");
	      tabmanFolderId = tabManFolder.id;
	      ensureChildFolder(tabManFolder, archiveFolderTitle, function (archiveFolder) {
	        console.log("archive folder acquired.");
	        archiveFolderId = archiveFolder.id;
	        chrome.bookmarks.getSubTree(tabManFolder.id, function (subTreeNodes) {
	          console.log("bookmarks.getSubTree for TabManFolder: ", subTreeNodes);
	          var baseWinStore = new _tabWindowStore2['default']({ folderId: tabmanFolderId, archiveFolderId: archiveFolderId });
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
	    var renderAppElement = React.createElement(Components.TabMan, { storeRef: null, initialWinStore: winStore, noListener: true });
	    var renderedString = React.renderToString(renderAppElement);
	    // console.log("renderAndSave: updated saved store and HTML");
	    window.savedStore = winStore;
	    window.savedHTML = renderedString;
	  }
	  return renderAndSave;
	}
	
	function main() {
	  initWinStore(function (bmStore) {
	    console.log("init: done reading bookmarks: ", bmStore);
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

/***/ 400:
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

/***/ }

});
//# sourceMappingURL=bgHelper.bundle.js.map