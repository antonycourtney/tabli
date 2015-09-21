webpackJsonp([0],[
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
	
	var _tabWindow = __webpack_require__(/*! ./tabWindow */ 5);
	
	var TabWindow = _interopRequireWildcard(_tabWindow);
	
	var _actions = __webpack_require__(/*! ./actions */ 7);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _react = __webpack_require__(/*! react */ 9);
	
	var React = _interopRequireWildcard(_react);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 165);
	
	var popupPort = null;
	var tabmanFolderTitle = "Subjective Tab Manager";
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
	  winStore.registerTabWindows(folderTabWindows);
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
	          var winStore = new _tabWindowStore2['default'](tabmanFolderId, archiveFolderId);
	          loadManagedWindows(winStore, subTreeNodes[0]);
	          cb(winStore);
	        });
	      });
	    });
	  });
	}
	
	function setupConnectionListener(winStore) {
	  chrome.runtime.onConnect.addListener(function (port) {
	    port.onMessage.addListener(function (msg) {
	      var listenerId = msg.listenerId;
	      port.onDisconnect.addListener(function () {
	        winStore.removeViewListener(listenerId);
	      });
	    });
	  });
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
	
	  var dumpStr = JSON.stringify(dumpObj, null, 2);
	
	  var winBlob = new Blob([dumpStr], { type: "application/json" });
	  var url = URL.createObjectURL(winBlob);
	  chrome.downloads.download({ url: url, filename: 'winSnap.json' });
	}
	
	function main() {
	  initWinStore(function (winStore) {
	    console.log("init: done reading bookmarks.");
	    window.winStore = winStore;
	    actions.syncChromeWindows(winStore, function () {
	      console.log("initial sync of chrome windows complete.");
	      // dumpAll(winStore);
	    });
	    setupConnectionListener(winStore);
	  });
	}
	
	main();

/***/ }
]);
//# sourceMappingURL=bgHelper.bundle.js.map