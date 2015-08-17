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
	
	var TabWindowStore = __webpack_require__(/*! ./tabWindowStore.js */ 1);
	var TabWindow = __webpack_require__(/*! ./tabWindow.js */ 2);
	
	var actions = __webpack_require__(/*! ./actions */ 3);
	
	var popupPort = null;
	var tabmanFolderId = null;
	var tabmanFolderTitle = "Subjective Tab Manager";
	
	var archiveFolderId = null;
	var archiveFolderTitle = "_Archive";
	
	/*
	 * begin managing the specified tab window
	 */
	function manageWindow( tabWindow, opts ) {
	  // and write out a Bookmarks folder for this newly managed window:
	  if( !tabmanFolderId ) {
	    alert( "Could not save bookmarks -- no tab manager folder" );
	  }
	  var windowFolder = { parentId: tabmanFolderId,
	                       title: opts.title,
	                     };
	  chrome.bookmarks.create( windowFolder, function( windowFolderNode ) {
	    console.log( "succesfully created bookmarks folder ", windowFolderNode );
	    console.log( "for window: ", tabWindow );
	    var tabs = TabWindow.chromeWindow.tabs;
	    for( var i = 0; i < tabs.length; i++ ) {
	      var tab = tabs[ i ];
	      // bookmark for this tab:
	      var tabMark = { parentId: windowFolderNode.id, title: tab.title, url: tab.url };
	      chrome.bookmarks.create( tabMark, function( tabNode ) {
	        console.log( "succesfully bookmarked tab ", tabNode );
	      });
	    }
	    // Now do an explicit get of subtree to get node populated with children
	    chrome.bookmarks.getSubTree( windowFolderNode.id, function ( folderNodes ) {
	      var fullFolderNode = folderNodes[ 0 ];
	      TabWindow.bookmarkFolder = fullFolderNode;
	
	      // Note: Only now do we actually change the state to managed!
	      // This is to avoid a nasty race condition where the bookmarkFolder would be undefined
	      // or have no children because of the asynchrony of creating bookmarks.
	      // There might still be a race condition here since
	      // the bookmarks for children may not have been created yet.
	      // Haven't seen evidence of this so far.
	      TabWindow._managed = true;
	      TabWindow._managedTitle = opts.title;
	    } );
	  } );
	}
	
	/* stop managing the specified window...move all bookmarks for this managed window to Recycle Bin */
	function unmanageWindow( tabWindow ) {
	  TabWindow._managed = false;
	
	  if( !archiveFolderId ) {
	    alert( "could not move managed window folder to archive -- no archive folder" );
	    return;
	  }
	  chrome.bookmarks.move( TabWindow.bookmarkFolder.id, { parentId: archiveFolderId } );
	  TabWindow.bookmarkFolder = null;  // disconnect from this bookmark folder
	}
	
	/* On startup load managed windows from bookmarks folder */
	function loadManagedWindows(flux,tabManFolder ) {
	  var folderTabWindows = [];
	  for( var i = 0; i < tabManFolder.children.length; i++ ) {
	    var windowFolder = tabManFolder.children[ i ];
	    if( windowFolder.title[0] === "_" ) {
	      continue;
	    }
	    var fc = windowFolder.children;
	    if ( !fc ) {
	      console.log( "Found bookmarks folder with no children, skipping: ", fc );
	      continue;
	    }
	    folderTabWindows.push(TabWindow.makeFolderTabWindow(windowFolder));
	  }
	  flux.actions.addTabWindows(folderTabWindows);
	}
	
	/*
	 * given a specific parent Folder node, ensure a particular child exists.
	 * Will invoke callback either synchronously or asynchronously passing the node
	 * for the named child
	 */
	function ensureChildFolder( parentNode, childFolderName, callback ) {
	  for ( var i = 0; i < parentNode.children.length; i++ ) {
	    var childFolder = parentNode.children[ i ];
	    if( childFolder.title.toLowerCase() === childFolderName.toLowerCase() ) {
	      // exists
	      console.log( "found target child folder: ", childFolderName );
	      callback( childFolder );
	      return true;
	    }
	  }
	  console.log( "Child folder ", childFolderName, " Not found, creating..." );
	  // If we got here, child Folder doesn't exist
	  var folderObj = { parentId: parentNode.id, title: childFolderName };
	  chrome.bookmarks.create( folderObj, callback );
	}
	
	function initBookmarks(flux,cb) {
	  chrome.bookmarks.getTree(function(tree){
	    var otherBookmarksNode = tree[0].children[1]; 
	    console.log( "otherBookmarksNode: ", otherBookmarksNode );
	    ensureChildFolder( otherBookmarksNode, tabmanFolderTitle, function( tabManFolder ) {
	      console.log( "tab manager folder acquired." );
	      tabmanFolderId = tabManFolder.id;
	      ensureChildFolder( tabManFolder, archiveFolderTitle, function( archiveFolder ) {
	        console.log( "archive folder acquired." );
	        archiveFolderId = archiveFolder.id;
	        chrome.bookmarks.getSubTree(tabManFolder.id,function (subTreeNodes) {
	          console.log("bookmarks.getSubTree for TabManFolder: ", subTreeNodes);
	          loadManagedWindows(flux,subTreeNodes[0]);
	          cb();
	        });
	      })
	    });
	  });
	}
	
	function main() {
	  var fluxState = TabWindowStore.init(actions);
	
	  window.fluxState = fluxState;
	  initBookmarks(fluxState.flux,function () {
	    console.log("init: done reading bookmarks.");
	    fluxState.flux.actions.syncWindowList();
	  });
	}
	
	main();

/***/ },
/* 1 */
/*!**********************************!*\
  !*** ./src/js/tabWindowStore.js ***!
  \**********************************/
/***/ function(module, exports, __webpack_require__) {

	/*
	 * A Flux store for TabWindows
	 */
	'use strict';
	var Fluxxor = __webpack_require__(/*! fluxxor */ 5);
	var _ = __webpack_require__(/*! underscore */ 8);
	var constants = __webpack_require__(/*! ./constants.js */ 9);
	var TabWindow = __webpack_require__(/*! ./tabWindow.js */ 2);
	
	var TabWindowStore = Fluxxor.createStore({
	  initialize: function() {
	    this.resetState();
	    this.bindActions(
	      constants.ADD_TAB_WINDOWS, this.onAddTabWindows,
	      constants.CLOSE_TAB_WINDOW, this.onCloseTabWindow,
	      constants.REMOVE_TAB_WINDOW, this.onRemoveTabWindow,
	      constants.ATTACH_CHROME_WINDOW, this.onAttachChromeWindow,
	      constants.REVERT_TAB_WINDOW, this.onRevertTabWindow,
	      constants.SYNC_WINDOW_LIST, this.onSyncWindowList,
	      constants.REPLACE_WINDOW_STATE, this.onReplaceWindowState
	      );
	  },
	
	  resetState: function() {
	    this.windowIdMap = {};
	    this.bookmarkIdMap = {};
	    this.tabWindows = [];
	  },
	
	  /*
	   * add a new Tab window to global maps:
	   */
	  addTabWindow: function(tabWindow) {
	    var chromeWindow = tabWindow.chromeWindow;
	    if (chromeWindow) {
	      this.windowIdMap[ chromeWindow.id ] = tabWindow;
	    }
	    var bookmarkFolder = tabWindow.bookmarkFolder;
	    if (bookmarkFolder) {
	        this.bookmarkIdMap[bookmarkFolder.id] = tabWindow;
	    }
	    this.tabWindows.push( tabWindow );     
	  },
	
	  clearMapEntry: function(tabWindow) {
	    console.log("clearMapEntry: ", tabWindow);
	    var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
	    if (windowId) 
	      delete this.windowIdMap[ windowId ];
	    var bookmarkId = tabWindow.bookmarkFolder && tabWindow.bookmarkFolder.id;
	    if (bookmarkId)
	      delete this.bookmarkIdMap[ bookmarkId ];
	  },
	
	  removeTabWindow: function(tabWindow) {
	    console.log("removeTabWindow: ", tabWindow);
	    // could keep an inverse map instead of doing a linear search...
	    for (var i = 0; i < this.tabWindows.length; i++) {
	      if (this.tabWindows[i]===tabWindow)
	        break;
	    }
	    if (i < this.tabWindows.length) {
	      delete this.tabWindows[ i ];
	    } else {
	      console.log("removeTabWindow: request to remove window not in collection", tabWindow);
	    }
	    this.clearMapEntry(tabWindow);
	  },
	
	  closeTabWindow: function(tabWindow, cb) {
	    console.log("store closeTabWindow: ", tabWindow);
	    if (!tabWindow.isManaged()) {
	      console.log("unmanaged window -- removing");
	      this.removeTabWindow(tabWindow);
	    } else {
	      this.clearMapEntry(tabWindow);
	    }
	    cb();      
	  },
	
	  revertTabWindow: function( tabWindow, callback ) {
	    var tabs = tabWindow.chromeWindow.tabs;
	    var currentTabIds = tabs.map( function ( t ) { return t.id; } );
	
	    // re-open bookmarks:
	    var urls = tabWindow.bookmarkFolder.children.map( function (bm) { return bm.url; } );
	    for ( var i = 0; i < urls.length; i++ ) {
	      // need to open it:
	      var tabInfo = { windowId: tabWindow.chromeWindow.id, url: urls[ i ] };
	      chrome.tabs.create( tabInfo );
	    };        
	
	    // blow away all the existing tabs:
	    chrome.tabs.remove( currentTabIds, function() {
	      var windowId = tabWindow.chromeWindow.id;
	      tabWindow.chromeWindow = null;
	      // refresh window details:
	      chrome.windows.get( windowId, { populate: true }, function ( chromeWindow ) {
	        tabWindow.chromeWindow = chromeWindow;
	        callback();
	      });
	    });
	  },
	
	  attachChromeWindow: function(tabWindow,chromeWindow) {
	    tabWindow.chromeWindow = chromeWindow;
	    tabWindow.open = true;
	    this.windowIdMap[ chromeWindow.id ] = tabWindow;
	  },
	
	  /**
	   * Synchronize internal state of our store with snapshot
	   * of current Chrome window state
	   */
	  syncChromeWindow: function(chromeWindow) {
	    var tabWindow = this.windowIdMap[chromeWindow.id];
	    if( !tabWindow ) {
	      // console.log( "syncWindowList: new window id: ", chromeWindow.id );
	      tabWindow = TabWindow.makeChromeTabWindow( chromeWindow );
	      this.addTabWindow(tabWindow);
	    } else {
	      // console.log( "syncWindowList: cache hit for id: ", chromeWindow.id );
	      // Set chromeWindow to current snapshot of tab contents:
	      tabWindow.chromeWindow = chromeWindow;
	      tabWindow.open = true;
	    }
	  },
	
	  /**
	   * synchronize windows from chrome.windows.getAll with internal map of
	   * managed and unmanaged tab windows
	   */
	  syncWindowList: function( chromeWindowList, focusedWindow ) {
	    // To GC any closed windows:
	    for ( var i = 0; i < this.tabWindows.length; i++ ) {
	      var tabWindow = this.tabWindows[ i ];
	      if( tabWindow ) {
	        tabWindow.open = false;
	        tabWindow._focused = false;
	      }
	    }
	    for ( var i = 0; i < chromeWindowList.length; i++ ) {
	      var chromeWindow = chromeWindowList[ i ];
	      this.syncChromeWindow(chromeWindow);
	    }
	    // GC any closed, unmanaged windows:
	    for ( var i = 0; i < this.tabWindows.length; i++ ) {
	      tabWindow = this.tabWindows[ i ];
	      if( tabWindow && !( tabWindow._managed ) && !( tabWindow.open ) ) {
	        console.log( "syncWindowList: detected closed window: ", tabWindow );
	        this.removeTabWindow(tabWindow);
	      }
	    }
	    // mark current window:
	    var currentTabWindow = this.windowIdMap[focusedWindow.id];
	    if (currentTabWindow) {
	      currentTabWindow._focused = true;
	    } else {
	      console.warn("syncWindowList: last focused window id ", focusedWindow.id, " not found -- ignoring");
	    }
	    console.log("syncWindowList: complete");
	    this.flux.emit("sync");
	  },   
	
	  onCloseTab: function(payload) {
	    var self = this;
	    console.log("onCloseTab: closing tab...");
	    this.closeTab(payload.tab,function() {
	      console.log("onCloseTab: close complete...");
	      self.flux.emit("change");
	    });
	  },
	
	  onAddTabWindows: function(payload) {
	    _.each(payload.tabWindows, this.addTabWindow);
	    this.flux.emit("change");
	  },
	
	  onReplaceWindowState: function(payload) {
	    // clear all state and then add tab windows from payload
	    this.resetState();
	    this.onAddTabWindows(payload);
	  },
	
	  onCloseTabWindow: function(payload) {
	    var self = this;
	    this.closeTabWindow(payload.tabWindow, function () {
	        self.flux.emit("change");      
	      });
	  },
	
	  onRevertTabWindow: function(payload) {
	    var self = this;
	    this.revertTabWindow(payload.tabWindow, function () {
	        self.flux.emit("change");      
	      });
	  },
	
	  onRemoveTabWindow: function(payload) {
	    this.removeTabWindow(payload.tabWindow);
	    this.flux.emit("change");
	  },
	
	  onAttachChromeWindow: function(payload) {
	    this.attachChromeWindow(payload.tabWindow,payload.chromeWindow);
	    this.flux.emit("change");
	  },
	
	  onSyncWindowList: function(payload) {
	    console.log("onSyncWindowList: ", payload);
	    this.syncWindowList(payload.windowList,payload.focusedWindow);
	    this.flux.emit("change");
	  },
	
	  getAll: function() {
	    // console.log("Flux store - this.tabWindows.getAll: ", this.tabWindows);
	    return this.tabWindows.slice();
	  },
	
	  serializeAll: function() {
	    return this.getAll();
	  },
	
	  // returns a tabWindow or undefined
	  getTabWindowByChromeId: function(chromeId) {
	    return this.windowIdMap[chromeId];
	  },
	
	  getTabWindowByBookmarkId: function(bookmarkId) {
	    return this.bookmarkIdMap[bookmarkId];
	  }
	});
	
	/*
	 * initialize Flux state and empty window store and return it
	 */
	function init(actions) {
	  var stores = {
	    TabWindowStore: new TabWindowStore()
	  };
	
	  var flux = new Fluxxor.Flux(stores, actions);
	  var winStore = stores.TabWindowStore;
	/*
	  flux.on("dispatch", function(type, payload) {
	      if (console && console.log) {
	          console.log("[Dispatch]", type, payload);
	      }
	  });
	*/
	  return {
	    flux: flux,
	    winStore: winStore
	  };
	}
	
	module.exports.init = init;

/***/ },
/* 2 */
/*!*****************************!*\
  !*** ./src/js/tabWindow.js ***!
  \*****************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Representations of windows and bookmark folders
	 */
	'use strict';
	
	function makeBookmarkedTabItem( bm ) {
	  var ret = Object.create( bm );
	  ret.bookmarked = true;
	  ret.open = false;
	  ret.bookmark = bm;
	  return ret;
	};
	
	function makeOpenTabItem(ot) {
	  var ret = Object.create( ot );
	  ret.bookmarked = false;
	  ret.open = true;
	  return ret;
	};
	
	/*
	 * Gather open tabs and a set of non-opened bookmarks from the given bookmarks 
	 * list for a managed window that is open
	 */
	function getManagedOpenTabInfo(openTabs,bookmarks) {
	  var urlMap = {};
	  var tabs = openTabs.map( function ( ot ) { 
	    var item = makeOpenTabItem( ot); 
	    urlMap[ ot.url ] = item;
	    return item;
	  } );
	  var closedBookmarks = [];
	  for ( var i = 0; i < bookmarks.length; i++ ) {
	    var bm = bookmarks[ i ];
	    var obm = urlMap[ bm.url ];
	    if ( obm ) {
	      obm.bookmarked = true;
	      obm.bookmark = bm;
	    } else {
	      closedBookmarks.push( makeBookmarkedTabItem( bm ) );
	    }
	  }
	  return { openTabs: tabs, closedBookmarks: closedBookmarks };
	}
	
	/*
	 * For a managed, open window, return a list of tab items
	 * representing both open tabs and closed bookmarks, making
	 * best effort to preserve a sensible order
	 */
	function getManagedOpenTabs(chromeWindow,bookmarkFolder) {
	  var tabInfo = getManagedOpenTabInfo( chromeWindow.tabs, bookmarkFolder.children );
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
	
	  while ( openTabs.length > 0 && bookmarks.length > 0) {
	    var tab = openTabs.shift();
	    var bm = bookmarks.shift();
	    if ( tab.bookmarked && bm.url === tab.url) {
	      outTabs.push( tab );
	      tab = null;
	      bm = null;
	    } else {
	      break;
	    }
	  }
	  // we hit a non-matching tab, now inject closed bookmarks:
	  outTabs = outTabs.concat( tabInfo.closedBookmarks );
	  if (tab) {
	    outTabs.push(tab);
	  }
	  // and inject the remaining tabs:
	  outTabs = outTabs.concat( openTabs );
	
	  return outTabs;
	}
	
	var tabWindowPrototype = { 
	  _managed: false, 
	  _managedTitle: "",
	  chromeWindow: null,
	  bookmarkFolder: null,  
	  open: false,
	  _focused: false,
	
	  reloadBookmarkFolder: function() {
	    var tabWindow = this;
	    chrome.bookmarks.getSubTree( this.bookmarkFolder.id, function ( folderNodes ) {
	      var fullFolderNode = folderNodes[ 0 ];
	      tabWindow.bookmarkFolder = fullFolderNode;
	    } );
	  },
	
	  getTitle:  function() {
	    if( this._managed ) {
	      return this.bookmarkFolder.title;
	    } else {
	      var tabs = this.chromeWindow.tabs;
	      // linear search to find active tab to use as window title
	      for ( var j = 0; j < tabs.length; j++ ) {
	        var tab = tabs[j];
	        if ( tab.active ) {
	          return tab.title;
	        }
	      }
	    }
	    return "";  // shouldn't happen
	  },
	
	  isManaged: function() {
	    return this._managed;
	  },
	
	  isFocused: function() {
	    return this._focused;
	  },
	
	  // Get a set of tab-like items for rendering
	  getTabItems: function() {
	    var tabs;
	
	    if( this.isManaged() ) {
	      if( this.open ) {
	        tabs = getManagedOpenTabs(this.chromeWindow,this.bookmarkFolder);
	      } else {
	        tabs = this.bookmarkFolder.children.map( makeBookmarkedTabItem );
	      }
	    } else {
	      tabs = this.chromeWindow.tabs.map( makeOpenTabItem );
	    }
	
	    return tabs;
	  },
	
	  /*
	   * return bookmark Id or chrome Id dependending on tabWindow type
	   */
	  getEncodedId: function() {
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
	function makeChromeTabWindow( chromeWindow ) {
	  var ret = Object.create( tabWindowPrototype );
	  ret.chromeWindow = chromeWindow;
	  ret.open = true;
	  return ret;
	}
	
	/*
	 * initialize an unopened window from a bookmarks folder
	 */
	function makeFolderTabWindow( bookmarkFolder ) {
	  var ret = Object.create( tabWindowPrototype );
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
	
	module.exports = {
	  makeChromeTabWindow: makeChromeTabWindow,
	  makeFolderTabWindow: makeFolderTabWindow,
	  deserialize: deserialize
	};

/***/ },
/* 3 */
/*!***************************!*\
  !*** ./src/js/actions.js ***!
  \***************************/
/***/ function(module, exports, __webpack_require__) {

	/*
	 * actions that can be sent to Flux store
	 */
	'use strict';
	
	var constants = __webpack_require__(/*! ./constants.js */ 9);
	
	var actions = {
	  addTabWindows: function(tabWindows) {
	    var payload = { tabWindows: tabWindows };
	    this.dispatch(constants.ADD_TAB_WINDOWS, payload);
	  },
	
	
	  closeTabWindow: function(tabWindow) {
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
	    chrome.windows.remove( windowId, function() {
	      tabWindow.open = false;
	      var payload = { tabWindow: tabWindow };
	      self.dispatch(constants.CLOSE_TAB_WINDOW, payload);
	    });
	  },
	
	  revertTabWindow: function(tabWindow) {
	    var payload = { tabWindow: tabWindow };
	    this.dispatch(constants.REVERT_TAB_WINDOW, payload);
	  },
	
	  removeTabWindow: function(tabWindow) {
	    var payload = { tabWindow: tabWindow };
	    this.dispatch(constants.REMOVE_TAB_WINDOW, payload);
	  },
	
	
	  restoreBookmarkWindow: function(tabWindow) {
	    var self = this;
	    function resyncCallback() {
	      self.flux.actions.syncWindowList();
	    }    
	    chrome.windows.getLastFocused( {populate: true }, function (currentChromeWindow) {
	      var urls = [];
	      var tabs = tabWindow.getTabItems();
	      var urls = tabs.map( function (item) { return item.url; } );
	      function cf( chromeWindow ) {
	        console.log("restoreBookmarkWindow: cf");
	        self.flux.actions.attachChromeWindow(tabWindow,chromeWindow);
	      }
	      console.log( "current chrome window: ", currentChromeWindow );
	      if ((currentChromeWindow.tabs.length===1) &&
	          (currentChromeWindow.tabs[0].url==="chrome://newtab/")) {
	        console.log("found new window -- replacing contents");
	        var origTabId = currentChromeWindow.tabs[0].id;
	        // new window -- replace contents with urls:
	        for ( var i = 0; i < urls.length; i++ ) {
	          // First use our existing tab:
	          if (i==0) {
	            chrome.tabs.update( origTabId, { url: urls[i] } );
	          } else {
	            var tabInfo = { windowId: currentChromeWindow.id, url: urls[ i ] };
	            chrome.tabs.create( tabInfo );
	          }
	        }
	      } else {
	        // normal case -- create a new window for these urls:
	        chrome.windows.create( { url: urls, focused: true, type: 'normal'}, cf );
	      }
	    });
	  },
	
	  openTabWindow: function(tabWindow) {
	    var self = this;
	    function resyncCallback() {
	      self.flux.actions.syncWindowList();
	    }
	
	    var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
	    if (tabWindow.open) {
	      // existing window -- just transfer focus
	      chrome.windows.update( windowId, { focused: true }, resyncCallback );
	    } else {
	      // bookmarked window -- need to open it!
	      self.flux.actions.restoreBookmarkWindow(tabWindow);      
	    }    
	  },
	
	  // associate a Chrome window with a given tabWindow:
	  attachChromeWindow: function(tabWindow,chromeWindow) {
	    var payload = { tabWindow: tabWindow, chromeWindow: chromeWindow };
	    this.dispatch(constants.ATTACH_CHROME_WINDOW, payload);
	  },
	
	  // activate a specific tab:
	  activateTab: function(tabWindow,tab,tabIndex) {
	    var self = this;
	    function resyncCallback() {
	      self.flux.actions.syncWindowList();
	    }
	
	    console.log("activateTab: ", tabWindow, tab );
	    if( tabWindow.open ) {
	      // OK, so we know this window is open.  What about the specific tab?
	      if (tab.open) { 
	        // Tab is already open, just make it active:
	        console.log("making tab active");
	        chrome.tabs.update( tab.id, { active: true }, function () {
	          console.log("making tab's window active");
	          chrome.windows.update( tabWindow.chromeWindow.id, { focused: true }, resyncCallback);
	        });
	      } else {
	        // restore this bookmarked tab:
	        var createOpts = {
	          windowId: tabWindow.chromeWindow.id, 
	          url: tab.url,
	          index: tabIndex,
	          active: true
	        };
	        console.log("restoring bookmarked tab")
	        chrome.tabs.create( createOpts, callback );
	      }
	    } else {
	      console.log("activateTab: opening non-open window");
	      self.flux.actions.openTabWindow(tabWindow);
	      // TODO: activate chosen tab after opening window!
	    }        
	  },
	
	  closeTab: function(tab) {
	    console.log("closeTab: closing ", tab, this);
	    var self = this;
	    chrome.tabs.remove( tab.id, function() {
	      console.log("closeTab: closed.  syncing");
	      // TODO: we could probably sync just the one window
	      // Note:  Flux plays games with 'this', so we can't do this.syncWindowList()
	      self.flux.actions.syncWindowList();
	    });
	  },
	
	  syncWindowList: function() {
	    var self = this;
	    var t_start = performance.now();
	    chrome.windows.getAll( {populate: true}, function (windowList) {
	        chrome.windows.getLastFocused(null, function (focusedWindow) { 
	          var t_finish = performance.now();
	          console.log("syncWindowList: gathering window state took ", t_finish - t_start, " ms");
	          var payload = { windowList: windowList, focusedWindow: focusedWindow };
	          self.dispatch(constants.SYNC_WINDOW_LIST, payload);
	        });
	     });
	  }
	};
	
	module.exports = actions;

/***/ },
/* 4 */,
/* 5 */
/*!****************************!*\
  !*** ./~/fluxxor/index.js ***!
  \****************************/
/***/ function(module, exports, __webpack_require__) {

	var Dispatcher = __webpack_require__(/*! ./lib/dispatcher */ 12),
	    Flux = __webpack_require__(/*! ./lib/flux */ 11),
	    FluxMixin = __webpack_require__(/*! ./lib/flux_mixin */ 14),
	    FluxChildMixin = __webpack_require__(/*! ./lib/flux_child_mixin */ 13),
	    StoreWatchMixin = __webpack_require__(/*! ./lib/store_watch_mixin */ 15),
	    createStore = __webpack_require__(/*! ./lib/create_store */ 16);
	
	var Fluxxor = {
	  Dispatcher: Dispatcher,
	  Flux: Flux,
	  FluxMixin: FluxMixin,
	  FluxChildMixin: FluxChildMixin,
	  StoreWatchMixin: StoreWatchMixin,
	  createStore: createStore,
	  version: __webpack_require__(/*! ./version */ 17)
	};
	
	module.exports = Fluxxor;


/***/ },
/* 6 */,
/* 7 */,
/* 8 */
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
/* 9 */
/*!*****************************!*\
  !*** ./src/js/constants.js ***!
  \*****************************/
/***/ function(module, exports, __webpack_require__) {

	/*
	 * constants for managing tab window Flux store
	 */
	'use strict';
	
	var constants = {
	  ADD_TAB_WINDOWS: "ADD_TAB_WINDOWS",
	  ATTACH_CHROME_WINDOW: "ATTACH_CHROME_WINDOW",
	  CLOSE_TAB_WINDOW: "CLOSE_TAB_WINDOW",
	  REMOVE_TAB_WINDOW: "REMOVE_TAB_WINDOW",
	  REPLACE_WINDOW_STATE: "REPLACE_WINDOW_STATE",
	  REVERT_TAB_WINDOW: "REVERT_TAB_WINDOW",
	  SYNC_WINDOW_LIST: "SYNC_WINDOW_LIST"
	};
	
	module.exports = constants;

/***/ },
/* 10 */,
/* 11 */
/*!*******************************!*\
  !*** ./~/fluxxor/lib/flux.js ***!
  \*******************************/
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter = __webpack_require__(/*! eventemitter3 */ 41),
	    inherits = __webpack_require__(/*! inherits */ 43),
	    objectPath = __webpack_require__(/*! object-path */ 42),
	    _each = __webpack_require__(/*! lodash-node/modern/collection/forEach */ 45),
	    _reduce = __webpack_require__(/*! lodash-node/modern/collection/reduce */ 44),
	    _isFunction = __webpack_require__(/*! lodash-node/modern/lang/isFunction */ 49),
	    _isString = __webpack_require__(/*! lodash-node/modern/lang/isString */ 50);
	
	var Dispatcher = __webpack_require__(/*! ./dispatcher */ 12);
	
	var findLeaves = function(obj, path, callback) {
	  path = path || [];
	
	  for (var key in obj) {
	    if (obj.hasOwnProperty(key)) {
	      if (_isFunction(obj[key])) {
	        callback(path.concat(key), obj[key]);
	      } else {
	        findLeaves(obj[key], path.concat(key), callback);
	      }
	    }
	  }
	};
	
	var Flux = function(stores, actions) {
	  EventEmitter.call(this);
	  this.dispatcher = new Dispatcher(stores);
	  this.actions = {};
	  this.stores = {};
	
	  var dispatcher = this.dispatcher;
	  var flux = this;
	  this.dispatchBinder = {
	    flux: flux,
	    dispatch: function(type, payload) {
	      try {
	        flux.emit("dispatch", type, payload);
	      } finally {
	        dispatcher.dispatch({type: type, payload: payload});
	      }
	    }
	  };
	
	  this.addActions(actions);
	  this.addStores(stores);
	};
	
	inherits(Flux, EventEmitter);
	
	Flux.prototype.addActions = function(actions) {
	  findLeaves(actions, [], this.addAction.bind(this));
	};
	
	// addAction has two signatures:
	// 1: string[, string, string, string...], actionFunction
	// 2: arrayOfStrings, actionFunction
	Flux.prototype.addAction = function() {
	  if (arguments.length < 2) {
	    throw new Error("addAction requires at least two arguments, a string (or array of strings) and a function");
	  }
	
	  var args = Array.prototype.slice.call(arguments);
	
	  if (!_isFunction(args[args.length - 1])) {
	    throw new Error("The last argument to addAction must be a function");
	  }
	
	  var func = args.pop().bind(this.dispatchBinder);
	
	  if (!_isString(args[0])) {
	    args = args[0];
	  }
	
	  var leadingPaths = _reduce(args, function(acc, next) {
	    if (acc) {
	      var nextPath = acc[acc.length - 1].concat([next]);
	      return acc.concat([nextPath]);
	    } else {
	      return [[next]];
	    }
	  }, null);
	
	  // Detect trying to replace a function at any point in the path
	  _each(leadingPaths, function(path) {
	    if (_isFunction(objectPath.get(this.actions, path))) {
	      throw new Error("An action named " + args.join(".") + " already exists");
	    }
	  }, this);
	
	  // Detect trying to replace a namespace at the final point in the path
	  if (objectPath.get(this.actions, args)) {
	    throw new Error("A namespace named " + args.join(".") + " already exists");
	  }
	
	  objectPath.set(this.actions, args, func, true);
	};
	
	Flux.prototype.store = function(name) {
	  return this.stores[name];
	};
	
	Flux.prototype.addStore = function(name, store) {
	  if (name in this.stores) {
	    throw new Error("A store named '" + name + "' already exists");
	  }
	  store.flux = this;
	  this.stores[name] = store;
	  this.dispatcher.addStore(name, store);
	};
	
	Flux.prototype.addStores = function(stores) {
	  for (var key in stores) {
	    if (stores.hasOwnProperty(key)) {
	      this.addStore(key, stores[key]);
	    }
	  }
	};
	
	module.exports = Flux;


/***/ },
/* 12 */
/*!*************************************!*\
  !*** ./~/fluxxor/lib/dispatcher.js ***!
  \*************************************/
/***/ function(module, exports, __webpack_require__) {

	var _clone = __webpack_require__(/*! lodash-node/modern/lang/clone */ 48),
	    _mapValues = __webpack_require__(/*! lodash-node/modern/object/mapValues */ 52),
	    _forOwn = __webpack_require__(/*! lodash-node/modern/object/forOwn */ 51),
	    _intersection = __webpack_require__(/*! lodash-node/modern/array/intersection */ 55),
	    _keys = __webpack_require__(/*! lodash-node/modern/object/keys */ 53),
	    _map = __webpack_require__(/*! lodash-node/modern/collection/map */ 46),
	    _each = __webpack_require__(/*! lodash-node/modern/collection/forEach */ 45),
	    _size = __webpack_require__(/*! lodash-node/modern/collection/size */ 47),
	    _findKey = __webpack_require__(/*! lodash-node/modern/object/findKey */ 54),
	    _uniq = __webpack_require__(/*! lodash-node/modern/array/uniq */ 56);
	
	var Dispatcher = function(stores) {
	  this.stores = {};
	  this.currentDispatch = null;
	  this.currentActionType = null;
	  this.waitingToDispatch = [];
	
	  for (var key in stores) {
	    if (stores.hasOwnProperty(key)) {
	      this.addStore(key, stores[key]);
	    }
	  }
	};
	
	Dispatcher.prototype.addStore = function(name, store) {
	  store.dispatcher = this;
	  this.stores[name] = store;
	};
	
	Dispatcher.prototype.dispatch = function(action) {
	  if (!action || !action.type) {
	    throw new Error("Can only dispatch actions with a 'type' property");
	  }
	
	  if (this.currentDispatch) {
	    var complaint = "Cannot dispatch an action ('" + action.type + "') while another action ('" +
	                    this.currentActionType + "') is being dispatched";
	    throw new Error(complaint);
	  }
	
	  this.waitingToDispatch = _clone(this.stores);
	
	  this.currentActionType = action.type;
	  this.currentDispatch = _mapValues(this.stores, function() {
	    return { resolved: false, waitingOn: [], waitCallback: null };
	  });
	
	  try {
	    this.doDispatchLoop(action);
	  } finally {
	    this.currentActionType = null;
	    this.currentDispatch = null;
	  }
	};
	
	Dispatcher.prototype.doDispatchLoop = function(action) {
	  var dispatch, canBeDispatchedTo, wasHandled = false,
	      removeFromDispatchQueue = [], dispatchedThisLoop = [];
	
	  _forOwn(this.waitingToDispatch, function(value, key) {
	    dispatch = this.currentDispatch[key];
	    canBeDispatchedTo = !dispatch.waitingOn.length ||
	      !_intersection(dispatch.waitingOn, _keys(this.waitingToDispatch)).length;
	    if (canBeDispatchedTo) {
	      if (dispatch.waitCallback) {
	        var stores = _map(dispatch.waitingOn, function(key) {
	          return this.stores[key];
	        }, this);
	        var fn = dispatch.waitCallback;
	        dispatch.waitCallback = null;
	        dispatch.waitingOn = [];
	        dispatch.resolved = true;
	        fn.apply(null, stores);
	        wasHandled = true;
	      } else {
	        dispatch.resolved = true;
	        var handled = this.stores[key].__handleAction__(action);
	        if (handled) {
	          wasHandled = true;
	        }
	      }
	
	      dispatchedThisLoop.push(key);
	
	      if (this.currentDispatch[key].resolved) {
	        removeFromDispatchQueue.push(key);
	      }
	    }
	  }, this);
	
	  if (_keys(this.waitingToDispatch).length && !dispatchedThisLoop.length) {
	    var storesWithCircularWaits = _keys(this.waitingToDispatch).join(", ");
	    throw new Error("Indirect circular wait detected among: " + storesWithCircularWaits);
	  }
	
	  _each(removeFromDispatchQueue, function(key) {
	    delete this.waitingToDispatch[key];
	  }, this);
	
	  if (_size(this.waitingToDispatch)) {
	    this.doDispatchLoop(action);
	  }
	
	  if (!wasHandled && console && console.warn) {
	    console.warn("An action of type " + action.type + " was dispatched, but no store handled it");
	  }
	
	};
	
	Dispatcher.prototype.waitForStores = function(store, stores, fn) {
	  if (!this.currentDispatch) {
	    throw new Error("Cannot wait unless an action is being dispatched");
	  }
	
	  var waitingStoreName = _findKey(this.stores, function(val) {
	    return val === store;
	  });
	
	  if (stores.indexOf(waitingStoreName) > -1) {
	    throw new Error("A store cannot wait on itself");
	  }
	
	  var dispatch = this.currentDispatch[waitingStoreName];
	
	  if (dispatch.waitingOn.length) {
	    throw new Error(waitingStoreName + " already waiting on stores");
	  }
	
	  _each(stores, function(storeName) {
	    var storeDispatch = this.currentDispatch[storeName];
	    if (!this.stores[storeName]) {
	      throw new Error("Cannot wait for non-existent store " + storeName);
	    }
	    if (storeDispatch.waitingOn.indexOf(waitingStoreName) > -1) {
	      throw new Error("Circular wait detected between " + waitingStoreName + " and " + storeName);
	    }
	  }, this);
	
	  dispatch.resolved = false;
	  dispatch.waitingOn = _uniq(dispatch.waitingOn.concat(stores));
	  dispatch.waitCallback = fn;
	};
	
	module.exports = Dispatcher;


/***/ },
/* 13 */
/*!*******************************************!*\
  !*** ./~/fluxxor/lib/flux_child_mixin.js ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	var FluxChildMixin = function(React) {
	  return {
	    componentWillMount: function() {
	      if (console && console.warn) {
	        var namePart = this.constructor.displayName ? " in " + this.constructor.displayName : "",
	            message = "Fluxxor.FluxChildMixin was found in use" + namePart + ", " +
	                      "but has been deprecated. Use Fluxxor.FluxMixin instead.";
	        console.warn(message);
	      }
	    },
	
	    contextTypes: {
	      flux: React.PropTypes.object
	    },
	
	    getFlux: function() {
	      return this.context.flux;
	    }
	  };
	};
	
	FluxChildMixin.componentWillMount = function() {
	  throw new Error("Fluxxor.FluxChildMixin is a function that takes React as a " +
	    "parameter and returns the mixin, e.g.: mixins[Fluxxor.FluxChildMixin(React)]");
	};
	
	module.exports = FluxChildMixin;


/***/ },
/* 14 */
/*!*************************************!*\
  !*** ./~/fluxxor/lib/flux_mixin.js ***!
  \*************************************/
/***/ function(module, exports, __webpack_require__) {

	var FluxMixin = function(React) {
	  return {
	    componentWillMount: function() {
	      if (!this.props.flux && (!this.context || !this.context.flux)) {
	        var namePart = this.constructor.displayName ? " of " + this.constructor.displayName : "";
	        throw new Error("Could not find flux on this.props or this.context" + namePart);
	      }
	    },
	
	    childContextTypes: {
	      flux: React.PropTypes.object
	    },
	
	    contextTypes: {
	      flux: React.PropTypes.object
	    },
	
	    getChildContext: function() {
	      return {
	        flux: this.getFlux()
	      };
	    },
	
	    getFlux: function() {
	      return this.props.flux || (this.context && this.context.flux);
	    }
	  };
	};
	
	FluxMixin.componentWillMount = function() {
	  throw new Error("Fluxxor.FluxMixin is a function that takes React as a " +
	    "parameter and returns the mixin, e.g.: mixins: [Fluxxor.FluxMixin(React)]");
	};
	
	module.exports = FluxMixin;


/***/ },
/* 15 */
/*!********************************************!*\
  !*** ./~/fluxxor/lib/store_watch_mixin.js ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	var _each = __webpack_require__(/*! lodash-node/modern/collection/forEach */ 45);
	
	var StoreWatchMixin = function() {
	  var storeNames = Array.prototype.slice.call(arguments);
	  return {
	    componentDidMount: function() {
	      var flux = this.props.flux || this.context.flux;
	      _each(storeNames, function(store) {
	        flux.store(store).on("change", this._setStateFromFlux);
	      }, this);
	    },
	
	    componentWillUnmount: function() {
	      var flux = this.props.flux || this.context.flux;
	      _each(storeNames, function(store) {
	        flux.store(store).removeListener("change", this._setStateFromFlux);
	      }, this);
	    },
	
	    _setStateFromFlux: function() {
	      if(this.isMounted()) {
	        this.setState(this.getStateFromFlux());
	      }
	    },
	
	    getInitialState: function() {
	      return this.getStateFromFlux();
	    }
	  };
	};
	
	StoreWatchMixin.componentWillMount = function() {
	  throw new Error("Fluxxor.StoreWatchMixin is a function that takes one or more " +
	    "store names as parameters and returns the mixin, e.g.: " +
	    "mixins: [Fluxxor.StoreWatchMixin(\"Store1\", \"Store2\")]");
	};
	
	module.exports = StoreWatchMixin;


/***/ },
/* 16 */
/*!***************************************!*\
  !*** ./~/fluxxor/lib/create_store.js ***!
  \***************************************/
/***/ function(module, exports, __webpack_require__) {

	var _each = __webpack_require__(/*! lodash-node/modern/collection/forEach */ 45),
	    _isFunction = __webpack_require__(/*! lodash-node/modern/lang/isFunction */ 49),
	    Store = __webpack_require__(/*! ./store */ 18),
	    inherits = __webpack_require__(/*! inherits */ 43);
	
	var RESERVED_KEYS = ["flux", "waitFor"];
	
	var createStore = function(spec) {
	  _each(RESERVED_KEYS, function(key) {
	    if (spec[key]) {
	      throw new Error("Reserved key '" + key + "' found in store definition");
	    }
	  });
	
	  var constructor = function(options) {
	    options = options || {};
	    Store.call(this);
	
	    for (var key in spec) {
	      if (key === "actions") {
	        this.bindActions(spec[key]);
	      } else if (key === "initialize") {
	        // do nothing
	      } else if (_isFunction(spec[key])) {
	        this[key] = spec[key].bind(this);
	      } else {
	        this[key] = spec[key];
	      }
	    }
	
	    if (spec.initialize) {
	      spec.initialize.call(this, options);
	    }
	  };
	
	  inherits(constructor, Store);
	  return constructor;
	};
	
	module.exports = createStore;


/***/ },
/* 17 */
/*!******************************!*\
  !*** ./~/fluxxor/version.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	module.exports = "1.5.2"

/***/ },
/* 18 */
/*!********************************!*\
  !*** ./~/fluxxor/lib/store.js ***!
  \********************************/
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter = __webpack_require__(/*! eventemitter3 */ 41),
	    inherits = __webpack_require__(/*! inherits */ 43),
	    _isFunction = __webpack_require__(/*! lodash-node/modern/lang/isFunction */ 49),
	    _isObject = __webpack_require__(/*! lodash-node/modern/lang/isObject */ 57);
	
	function Store(dispatcher) {
	  this.dispatcher = dispatcher;
	  this.__actions__ = {};
	  EventEmitter.call(this);
	}
	
	inherits(Store, EventEmitter);
	
	Store.prototype.__handleAction__ = function(action) {
	  var handler;
	  if (!!(handler = this.__actions__[action.type])) {
	    if (_isFunction(handler)) {
	      handler.call(this, action.payload, action.type);
	    } else if (handler && _isFunction(this[handler])) {
	      this[handler].call(this, action.payload, action.type);
	    } else {
	      throw new Error("The handler for action type " + action.type + " is not a function");
	    }
	    return true;
	  } else {
	    return false;
	  }
	};
	
	Store.prototype.bindActions = function() {
	  var actions = Array.prototype.slice.call(arguments);
	
	  if (actions.length > 1 && actions.length % 2 !== 0) {
	    throw new Error("bindActions must take an even number of arguments.");
	  }
	
	  var bindAction = function(type, handler) {
	    if (!handler) {
	      throw new Error("The handler for action type " + type + " is falsy");
	    }
	
	    this.__actions__[type] = handler;
	  }.bind(this);
	
	  if (actions.length === 1 && _isObject(actions[0])) {
	    actions = actions[0];
	    for (var key in actions) {
	      if (actions.hasOwnProperty(key)) {
	        bindAction(key, actions[key]);
	      }
	    }
	  } else {
	    for (var i = 0; i < actions.length; i += 2) {
	      var type = actions[i],
	          handler = actions[i+1];
	
	      if (!type) {
	        throw new Error("Argument " + (i+1) + " to bindActions is a falsy value");
	      }
	
	      bindAction(type, handler);
	    }
	  }
	};
	
	Store.prototype.waitFor = function(stores, fn) {
	  this.dispatcher.waitForStores(this, stores, fn.bind(this));
	};
	
	module.exports = Store;


/***/ },
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */,
/* 34 */,
/* 35 */,
/* 36 */,
/* 37 */,
/* 38 */,
/* 39 */,
/* 40 */,
/* 41 */
/*!********************************************!*\
  !*** ./~/fluxxor/~/eventemitter3/index.js ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/**
	 * Representation of a single EventEmitter function.
	 *
	 * @param {Function} fn Event handler to be called.
	 * @param {Mixed} context Context for function execution.
	 * @param {Boolean} once Only emit once
	 * @api private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}
	
	/**
	 * Minimal EventEmitter interface that is molded against the Node.js
	 * EventEmitter interface.
	 *
	 * @constructor
	 * @api public
	 */
	function EventEmitter() { /* Nothing to set */ }
	
	/**
	 * Holds the assigned EventEmitters by name.
	 *
	 * @type {Object}
	 * @private
	 */
	EventEmitter.prototype._events = undefined;
	
	/**
	 * Return a list of assigned event listeners.
	 *
	 * @param {String} event The events that should be listed.
	 * @returns {Array}
	 * @api public
	 */
	EventEmitter.prototype.listeners = function listeners(event) {
	  if (!this._events || !this._events[event]) return [];
	  if (this._events[event].fn) return [this._events[event].fn];
	
	  for (var i = 0, l = this._events[event].length, ee = new Array(l); i < l; i++) {
	    ee[i] = this._events[event][i].fn;
	  }
	
	  return ee;
	};
	
	/**
	 * Emit an event to all registered event listeners.
	 *
	 * @param {String} event The name of the event.
	 * @returns {Boolean} Indication if we've emitted an event.
	 * @api public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  if (!this._events || !this._events[event]) return false;
	
	  var listeners = this._events[event]
	    , len = arguments.length
	    , args
	    , i;
	
	  if ('function' === typeof listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, true);
	
	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }
	
	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }
	
	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;
	
	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);
	
	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }
	
	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }
	
	  return true;
	};
	
	/**
	 * Register a new EventListener for the given event.
	 *
	 * @param {String} event Name of the event.
	 * @param {Functon} fn Callback function.
	 * @param {Mixed} context The context of the function.
	 * @api public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  var listener = new EE(fn, context || this);
	
	  if (!this._events) this._events = {};
	  if (!this._events[event]) this._events[event] = listener;
	  else {
	    if (!this._events[event].fn) this._events[event].push(listener);
	    else this._events[event] = [
	      this._events[event], listener
	    ];
	  }
	
	  return this;
	};
	
	/**
	 * Add an EventListener that's only called once.
	 *
	 * @param {String} event Name of the event.
	 * @param {Function} fn Callback function.
	 * @param {Mixed} context The context of the function.
	 * @api public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  var listener = new EE(fn, context || this, true);
	
	  if (!this._events) this._events = {};
	  if (!this._events[event]) this._events[event] = listener;
	  else {
	    if (!this._events[event].fn) this._events[event].push(listener);
	    else this._events[event] = [
	      this._events[event], listener
	    ];
	  }
	
	  return this;
	};
	
	/**
	 * Remove event listeners.
	 *
	 * @param {String} event The event we want to remove.
	 * @param {Function} fn The listener that we need to find.
	 * @param {Boolean} once Only remove once listeners.
	 * @api public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
	  if (!this._events || !this._events[event]) return this;
	
	  var listeners = this._events[event]
	    , events = [];
	
	  if (fn) {
	    if (listeners.fn && (listeners.fn !== fn || (once && !listeners.once))) {
	      events.push(listeners);
	    }
	    if (!listeners.fn) for (var i = 0, length = listeners.length; i < length; i++) {
	      if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
	        events.push(listeners[i]);
	      }
	    }
	  }
	
	  //
	  // Reset the array, or remove it completely if we have no more listeners.
	  //
	  if (events.length) {
	    this._events[event] = events.length === 1 ? events[0] : events;
	  } else {
	    delete this._events[event];
	  }
	
	  return this;
	};
	
	/**
	 * Remove all listeners or only the listeners for the specified event.
	 *
	 * @param {String} event The event want to remove all listeners for.
	 * @api public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  if (!this._events) return this;
	
	  if (event) delete this._events[event];
	  else this._events = {};
	
	  return this;
	};
	
	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;
	
	//
	// This function doesn't apply anymore.
	//
	EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
	  return this;
	};
	
	//
	// Expose the module.
	//
	EventEmitter.EventEmitter = EventEmitter;
	EventEmitter.EventEmitter2 = EventEmitter;
	EventEmitter.EventEmitter3 = EventEmitter;
	
	//
	// Expose the module.
	//
	module.exports = EventEmitter;


/***/ },
/* 42 */
/*!******************************************!*\
  !*** ./~/fluxxor/~/object-path/index.js ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory){
	  'use strict';
	
	  /*istanbul ignore next:cant test*/
	  if (typeof module === 'object' && typeof module.exports === 'object') {
	    module.exports = factory();
	  } else if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else {
	    // Browser globals
	    root.objectPath = factory();
	  }
	})(this, function(){
	  'use strict';
	
	  var
	    toStr = Object.prototype.toString,
	    _hasOwnProperty = Object.prototype.hasOwnProperty;
	
	  function isEmpty(value){
	    if (!value) {
	      return true;
	    }
	    if (isArray(value) && value.length === 0) {
	      return true;
	    } else {
	      for (var i in value) {
	        if (_hasOwnProperty.call(value, i)) {
	          return false;
	        }
	      }
	      return true;
	    }
	  }
	
	  function toString(type){
	    return toStr.call(type);
	  }
	
	  function isNumber(value){
	    return typeof value === 'number' || toString(value) === "[object Number]";
	  }
	
	  function isString(obj){
	    return typeof obj === 'string' || toString(obj) === "[object String]";
	  }
	
	  function isObject(obj){
	    return typeof obj === 'object' && toString(obj) === "[object Object]";
	  }
	
	  function isArray(obj){
	    return typeof obj === 'object' && typeof obj.length === 'number' && toString(obj) === '[object Array]';
	  }
	
	  function isBoolean(obj){
	    return typeof obj === 'boolean' || toString(obj) === '[object Boolean]';
	  }
	
	  function getKey(key){
	    var intKey = parseInt(key);
	    if (intKey.toString() === key) {
	      return intKey;
	    }
	    return key;
	  }
	
	  function set(obj, path, value, doNotReplace){
	    if (isNumber(path)) {
	      path = [path];
	    }
	    if (isEmpty(path)) {
	      return obj;
	    }
	    if (isString(path)) {
	      return set(obj, path.split('.'), value, doNotReplace);
	    }
	    var currentPath = getKey(path[0]);
	
	    if (path.length === 1) {
	      var oldVal = obj[currentPath];
	      if (oldVal === void 0 || !doNotReplace) {
	        obj[currentPath] = value;
	      }
	      return oldVal;
	    }
	
	    if (obj[currentPath] === void 0) {
	      if (isNumber(currentPath)) {
	        obj[currentPath] = [];
	      } else {
	        obj[currentPath] = {};
	      }
	    }
	
	    return set(obj[currentPath], path.slice(1), value, doNotReplace);
	  }
	
	  function del(obj, path) {
	    if (isNumber(path)) {
	      path = [path];
	    }
	
	    if (isEmpty(obj)) {
	      return void 0;
	    }
	
	    if (isEmpty(path)) {
	      return obj;
	    }
	    if(isString(path)) {
	      return del(obj, path.split('.'));
	    }
	
	    var currentPath = getKey(path[0]);
	    var oldVal = obj[currentPath];
	
	    if(path.length === 1) {
	      if (oldVal !== void 0) {
	        if (isArray(obj)) {
	          obj.splice(currentPath, 1);
	        } else {
	          delete obj[currentPath];
	        }
	      }
	    } else {
	      if (obj[currentPath] !== void 0) {
	        return del(obj[currentPath], path.slice(1));
	      }
	    }
	
	    return obj;
	  }
	
	  var objectPath = {};
	
	  objectPath.ensureExists = function (obj, path, value){
	    return set(obj, path, value, true);
	  };
	
	  objectPath.set = function (obj, path, value, doNotReplace){
	    return set(obj, path, value, doNotReplace);
	  };
	
	  objectPath.insert = function (obj, path, value, at){
	    var arr = objectPath.get(obj, path);
	    at = ~~at;
	    if (!isArray(arr)) {
	      arr = [];
	      objectPath.set(obj, path, arr);
	    }
	    arr.splice(at, 0, value);
	  };
	
	  objectPath.empty = function(obj, path) {
	    if (isEmpty(path)) {
	      return obj;
	    }
	    if (isEmpty(obj)) {
	      return void 0;
	    }
	
	    var value, i;
	    if (!(value = objectPath.get(obj, path))) {
	      return obj;
	    }
	
	    if (isString(value)) {
	      return objectPath.set(obj, path, '');
	    } else if (isBoolean(value)) {
	      return objectPath.set(obj, path, false);
	    } else if (isNumber(value)) {
	      return objectPath.set(obj, path, 0);
	    } else if (isArray(value)) {
	      value.length = 0;
	    } else if (isObject(value)) {
	      for (i in value) {
	        if (_hasOwnProperty.call(value, i)) {
	          delete value[i];
	        }
	      }
	    } else {
	      return objectPath.set(obj, path, null);
	    }
	  };
	
	  objectPath.push = function (obj, path /*, values */){
	    var arr = objectPath.get(obj, path);
	    if (!isArray(arr)) {
	      arr = [];
	      objectPath.set(obj, path, arr);
	    }
	
	    arr.push.apply(arr, Array.prototype.slice.call(arguments, 2));
	  };
	
	  objectPath.coalesce = function (obj, paths, defaultValue) {
	    var value;
	
	    for (var i = 0, len = paths.length; i < len; i++) {
	      if ((value = objectPath.get(obj, paths[i])) !== void 0) {
	        return value;
	      }
	    }
	
	    return defaultValue;
	  };
	
	  objectPath.get = function (obj, path, defaultValue){
	    if (isNumber(path)) {
	      path = [path];
	    }
	    if (isEmpty(path)) {
	      return obj;
	    }
	    if (isEmpty(obj)) {
	      return defaultValue;
	    }
	    if (isString(path)) {
	      return objectPath.get(obj, path.split('.'), defaultValue);
	    }
	
	    var currentPath = getKey(path[0]);
	
	    if (path.length === 1) {
	      if (obj[currentPath] === void 0) {
	        return defaultValue;
	      }
	      return obj[currentPath];
	    }
	
	    return objectPath.get(obj[currentPath], path.slice(1), defaultValue);
	  };
	
	  objectPath.del = function(obj, path) {
	    return del(obj, path);
	  };
	
	  return objectPath;
	});

/***/ },
/* 43 */
/*!**************************************************!*\
  !*** ./~/fluxxor/~/inherits/inherits_browser.js ***!
  \**************************************************/
/***/ function(module, exports, __webpack_require__) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 44 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/collection/reduce.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var arrayReduce = __webpack_require__(/*! ../internal/arrayReduce */ 126),
	    baseEach = __webpack_require__(/*! ../internal/baseEach */ 123),
	    createReduce = __webpack_require__(/*! ../internal/createReduce */ 127);
	
	/**
	 * Reduces `collection` to a value which is the accumulated result of running
	 * each element in `collection` through `iteratee`, where each successive
	 * invocation is supplied the return value of the previous. If `accumulator`
	 * is not provided the first element of `collection` is used as the initial
	 * value. The `iteratee` is bound to `thisArg` and invoked with four arguments:
	 * (accumulator, value, index|key, collection).
	 *
	 * Many lodash methods are guarded to work as interatees for methods like
	 * `_.reduce`, `_.reduceRight`, and `_.transform`.
	 *
	 * The guarded methods are:
	 * `assign`, `defaults`, `includes`, `merge`, `sortByAll`, and `sortByOrder`
	 *
	 * @static
	 * @memberOf _
	 * @alias foldl, inject
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @param {*} [thisArg] The `this` binding of `iteratee`.
	 * @returns {*} Returns the accumulated value.
	 * @example
	 *
	 * _.reduce([1, 2], function(sum, n) {
	 *   return sum + n;
	 * });
	 * // => 3
	 *
	 * _.reduce({ 'a': 1, 'b': 2 }, function(result, n, key) {
	 *   result[key] = n * 3;
	 *   return result;
	 * }, {});
	 * // => { 'a': 3, 'b': 6 } (iteration order is not guaranteed)
	 */
	var reduce = createReduce(arrayReduce, baseEach);
	
	module.exports = reduce;


/***/ },
/* 45 */
/*!**************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/collection/forEach.js ***!
  \**************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var arrayEach = __webpack_require__(/*! ../internal/arrayEach */ 124),
	    baseEach = __webpack_require__(/*! ../internal/baseEach */ 123),
	    createForEach = __webpack_require__(/*! ../internal/createForEach */ 125);
	
	/**
	 * Iterates over elements of `collection` invoking `iteratee` for each element.
	 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
	 * (value, index|key, collection). Iterator functions may exit iteration early
	 * by explicitly returning `false`.
	 *
	 * **Note:** As with other "Collections" methods, objects with a `length` property
	 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
	 * may be used for object iteration.
	 *
	 * @static
	 * @memberOf _
	 * @alias each
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {*} [thisArg] The `this` binding of `iteratee`.
	 * @returns {Array|Object|string} Returns `collection`.
	 * @example
	 *
	 * _([1, 2]).forEach(function(n) {
	 *   console.log(n);
	 * }).value();
	 * // => logs each value from left to right and returns the array
	 *
	 * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
	 *   console.log(n, key);
	 * });
	 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
	 */
	var forEach = createForEach(arrayEach, baseEach);
	
	module.exports = forEach;


/***/ },
/* 46 */
/*!**********************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/collection/map.js ***!
  \**********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var arrayMap = __webpack_require__(/*! ../internal/arrayMap */ 128),
	    baseCallback = __webpack_require__(/*! ../internal/baseCallback */ 129),
	    baseMap = __webpack_require__(/*! ../internal/baseMap */ 131),
	    isArray = __webpack_require__(/*! ../lang/isArray */ 130);
	
	/**
	 * Creates an array of values by running each element in `collection` through
	 * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
	 * arguments: (value, index|key, collection).
	 *
	 * If a property name is provided for `iteratee` the created `_.property`
	 * style callback returns the property value of the given element.
	 *
	 * If a value is also provided for `thisArg` the created `_.matchesProperty`
	 * style callback returns `true` for elements that have a matching property
	 * value, else `false`.
	 *
	 * If an object is provided for `iteratee` the created `_.matches` style
	 * callback returns `true` for elements that have the properties of the given
	 * object, else `false`.
	 *
	 * Many lodash methods are guarded to work as interatees for methods like
	 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
	 *
	 * The guarded methods are:
	 * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`, `drop`,
	 * `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`, `parseInt`,
	 * `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`, `trimLeft`,
	 * `trimRight`, `trunc`, `random`, `range`, `sample`, `some`, `uniq`, and `words`
	 *
	 * @static
	 * @memberOf _
	 * @alias collect
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	 *  per iteration.
	 *  create a `_.property` or `_.matches` style callback respectively.
	 * @param {*} [thisArg] The `this` binding of `iteratee`.
	 * @returns {Array} Returns the new mapped array.
	 * @example
	 *
	 * function timesThree(n) {
	 *   return n * 3;
	 * }
	 *
	 * _.map([1, 2], timesThree);
	 * // => [3, 6]
	 *
	 * _.map({ 'a': 1, 'b': 2 }, timesThree);
	 * // => [3, 6] (iteration order is not guaranteed)
	 *
	 * var users = [
	 *   { 'user': 'barney' },
	 *   { 'user': 'fred' }
	 * ];
	 *
	 * // using the `_.property` callback shorthand
	 * _.map(users, 'user');
	 * // => ['barney', 'fred']
	 */
	function map(collection, iteratee, thisArg) {
	  var func = isArray(collection) ? arrayMap : baseMap;
	  iteratee = baseCallback(iteratee, thisArg, 3);
	  return func(collection, iteratee);
	}
	
	module.exports = map;


/***/ },
/* 47 */
/*!***********************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/collection/size.js ***!
  \***********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(/*! ../internal/isLength */ 122),
	    keys = __webpack_require__(/*! ../object/keys */ 53);
	
	/**
	 * Gets the size of `collection` by returning its length for array-like
	 * values or the number of own enumerable properties for objects.
	 *
	 * @static
	 * @memberOf _
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to inspect.
	 * @returns {number} Returns the size of `collection`.
	 * @example
	 *
	 * _.size([1, 2, 3]);
	 * // => 3
	 *
	 * _.size({ 'a': 1, 'b': 2 });
	 * // => 2
	 *
	 * _.size('pebbles');
	 * // => 7
	 */
	function size(collection) {
	  var length = collection ? collection.length : 0;
	  return isLength(length) ? length : keys(collection).length;
	}
	
	module.exports = size;


/***/ },
/* 48 */
/*!******************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/lang/clone.js ***!
  \******************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseClone = __webpack_require__(/*! ../internal/baseClone */ 187),
	    bindCallback = __webpack_require__(/*! ../internal/bindCallback */ 188),
	    isIterateeCall = __webpack_require__(/*! ../internal/isIterateeCall */ 180);
	
	/**
	 * Creates a clone of `value`. If `isDeep` is `true` nested objects are cloned,
	 * otherwise they are assigned by reference. If `customizer` is provided it is
	 * invoked to produce the cloned values. If `customizer` returns `undefined`
	 * cloning is handled by the method instead. The `customizer` is bound to
	 * `thisArg` and invoked with two argument; (value [, index|key, object]).
	 *
	 * **Note:** This method is loosely based on the
	 * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
	 * The enumerable properties of `arguments` objects and objects created by
	 * constructors other than `Object` are cloned to plain `Object` objects. An
	 * empty object is returned for uncloneable values such as functions, DOM nodes,
	 * Maps, Sets, and WeakMaps.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @param {Function} [customizer] The function to customize cloning values.
	 * @param {*} [thisArg] The `this` binding of `customizer`.
	 * @returns {*} Returns the cloned value.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney' },
	 *   { 'user': 'fred' }
	 * ];
	 *
	 * var shallow = _.clone(users);
	 * shallow[0] === users[0];
	 * // => true
	 *
	 * var deep = _.clone(users, true);
	 * deep[0] === users[0];
	 * // => false
	 *
	 * // using a customizer callback
	 * var el = _.clone(document.body, function(value) {
	 *   if (_.isElement(value)) {
	 *     return value.cloneNode(false);
	 *   }
	 * });
	 *
	 * el === document.body
	 * // => false
	 * el.nodeName
	 * // => BODY
	 * el.childNodes.length;
	 * // => 0
	 */
	function clone(value, isDeep, customizer, thisArg) {
	  if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
	    isDeep = false;
	  }
	  else if (typeof isDeep == 'function') {
	    thisArg = customizer;
	    customizer = isDeep;
	    isDeep = false;
	  }
	  customizer = typeof customizer == 'function' && bindCallback(customizer, thisArg, 1);
	  return baseClone(value, isDeep, customizer);
	}
	
	module.exports = clone;


/***/ },
/* 49 */
/*!***********************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/lang/isFunction.js ***!
  \***********************************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var baseIsFunction = __webpack_require__(/*! ../internal/baseIsFunction */ 189),
	    isNative = __webpack_require__(/*! ./isNative */ 132);
	
	/** `Object#toString` result references. */
	var funcTag = '[object Function]';
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/**
	 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;
	
	/** Native method references. */
	var Uint8Array = isNative(Uint8Array = global.Uint8Array) && Uint8Array;
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	var isFunction = !(baseIsFunction(/x/) || (Uint8Array && !baseIsFunction(Uint8Array))) ? baseIsFunction : function(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in older versions of Chrome and Safari which return 'function' for regexes
	  // and Safari 8 equivalents which return 'object' for typed array constructors.
	  return objToString.call(value) == funcTag;
	};
	
	module.exports = isFunction;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 50 */
/*!*********************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/lang/isString.js ***!
  \*********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isObjectLike = __webpack_require__(/*! ../internal/isObjectLike */ 190);
	
	/** `Object#toString` result references. */
	var stringTag = '[object String]';
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/**
	 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;
	
	/**
	 * Checks if `value` is classified as a `String` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isString('abc');
	 * // => true
	 *
	 * _.isString(1);
	 * // => false
	 */
	function isString(value) {
	  return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
	}
	
	module.exports = isString;


/***/ },
/* 51 */
/*!*********************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/object/forOwn.js ***!
  \*********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseForOwn = __webpack_require__(/*! ../internal/baseForOwn */ 133),
	    createForOwn = __webpack_require__(/*! ../internal/createForOwn */ 134);
	
	/**
	 * Iterates over own enumerable properties of an object invoking `iteratee`
	 * for each property. The `iteratee` is bound to `thisArg` and invoked with
	 * three arguments: (value, key, object). Iterator functions may exit iteration
	 * early by explicitly returning `false`.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {*} [thisArg] The `this` binding of `iteratee`.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.forOwn(new Foo, function(value, key) {
	 *   console.log(key);
	 * });
	 * // => logs 'a' and 'b' (iteration order is not guaranteed)
	 */
	var forOwn = createForOwn(baseForOwn);
	
	module.exports = forOwn;


/***/ },
/* 52 */
/*!************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/object/mapValues.js ***!
  \************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseCallback = __webpack_require__(/*! ../internal/baseCallback */ 129),
	    baseForOwn = __webpack_require__(/*! ../internal/baseForOwn */ 133);
	
	/**
	 * Creates an object with the same keys as `object` and values generated by
	 * running each own enumerable property of `object` through `iteratee`. The
	 * iteratee function is bound to `thisArg` and invoked with three arguments:
	 * (value, key, object).
	 *
	 * If a property name is provided for `iteratee` the created `_.property`
	 * style callback returns the property value of the given element.
	 *
	 * If a value is also provided for `thisArg` the created `_.matchesProperty`
	 * style callback returns `true` for elements that have a matching property
	 * value, else `false`.
	 *
	 * If an object is provided for `iteratee` the created `_.matches` style
	 * callback returns `true` for elements that have the properties of the given
	 * object, else `false`.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	 *  per iteration.
	 * @param {*} [thisArg] The `this` binding of `iteratee`.
	 * @returns {Object} Returns the new mapped object.
	 * @example
	 *
	 * _.mapValues({ 'a': 1, 'b': 2 }, function(n) {
	 *   return n * 3;
	 * });
	 * // => { 'a': 3, 'b': 6 }
	 *
	 * var users = {
	 *   'fred':    { 'user': 'fred',    'age': 40 },
	 *   'pebbles': { 'user': 'pebbles', 'age': 1 }
	 * };
	 *
	 * // using the `_.property` callback shorthand
	 * _.mapValues(users, 'age');
	 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
	 */
	function mapValues(object, iteratee, thisArg) {
	  var result = {};
	  iteratee = baseCallback(iteratee, thisArg, 3);
	
	  baseForOwn(object, function(value, key, object) {
	    result[key] = iteratee(value, key, object);
	  });
	  return result;
	}
	
	module.exports = mapValues;


/***/ },
/* 53 */
/*!*******************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/object/keys.js ***!
  \*******************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(/*! ../internal/isLength */ 122),
	    isNative = __webpack_require__(/*! ../lang/isNative */ 132),
	    isObject = __webpack_require__(/*! ../lang/isObject */ 57),
	    shimKeys = __webpack_require__(/*! ../internal/shimKeys */ 136);
	
	/* Native method references for those with the same name as other `lodash` methods. */
	var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;
	
	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to inspect.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	var keys = !nativeKeys ? shimKeys : function(object) {
	  if (object) {
	    var Ctor = object.constructor,
	        length = object.length;
	  }
	  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
	      (typeof object != 'function' && (length && isLength(length)))) {
	    return shimKeys(object);
	  }
	  return isObject(object) ? nativeKeys(object) : [];
	};
	
	module.exports = keys;


/***/ },
/* 54 */
/*!**********************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/object/findKey.js ***!
  \**********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseForOwn = __webpack_require__(/*! ../internal/baseForOwn */ 133),
	    createFindKey = __webpack_require__(/*! ../internal/createFindKey */ 135);
	
	/**
	 * This method is like `_.find` except that it returns the key of the first
	 * element `predicate` returns truthy for instead of the element itself.
	 *
	 * If a property name is provided for `predicate` the created `_.property`
	 * style callback returns the property value of the given element.
	 *
	 * If a value is also provided for `thisArg` the created `_.matchesProperty`
	 * style callback returns `true` for elements that have a matching property
	 * value, else `false`.
	 *
	 * If an object is provided for `predicate` the created `_.matches` style
	 * callback returns `true` for elements that have the properties of the given
	 * object, else `false`.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to search.
	 * @param {Function|Object|string} [predicate=_.identity] The function invoked
	 *  per iteration.
	 * @param {*} [thisArg] The `this` binding of `predicate`.
	 * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
	 * @example
	 *
	 * var users = {
	 *   'barney':  { 'age': 36, 'active': true },
	 *   'fred':    { 'age': 40, 'active': false },
	 *   'pebbles': { 'age': 1,  'active': true }
	 * };
	 *
	 * _.findKey(users, function(chr) {
	 *   return chr.age < 40;
	 * });
	 * // => 'barney' (iteration order is not guaranteed)
	 *
	 * // using the `_.matches` callback shorthand
	 * _.findKey(users, { 'age': 1, 'active': true });
	 * // => 'pebbles'
	 *
	 * // using the `_.matchesProperty` callback shorthand
	 * _.findKey(users, 'active', false);
	 * // => 'fred'
	 *
	 * // using the `_.property` callback shorthand
	 * _.findKey(users, 'active');
	 * // => 'barney'
	 */
	var findKey = createFindKey(baseForOwn);
	
	module.exports = findKey;


/***/ },
/* 55 */
/*!**************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/array/intersection.js ***!
  \**************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseIndexOf = __webpack_require__(/*! ../internal/baseIndexOf */ 181),
	    cacheIndexOf = __webpack_require__(/*! ../internal/cacheIndexOf */ 182),
	    createCache = __webpack_require__(/*! ../internal/createCache */ 183),
	    isArguments = __webpack_require__(/*! ../lang/isArguments */ 184),
	    isArray = __webpack_require__(/*! ../lang/isArray */ 130);
	
	/**
	 * Creates an array of unique values in all provided arrays using `SameValueZero`
	 * for equality comparisons.
	 *
	 * **Note:** [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
	 * comparisons are like strict equality comparisons, e.g. `===`, except that
	 * `NaN` matches `NaN`.
	 *
	 * @static
	 * @memberOf _
	 * @category Array
	 * @param {...Array} [arrays] The arrays to inspect.
	 * @returns {Array} Returns the new array of shared values.
	 * @example
	 * _.intersection([1, 2], [4, 2], [2, 1]);
	 * // => [2]
	 */
	function intersection() {
	  var args = [],
	      argsIndex = -1,
	      argsLength = arguments.length,
	      caches = [],
	      indexOf = baseIndexOf,
	      isCommon = true;
	
	  while (++argsIndex < argsLength) {
	    var value = arguments[argsIndex];
	    if (isArray(value) || isArguments(value)) {
	      args.push(value);
	      caches.push((isCommon && value.length >= 120) ? createCache(argsIndex && value) : null);
	    }
	  }
	  argsLength = args.length;
	  var array = args[0],
	      index = -1,
	      length = array ? array.length : 0,
	      result = [],
	      seen = caches[0];
	
	  outer:
	  while (++index < length) {
	    value = array[index];
	    if ((seen ? cacheIndexOf(seen, value) : indexOf(result, value, 0)) < 0) {
	      argsIndex = argsLength;
	      while (--argsIndex) {
	        var cache = caches[argsIndex];
	        if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value, 0)) < 0) {
	          continue outer;
	        }
	      }
	      if (seen) {
	        seen.push(value);
	      }
	      result.push(value);
	    }
	  }
	  return result;
	}
	
	module.exports = intersection;


/***/ },
/* 56 */
/*!******************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/array/uniq.js ***!
  \******************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseCallback = __webpack_require__(/*! ../internal/baseCallback */ 129),
	    baseUniq = __webpack_require__(/*! ../internal/baseUniq */ 185),
	    isIterateeCall = __webpack_require__(/*! ../internal/isIterateeCall */ 180),
	    sortedUniq = __webpack_require__(/*! ../internal/sortedUniq */ 186);
	
	/**
	 * Creates a duplicate-value-free version of an array using `SameValueZero`
	 * for equality comparisons. Providing `true` for `isSorted` performs a faster
	 * search algorithm for sorted arrays. If an iteratee function is provided it
	 * is invoked for each value in the array to generate the criterion by which
	 * uniqueness is computed. The `iteratee` is bound to `thisArg` and invoked
	 * with three arguments: (value, index, array).
	 *
	 * If a property name is provided for `iteratee` the created `_.property`
	 * style callback returns the property value of the given element.
	 *
	 * If a value is also provided for `thisArg` the created `_.matchesProperty`
	 * style callback returns `true` for elements that have a matching property
	 * value, else `false`.
	 *
	 * If an object is provided for `iteratee` the created `_.matches` style
	 * callback returns `true` for elements that have the properties of the given
	 * object, else `false`.
	 *
	 * **Note:** [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
	 * comparisons are like strict equality comparisons, e.g. `===`, except that
	 * `NaN` matches `NaN`.
	 *
	 * @static
	 * @memberOf _
	 * @alias unique
	 * @category Array
	 * @param {Array} array The array to inspect.
	 * @param {boolean} [isSorted] Specify the array is sorted.
	 * @param {Function|Object|string} [iteratee] The function invoked per iteration.
	 * @param {*} [thisArg] The `this` binding of `iteratee`.
	 * @returns {Array} Returns the new duplicate-value-free array.
	 * @example
	 *
	 * _.uniq([1, 2, 1]);
	 * // => [1, 2]
	 *
	 * // using `isSorted`
	 * _.uniq([1, 1, 2], true);
	 * // => [1, 2]
	 *
	 * // using an iteratee function
	 * _.uniq([1, 2.5, 1.5, 2], function(n) {
	 *   return this.floor(n);
	 * }, Math);
	 * // => [1, 2.5]
	 *
	 * // using the `_.property` callback shorthand
	 * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
	 * // => [{ 'x': 1 }, { 'x': 2 }]
	 */
	function uniq(array, isSorted, iteratee, thisArg) {
	  var length = array ? array.length : 0;
	  if (!length) {
	    return [];
	  }
	  if (isSorted != null && typeof isSorted != 'boolean') {
	    thisArg = iteratee;
	    iteratee = isIterateeCall(array, isSorted, thisArg) ? null : isSorted;
	    isSorted = false;
	  }
	  iteratee = iteratee == null ? iteratee : baseCallback(iteratee, thisArg, 3);
	  return (isSorted)
	    ? sortedUniq(array, iteratee)
	    : baseUniq(array, iteratee);
	}
	
	module.exports = uniq;


/***/ },
/* 57 */
/*!*********************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/lang/isObject.js ***!
  \*********************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(1);
	 * // => false
	 */
	function isObject(value) {
	  // Avoid a V8 JIT bug in Chrome 19-20.
	  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	  var type = typeof value;
	  return type == 'function' || (!!value && type == 'object');
	}
	
	module.exports = isObject;


/***/ },
/* 58 */,
/* 59 */,
/* 60 */,
/* 61 */,
/* 62 */,
/* 63 */,
/* 64 */,
/* 65 */,
/* 66 */,
/* 67 */,
/* 68 */,
/* 69 */,
/* 70 */,
/* 71 */,
/* 72 */,
/* 73 */,
/* 74 */,
/* 75 */,
/* 76 */,
/* 77 */,
/* 78 */,
/* 79 */,
/* 80 */,
/* 81 */,
/* 82 */,
/* 83 */,
/* 84 */,
/* 85 */,
/* 86 */,
/* 87 */,
/* 88 */,
/* 89 */,
/* 90 */,
/* 91 */,
/* 92 */,
/* 93 */,
/* 94 */,
/* 95 */,
/* 96 */,
/* 97 */,
/* 98 */,
/* 99 */,
/* 100 */,
/* 101 */,
/* 102 */,
/* 103 */,
/* 104 */,
/* 105 */,
/* 106 */,
/* 107 */,
/* 108 */,
/* 109 */,
/* 110 */,
/* 111 */,
/* 112 */,
/* 113 */,
/* 114 */,
/* 115 */,
/* 116 */,
/* 117 */,
/* 118 */,
/* 119 */,
/* 120 */,
/* 121 */,
/* 122 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/isLength.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
	 * of an array-like value.
	 */
	var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 */
	function isLength(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	module.exports = isLength;


/***/ },
/* 123 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseEach.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseForOwn = __webpack_require__(/*! ./baseForOwn */ 133),
	    createBaseEach = __webpack_require__(/*! ./createBaseEach */ 191);
	
	/**
	 * The base implementation of `_.forEach` without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array|Object|string} Returns `collection`.
	 */
	var baseEach = createBaseEach(baseForOwn);
	
	module.exports = baseEach;


/***/ },
/* 124 */
/*!**************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/arrayEach.js ***!
  \**************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `_.forEach` for arrays without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns `array`.
	 */
	function arrayEach(array, iteratee) {
	  var index = -1,
	      length = array.length;
	
	  while (++index < length) {
	    if (iteratee(array[index], index, array) === false) {
	      break;
	    }
	  }
	  return array;
	}
	
	module.exports = arrayEach;


/***/ },
/* 125 */
/*!******************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/createForEach.js ***!
  \******************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var bindCallback = __webpack_require__(/*! ./bindCallback */ 188),
	    isArray = __webpack_require__(/*! ../lang/isArray */ 130);
	
	/**
	 * Creates a function for `_.forEach` or `_.forEachRight`.
	 *
	 * @private
	 * @param {Function} arrayFunc The function to iterate over an array.
	 * @param {Function} eachFunc The function to iterate over a collection.
	 * @returns {Function} Returns the new each function.
	 */
	function createForEach(arrayFunc, eachFunc) {
	  return function(collection, iteratee, thisArg) {
	    return (typeof iteratee == 'function' && typeof thisArg == 'undefined' && isArray(collection))
	      ? arrayFunc(collection, iteratee)
	      : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
	  };
	}
	
	module.exports = createForEach;


/***/ },
/* 126 */
/*!****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/arrayReduce.js ***!
  \****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `_.reduce` for arrays without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @param {boolean} [initFromArray] Specify using the first element of `array`
	 *  as the initial value.
	 * @returns {*} Returns the accumulated value.
	 */
	function arrayReduce(array, iteratee, accumulator, initFromArray) {
	  var index = -1,
	      length = array.length;
	
	  if (initFromArray && length) {
	    accumulator = array[++index];
	  }
	  while (++index < length) {
	    accumulator = iteratee(accumulator, array[index], index, array);
	  }
	  return accumulator;
	}
	
	module.exports = arrayReduce;


/***/ },
/* 127 */
/*!*****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/createReduce.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseCallback = __webpack_require__(/*! ./baseCallback */ 129),
	    baseReduce = __webpack_require__(/*! ./baseReduce */ 196),
	    isArray = __webpack_require__(/*! ../lang/isArray */ 130);
	
	/**
	 * Creates a function for `_.reduce` or `_.reduceRight`.
	 *
	 * @private
	 * @param {Function} arrayFunc The function to iterate over an array.
	 * @param {Function} eachFunc The function to iterate over a collection.
	 * @returns {Function} Returns the new each function.
	 */
	function createReduce(arrayFunc, eachFunc) {
	  return function(collection, iteratee, accumulator, thisArg) {
	    var initFromArray = arguments.length < 3;
	    return (typeof iteratee == 'function' && typeof thisArg == 'undefined' && isArray(collection))
	      ? arrayFunc(collection, iteratee, accumulator, initFromArray)
	      : baseReduce(collection, baseCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
	  };
	}
	
	module.exports = createReduce;


/***/ },
/* 128 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/arrayMap.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `_.map` for arrays without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function arrayMap(array, iteratee) {
	  var index = -1,
	      length = array.length,
	      result = Array(length);
	
	  while (++index < length) {
	    result[index] = iteratee(array[index], index, array);
	  }
	  return result;
	}
	
	module.exports = arrayMap;


/***/ },
/* 129 */
/*!*****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseCallback.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseMatches = __webpack_require__(/*! ./baseMatches */ 192),
	    baseMatchesProperty = __webpack_require__(/*! ./baseMatchesProperty */ 193),
	    baseProperty = __webpack_require__(/*! ./baseProperty */ 194),
	    bindCallback = __webpack_require__(/*! ./bindCallback */ 188),
	    identity = __webpack_require__(/*! ../utility/identity */ 195);
	
	/**
	 * The base implementation of `_.callback` which supports specifying the
	 * number of arguments to provide to `func`.
	 *
	 * @private
	 * @param {*} [func=_.identity] The value to convert to a callback.
	 * @param {*} [thisArg] The `this` binding of `func`.
	 * @param {number} [argCount] The number of arguments to provide to `func`.
	 * @returns {Function} Returns the callback.
	 */
	function baseCallback(func, thisArg, argCount) {
	  var type = typeof func;
	  if (type == 'function') {
	    return typeof thisArg == 'undefined'
	      ? func
	      : bindCallback(func, thisArg, argCount);
	  }
	  if (func == null) {
	    return identity;
	  }
	  if (type == 'object') {
	    return baseMatches(func);
	  }
	  return typeof thisArg == 'undefined'
	    ? baseProperty(func + '')
	    : baseMatchesProperty(func + '', thisArg);
	}
	
	module.exports = baseCallback;


/***/ },
/* 130 */
/*!********************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/lang/isArray.js ***!
  \********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(/*! ../internal/isLength */ 122),
	    isNative = __webpack_require__(/*! ./isNative */ 132),
	    isObjectLike = __webpack_require__(/*! ../internal/isObjectLike */ 190);
	
	/** `Object#toString` result references. */
	var arrayTag = '[object Array]';
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/**
	 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;
	
	/* Native method references for those with the same name as other `lodash` methods. */
	var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;
	
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(function() { return arguments; }());
	 * // => false
	 */
	var isArray = nativeIsArray || function(value) {
	  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
	};
	
	module.exports = isArray;


/***/ },
/* 131 */
/*!************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseMap.js ***!
  \************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseEach = __webpack_require__(/*! ./baseEach */ 123);
	
	/**
	 * The base implementation of `_.map` without support for callback shorthands
	 * and `this` binding.
	 *
	 * @private
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function baseMap(collection, iteratee) {
	  var result = [];
	  baseEach(collection, function(value, key, collection) {
	    result.push(iteratee(value, key, collection));
	  });
	  return result;
	}
	
	module.exports = baseMap;


/***/ },
/* 132 */
/*!*********************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/lang/isNative.js ***!
  \*********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var escapeRegExp = __webpack_require__(/*! ../string/escapeRegExp */ 198),
	    isObjectLike = __webpack_require__(/*! ../internal/isObjectLike */ 190);
	
	/** `Object#toString` result references. */
	var funcTag = '[object Function]';
	
	/** Used to detect host constructors (Safari > 5). */
	var reHostCtor = /^\[object .+?Constructor\]$/;
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/** Used to resolve the decompiled source of functions. */
	var fnToString = Function.prototype.toString;
	
	/**
	 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;
	
	/** Used to detect if a method is native. */
	var reNative = RegExp('^' +
	  escapeRegExp(objToString)
	  .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);
	
	/**
	 * Checks if `value` is a native function.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
	 * @example
	 *
	 * _.isNative(Array.prototype.push);
	 * // => true
	 *
	 * _.isNative(_);
	 * // => false
	 */
	function isNative(value) {
	  if (value == null) {
	    return false;
	  }
	  if (objToString.call(value) == funcTag) {
	    return reNative.test(fnToString.call(value));
	  }
	  return isObjectLike(value) && reHostCtor.test(value);
	}
	
	module.exports = isNative;


/***/ },
/* 133 */
/*!***************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseForOwn.js ***!
  \***************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseFor = __webpack_require__(/*! ./baseFor */ 197),
	    keys = __webpack_require__(/*! ../object/keys */ 53);
	
	/**
	 * The base implementation of `_.forOwn` without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 */
	function baseForOwn(object, iteratee) {
	  return baseFor(object, iteratee, keys);
	}
	
	module.exports = baseForOwn;


/***/ },
/* 134 */
/*!*****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/createForOwn.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var bindCallback = __webpack_require__(/*! ./bindCallback */ 188);
	
	/**
	 * Creates a function for `_.forOwn` or `_.forOwnRight`.
	 *
	 * @private
	 * @param {Function} objectFunc The function to iterate over an object.
	 * @returns {Function} Returns the new each function.
	 */
	function createForOwn(objectFunc) {
	  return function(object, iteratee, thisArg) {
	    if (typeof iteratee != 'function' || typeof thisArg != 'undefined') {
	      iteratee = bindCallback(iteratee, thisArg, 3);
	    }
	    return objectFunc(object, iteratee);
	  };
	}
	
	module.exports = createForOwn;


/***/ },
/* 135 */
/*!******************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/createFindKey.js ***!
  \******************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseCallback = __webpack_require__(/*! ./baseCallback */ 129),
	    baseFind = __webpack_require__(/*! ./baseFind */ 202);
	
	/**
	 * Creates a `_.findKey` or `_.findLastKey` function.
	 *
	 * @private
	 * @param {Function} objectFunc The function to iterate over an object.
	 * @returns {Function} Returns the new find function.
	 */
	function createFindKey(objectFunc) {
	  return function(object, predicate, thisArg) {
	    predicate = baseCallback(predicate, thisArg, 3);
	    return baseFind(object, predicate, objectFunc, true);
	  };
	}
	
	module.exports = createFindKey;


/***/ },
/* 136 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/shimKeys.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isArguments = __webpack_require__(/*! ../lang/isArguments */ 184),
	    isArray = __webpack_require__(/*! ../lang/isArray */ 130),
	    isIndex = __webpack_require__(/*! ./isIndex */ 199),
	    isLength = __webpack_require__(/*! ./isLength */ 122),
	    keysIn = __webpack_require__(/*! ../object/keysIn */ 200),
	    support = __webpack_require__(/*! ../support */ 201);
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * A fallback implementation of `Object.keys` which creates an array of the
	 * own enumerable property names of `object`.
	 *
	 * @private
	 * @param {Object} object The object to inspect.
	 * @returns {Array} Returns the array of property names.
	 */
	function shimKeys(object) {
	  var props = keysIn(object),
	      propsLength = props.length,
	      length = propsLength && object.length;
	
	  var allowIndexes = length && isLength(length) &&
	    (isArray(object) || (support.nonEnumArgs && isArguments(object)));
	
	  var index = -1,
	      result = [];
	
	  while (++index < propsLength) {
	    var key = props[index];
	    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	module.exports = shimKeys;


/***/ },
/* 137 */,
/* 138 */,
/* 139 */,
/* 140 */,
/* 141 */,
/* 142 */,
/* 143 */,
/* 144 */,
/* 145 */,
/* 146 */,
/* 147 */,
/* 148 */,
/* 149 */,
/* 150 */,
/* 151 */,
/* 152 */,
/* 153 */,
/* 154 */,
/* 155 */,
/* 156 */,
/* 157 */,
/* 158 */,
/* 159 */,
/* 160 */,
/* 161 */,
/* 162 */,
/* 163 */,
/* 164 */,
/* 165 */,
/* 166 */,
/* 167 */,
/* 168 */,
/* 169 */,
/* 170 */,
/* 171 */,
/* 172 */,
/* 173 */,
/* 174 */,
/* 175 */,
/* 176 */,
/* 177 */,
/* 178 */,
/* 179 */,
/* 180 */
/*!*******************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/isIterateeCall.js ***!
  \*******************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isIndex = __webpack_require__(/*! ./isIndex */ 199),
	    isLength = __webpack_require__(/*! ./isLength */ 122),
	    isObject = __webpack_require__(/*! ../lang/isObject */ 57);
	
	/**
	 * Checks if the provided arguments are from an iteratee call.
	 *
	 * @private
	 * @param {*} value The potential iteratee value argument.
	 * @param {*} index The potential iteratee index or key argument.
	 * @param {*} object The potential iteratee object argument.
	 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
	 */
	function isIterateeCall(value, index, object) {
	  if (!isObject(object)) {
	    return false;
	  }
	  var type = typeof index;
	  if (type == 'number') {
	    var length = object.length,
	        prereq = isLength(length) && isIndex(index, length);
	  } else {
	    prereq = type == 'string' && index in object;
	  }
	  if (prereq) {
	    var other = object[index];
	    return value === value ? (value === other) : (other !== other);
	  }
	  return false;
	}
	
	module.exports = isIterateeCall;


/***/ },
/* 181 */
/*!****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseIndexOf.js ***!
  \****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var indexOfNaN = __webpack_require__(/*! ./indexOfNaN */ 222);
	
	/**
	 * The base implementation of `_.indexOf` without support for binary searches.
	 *
	 * @private
	 * @param {Array} array The array to search.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseIndexOf(array, value, fromIndex) {
	  if (value !== value) {
	    return indexOfNaN(array, fromIndex);
	  }
	  var index = fromIndex - 1,
	      length = array.length;
	
	  while (++index < length) {
	    if (array[index] === value) {
	      return index;
	    }
	  }
	  return -1;
	}
	
	module.exports = baseIndexOf;


/***/ },
/* 182 */
/*!*****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/cacheIndexOf.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(/*! ../lang/isObject */ 57);
	
	/**
	 * Checks if `value` is in `cache` mimicking the return signature of
	 * `_.indexOf` by returning `0` if the value is found, else `-1`.
	 *
	 * @private
	 * @param {Object} cache The cache to search.
	 * @param {*} value The value to search for.
	 * @returns {number} Returns `0` if `value` is found, else `-1`.
	 */
	function cacheIndexOf(cache, value) {
	  var data = cache.data,
	      result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];
	
	  return result ? 0 : -1;
	}
	
	module.exports = cacheIndexOf;


/***/ },
/* 183 */
/*!****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/createCache.js ***!
  \****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var SetCache = __webpack_require__(/*! ./SetCache */ 220),
	    constant = __webpack_require__(/*! ../utility/constant */ 221),
	    isNative = __webpack_require__(/*! ../lang/isNative */ 132);
	
	/** Native method references. */
	var Set = isNative(Set = global.Set) && Set;
	
	/* Native method references for those with the same name as other `lodash` methods. */
	var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate;
	
	/**
	 * Creates a `Set` cache object to optimize linear searches of large arrays.
	 *
	 * @private
	 * @param {Array} [values] The values to cache.
	 * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
	 */
	var createCache = !(nativeCreate && Set) ? constant(null) : function(values) {
	  return new SetCache(values);
	};
	
	module.exports = createCache;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 184 */
/*!************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/lang/isArguments.js ***!
  \************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(/*! ../internal/isLength */ 122),
	    isObjectLike = __webpack_require__(/*! ../internal/isObjectLike */ 190);
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]';
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/**
	 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;
	
	/**
	 * Checks if `value` is classified as an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	function isArguments(value) {
	  var length = isObjectLike(value) ? value.length : undefined;
	  return isLength(length) && objToString.call(value) == argsTag;
	}
	
	module.exports = isArguments;


/***/ },
/* 185 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseUniq.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseIndexOf = __webpack_require__(/*! ./baseIndexOf */ 181),
	    cacheIndexOf = __webpack_require__(/*! ./cacheIndexOf */ 182),
	    createCache = __webpack_require__(/*! ./createCache */ 183);
	
	/**
	 * The base implementation of `_.uniq` without support for callback shorthands
	 * and `this` binding.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} [iteratee] The function invoked per iteration.
	 * @returns {Array} Returns the new duplicate-value-free array.
	 */
	function baseUniq(array, iteratee) {
	  var index = -1,
	      indexOf = baseIndexOf,
	      length = array.length,
	      isCommon = true,
	      isLarge = isCommon && length >= 200,
	      seen = isLarge ? createCache() : null,
	      result = [];
	
	  if (seen) {
	    indexOf = cacheIndexOf;
	    isCommon = false;
	  } else {
	    isLarge = false;
	    seen = iteratee ? [] : result;
	  }
	  outer:
	  while (++index < length) {
	    var value = array[index],
	        computed = iteratee ? iteratee(value, index, array) : value;
	
	    if (isCommon && value === value) {
	      var seenIndex = seen.length;
	      while (seenIndex--) {
	        if (seen[seenIndex] === computed) {
	          continue outer;
	        }
	      }
	      if (iteratee) {
	        seen.push(computed);
	      }
	      result.push(value);
	    }
	    else if (indexOf(seen, computed, 0) < 0) {
	      if (iteratee || isLarge) {
	        seen.push(computed);
	      }
	      result.push(value);
	    }
	  }
	  return result;
	}
	
	module.exports = baseUniq;


/***/ },
/* 186 */
/*!***************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/sortedUniq.js ***!
  \***************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * An implementation of `_.uniq` optimized for sorted arrays without support
	 * for callback shorthands and `this` binding.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} [iteratee] The function invoked per iteration.
	 * @returns {Array} Returns the new duplicate-value-free array.
	 */
	function sortedUniq(array, iteratee) {
	  var seen,
	      index = -1,
	      length = array.length,
	      resIndex = -1,
	      result = [];
	
	  while (++index < length) {
	    var value = array[index],
	        computed = iteratee ? iteratee(value, index, array) : value;
	
	    if (!index || seen !== computed) {
	      seen = computed;
	      result[++resIndex] = value;
	    }
	  }
	  return result;
	}
	
	module.exports = sortedUniq;


/***/ },
/* 187 */
/*!**************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseClone.js ***!
  \**************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var arrayCopy = __webpack_require__(/*! ./arrayCopy */ 223),
	    arrayEach = __webpack_require__(/*! ./arrayEach */ 124),
	    baseCopy = __webpack_require__(/*! ./baseCopy */ 224),
	    baseForOwn = __webpack_require__(/*! ./baseForOwn */ 133),
	    initCloneArray = __webpack_require__(/*! ./initCloneArray */ 225),
	    initCloneByTag = __webpack_require__(/*! ./initCloneByTag */ 226),
	    initCloneObject = __webpack_require__(/*! ./initCloneObject */ 227),
	    isArray = __webpack_require__(/*! ../lang/isArray */ 130),
	    isObject = __webpack_require__(/*! ../lang/isObject */ 57),
	    keys = __webpack_require__(/*! ../object/keys */ 53);
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    weakMapTag = '[object WeakMap]';
	
	var arrayBufferTag = '[object ArrayBuffer]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';
	
	/** Used to identify `toStringTag` values supported by `_.clone`. */
	var cloneableTags = {};
	cloneableTags[argsTag] = cloneableTags[arrayTag] =
	cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
	cloneableTags[dateTag] = cloneableTags[float32Tag] =
	cloneableTags[float64Tag] = cloneableTags[int8Tag] =
	cloneableTags[int16Tag] = cloneableTags[int32Tag] =
	cloneableTags[numberTag] = cloneableTags[objectTag] =
	cloneableTags[regexpTag] = cloneableTags[stringTag] =
	cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
	cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
	cloneableTags[errorTag] = cloneableTags[funcTag] =
	cloneableTags[mapTag] = cloneableTags[setTag] =
	cloneableTags[weakMapTag] = false;
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/**
	 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;
	
	/**
	 * The base implementation of `_.clone` without support for argument juggling
	 * and `this` binding `customizer` functions.
	 *
	 * @private
	 * @param {*} value The value to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @param {Function} [customizer] The function to customize cloning values.
	 * @param {string} [key] The key of `value`.
	 * @param {Object} [object] The object `value` belongs to.
	 * @param {Array} [stackA=[]] Tracks traversed source objects.
	 * @param {Array} [stackB=[]] Associates clones with source counterparts.
	 * @returns {*} Returns the cloned value.
	 */
	function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
	  var result;
	  if (customizer) {
	    result = object ? customizer(value, key, object) : customizer(value);
	  }
	  if (typeof result != 'undefined') {
	    return result;
	  }
	  if (!isObject(value)) {
	    return value;
	  }
	  var isArr = isArray(value);
	  if (isArr) {
	    result = initCloneArray(value);
	    if (!isDeep) {
	      return arrayCopy(value, result);
	    }
	  } else {
	    var tag = objToString.call(value),
	        isFunc = tag == funcTag;
	
	    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
	      result = initCloneObject(isFunc ? {} : value);
	      if (!isDeep) {
	        return baseCopy(value, result, keys(value));
	      }
	    } else {
	      return cloneableTags[tag]
	        ? initCloneByTag(value, tag, isDeep)
	        : (object ? value : {});
	    }
	  }
	  // Check for circular references and return corresponding clone.
	  stackA || (stackA = []);
	  stackB || (stackB = []);
	
	  var length = stackA.length;
	  while (length--) {
	    if (stackA[length] == value) {
	      return stackB[length];
	    }
	  }
	  // Add the source value to the stack of traversed objects and associate it with its clone.
	  stackA.push(value);
	  stackB.push(result);
	
	  // Recursively populate clone (susceptible to call stack limits).
	  (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
	    result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
	  });
	  return result;
	}
	
	module.exports = baseClone;


/***/ },
/* 188 */
/*!*****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/bindCallback.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var identity = __webpack_require__(/*! ../utility/identity */ 195);
	
	/**
	 * A specialized version of `baseCallback` which only supports `this` binding
	 * and specifying the number of arguments to provide to `func`.
	 *
	 * @private
	 * @param {Function} func The function to bind.
	 * @param {*} thisArg The `this` binding of `func`.
	 * @param {number} [argCount] The number of arguments to provide to `func`.
	 * @returns {Function} Returns the callback.
	 */
	function bindCallback(func, thisArg, argCount) {
	  if (typeof func != 'function') {
	    return identity;
	  }
	  if (typeof thisArg == 'undefined') {
	    return func;
	  }
	  switch (argCount) {
	    case 1: return function(value) {
	      return func.call(thisArg, value);
	    };
	    case 3: return function(value, index, collection) {
	      return func.call(thisArg, value, index, collection);
	    };
	    case 4: return function(accumulator, value, index, collection) {
	      return func.call(thisArg, accumulator, value, index, collection);
	    };
	    case 5: return function(value, other, key, object, source) {
	      return func.call(thisArg, value, other, key, object, source);
	    };
	  }
	  return function() {
	    return func.apply(thisArg, arguments);
	  };
	}
	
	module.exports = bindCallback;


/***/ },
/* 189 */
/*!*******************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseIsFunction.js ***!
  \*******************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The base implementation of `_.isFunction` without support for environments
	 * with incorrect `typeof` results.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 */
	function baseIsFunction(value) {
	  // Avoid a Chakra JIT bug in compatibility modes of IE 11.
	  // See https://github.com/jashkenas/underscore/issues/1621 for more details.
	  return typeof value == 'function' || false;
	}
	
	module.exports = baseIsFunction;


/***/ },
/* 190 */
/*!*****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/isObjectLike.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Checks if `value` is object-like.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	
	module.exports = isObjectLike;


/***/ },
/* 191 */
/*!*******************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/createBaseEach.js ***!
  \*******************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(/*! ./isLength */ 122),
	    toObject = __webpack_require__(/*! ./toObject */ 228);
	
	/**
	 * Creates a `baseEach` or `baseEachRight` function.
	 *
	 * @private
	 * @param {Function} eachFunc The function to iterate over a collection.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new base function.
	 */
	function createBaseEach(eachFunc, fromRight) {
	  return function(collection, iteratee) {
	    var length = collection ? collection.length : 0;
	    if (!isLength(length)) {
	      return eachFunc(collection, iteratee);
	    }
	    var index = fromRight ? length : -1,
	        iterable = toObject(collection);
	
	    while ((fromRight ? index-- : ++index < length)) {
	      if (iteratee(iterable[index], index, iterable) === false) {
	        break;
	      }
	    }
	    return collection;
	  };
	}
	
	module.exports = createBaseEach;


/***/ },
/* 192 */
/*!****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseMatches.js ***!
  \****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseIsMatch = __webpack_require__(/*! ./baseIsMatch */ 229),
	    constant = __webpack_require__(/*! ../utility/constant */ 221),
	    isStrictComparable = __webpack_require__(/*! ./isStrictComparable */ 230),
	    keys = __webpack_require__(/*! ../object/keys */ 53),
	    toObject = __webpack_require__(/*! ./toObject */ 228);
	
	/**
	 * The base implementation of `_.matches` which does not clone `source`.
	 *
	 * @private
	 * @param {Object} source The object of property values to match.
	 * @returns {Function} Returns the new function.
	 */
	function baseMatches(source) {
	  var props = keys(source),
	      length = props.length;
	
	  if (!length) {
	    return constant(true);
	  }
	  if (length == 1) {
	    var key = props[0],
	        value = source[key];
	
	    if (isStrictComparable(value)) {
	      return function(object) {
	        return object != null && object[key] === value &&
	          (typeof value != 'undefined' || (key in toObject(object)));
	      };
	    }
	  }
	  var values = Array(length),
	      strictCompareFlags = Array(length);
	
	  while (length--) {
	    value = source[props[length]];
	    values[length] = value;
	    strictCompareFlags[length] = isStrictComparable(value);
	  }
	  return function(object) {
	    return object != null && baseIsMatch(toObject(object), props, values, strictCompareFlags);
	  };
	}
	
	module.exports = baseMatches;


/***/ },
/* 193 */
/*!************************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseMatchesProperty.js ***!
  \************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqual = __webpack_require__(/*! ./baseIsEqual */ 231),
	    isStrictComparable = __webpack_require__(/*! ./isStrictComparable */ 230),
	    toObject = __webpack_require__(/*! ./toObject */ 228);
	
	/**
	 * The base implementation of `_.matchesProperty` which does not coerce `key`
	 * to a string.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @param {*} value The value to compare.
	 * @returns {Function} Returns the new function.
	 */
	function baseMatchesProperty(key, value) {
	  if (isStrictComparable(value)) {
	    return function(object) {
	      return object != null && object[key] === value &&
	        (typeof value != 'undefined' || (key in toObject(object)));
	    };
	  }
	  return function(object) {
	    return object != null && baseIsEqual(value, object[key], null, true);
	  };
	}
	
	module.exports = baseMatchesProperty;


/***/ },
/* 194 */
/*!*****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseProperty.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The base implementation of `_.property` which does not coerce `key` to a string.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new function.
	 */
	function baseProperty(key) {
	  return function(object) {
	    return object == null ? undefined : object[key];
	  };
	}
	
	module.exports = baseProperty;


/***/ },
/* 195 */
/*!************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/utility/identity.js ***!
  \************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * This method returns the first argument provided to it.
	 *
	 * @static
	 * @memberOf _
	 * @category Utility
	 * @param {*} value Any value.
	 * @returns {*} Returns `value`.
	 * @example
	 *
	 * var object = { 'user': 'fred' };
	 *
	 * _.identity(object) === object;
	 * // => true
	 */
	function identity(value) {
	  return value;
	}
	
	module.exports = identity;


/***/ },
/* 196 */
/*!***************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseReduce.js ***!
  \***************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The base implementation of `_.reduce` and `_.reduceRight` without support
	 * for callback shorthands and `this` binding, which iterates over `collection`
	 * using the provided `eachFunc`.
	 *
	 * @private
	 * @param {Array|Object|string} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} accumulator The initial value.
	 * @param {boolean} initFromCollection Specify using the first or last element
	 *  of `collection` as the initial value.
	 * @param {Function} eachFunc The function to iterate over `collection`.
	 * @returns {*} Returns the accumulated value.
	 */
	function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
	  eachFunc(collection, function(value, index, collection) {
	    accumulator = initFromCollection
	      ? (initFromCollection = false, value)
	      : iteratee(accumulator, value, index, collection);
	  });
	  return accumulator;
	}
	
	module.exports = baseReduce;


/***/ },
/* 197 */
/*!************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseFor.js ***!
  \************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var createBaseFor = __webpack_require__(/*! ./createBaseFor */ 232);
	
	/**
	 * The base implementation of `baseForIn` and `baseForOwn` which iterates
	 * over `object` properties returned by `keysFunc` invoking `iteratee` for
	 * each property. Iterator functions may exit iteration early by explicitly
	 * returning `false`.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @returns {Object} Returns `object`.
	 */
	var baseFor = createBaseFor();
	
	module.exports = baseFor;


/***/ },
/* 198 */
/*!***************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/string/escapeRegExp.js ***!
  \***************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseToString = __webpack_require__(/*! ../internal/baseToString */ 240);
	
	/**
	 * Used to match `RegExp` [special characters](http://www.regular-expressions.info/characters.html#special).
	 * In addition to special characters the forward slash is escaped to allow for
	 * easier `eval` use and `Function` compilation.
	 */
	var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
	    reHasRegExpChars = RegExp(reRegExpChars.source);
	
	/**
	 * Escapes the `RegExp` special characters "\", "/", "^", "$", ".", "|", "?",
	 * "*", "+", "(", ")", "[", "]", "{" and "}" in `string`.
	 *
	 * @static
	 * @memberOf _
	 * @category String
	 * @param {string} [string=''] The string to escape.
	 * @returns {string} Returns the escaped string.
	 * @example
	 *
	 * _.escapeRegExp('[lodash](https://lodash.com/)');
	 * // => '\[lodash\]\(https:\/\/lodash\.com\/\)'
	 */
	function escapeRegExp(string) {
	  string = baseToString(string);
	  return (string && reHasRegExpChars.test(string))
	    ? string.replace(reRegExpChars, '\\$&')
	    : string;
	}
	
	module.exports = escapeRegExp;


/***/ },
/* 199 */
/*!************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/isIndex.js ***!
  \************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
	 * of an array-like value.
	 */
	var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
	
	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  value = +value;
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return value > -1 && value % 1 == 0 && value < length;
	}
	
	module.exports = isIndex;


/***/ },
/* 200 */
/*!*********************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/object/keysIn.js ***!
  \*********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isArguments = __webpack_require__(/*! ../lang/isArguments */ 184),
	    isArray = __webpack_require__(/*! ../lang/isArray */ 130),
	    isIndex = __webpack_require__(/*! ../internal/isIndex */ 199),
	    isLength = __webpack_require__(/*! ../internal/isLength */ 122),
	    isObject = __webpack_require__(/*! ../lang/isObject */ 57),
	    support = __webpack_require__(/*! ../support */ 201);
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Creates an array of the own and inherited enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to inspect.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keysIn(new Foo);
	 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	 */
	function keysIn(object) {
	  if (object == null) {
	    return [];
	  }
	  if (!isObject(object)) {
	    object = Object(object);
	  }
	  var length = object.length;
	  length = (length && isLength(length) &&
	    (isArray(object) || (support.nonEnumArgs && isArguments(object))) && length) || 0;
	
	  var Ctor = object.constructor,
	      index = -1,
	      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
	      result = Array(length),
	      skipIndexes = length > 0;
	
	  while (++index < length) {
	    result[index] = (index + '');
	  }
	  for (var key in object) {
	    if (!(skipIndexes && isIndex(key, length)) &&
	        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	module.exports = keysIn;


/***/ },
/* 201 */
/*!***************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/support.js ***!
  \***************************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/** Used to detect DOM support. */
	var document = (document = global.window) && document.document;
	
	/** Native method references. */
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;
	
	/**
	 * An object environment feature flags.
	 *
	 * @static
	 * @memberOf _
	 * @type Object
	 */
	var support = {};
	
	(function(x) {
	
	  /**
	   * Detect if functions can be decompiled by `Function#toString`
	   * (all but Firefox OS certified apps, older Opera mobile browsers, and
	   * the PlayStation 3; forced `false` for Windows 8 apps).
	   *
	   * @memberOf _.support
	   * @type boolean
	   */
	  support.funcDecomp = /\bthis\b/.test(function() { return this; });
	
	  /**
	   * Detect if `Function#name` is supported (all but IE).
	   *
	   * @memberOf _.support
	   * @type boolean
	   */
	  support.funcNames = typeof Function.name == 'string';
	
	  /**
	   * Detect if the DOM is supported.
	   *
	   * @memberOf _.support
	   * @type boolean
	   */
	  try {
	    support.dom = document.createDocumentFragment().nodeType === 11;
	  } catch(e) {
	    support.dom = false;
	  }
	
	  /**
	   * Detect if `arguments` object indexes are non-enumerable.
	   *
	   * In Firefox < 4, IE < 9, PhantomJS, and Safari < 5.1 `arguments` object
	   * indexes are non-enumerable. Chrome < 25 and Node.js < 0.11.0 treat
	   * `arguments` object indexes as non-enumerable and fail `hasOwnProperty`
	   * checks for indexes that exceed their function's formal parameters with
	   * associated values of `0`.
	   *
	   * @memberOf _.support
	   * @type boolean
	   */
	  try {
	    support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);
	  } catch(e) {
	    support.nonEnumArgs = true;
	  }
	}(0, 0));
	
	module.exports = support;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 202 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseFind.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
	 * without support for callback shorthands and `this` binding, which iterates
	 * over `collection` using the provided `eachFunc`.
	 *
	 * @private
	 * @param {Array|Object|string} collection The collection to search.
	 * @param {Function} predicate The function invoked per iteration.
	 * @param {Function} eachFunc The function to iterate over `collection`.
	 * @param {boolean} [retKey] Specify returning the key of the found element
	 *  instead of the element itself.
	 * @returns {*} Returns the found element or its key, else `undefined`.
	 */
	function baseFind(collection, predicate, eachFunc, retKey) {
	  var result;
	  eachFunc(collection, function(value, key, collection) {
	    if (predicate(value, key, collection)) {
	      result = retKey ? key : value;
	      return false;
	    }
	  });
	  return result;
	}
	
	module.exports = baseFind;


/***/ },
/* 203 */,
/* 204 */,
/* 205 */,
/* 206 */,
/* 207 */,
/* 208 */,
/* 209 */,
/* 210 */,
/* 211 */,
/* 212 */,
/* 213 */,
/* 214 */,
/* 215 */,
/* 216 */,
/* 217 */,
/* 218 */,
/* 219 */,
/* 220 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/SetCache.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var cachePush = __webpack_require__(/*! ./cachePush */ 239),
	    isNative = __webpack_require__(/*! ../lang/isNative */ 132);
	
	/** Native method references. */
	var Set = isNative(Set = global.Set) && Set;
	
	/* Native method references for those with the same name as other `lodash` methods. */
	var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate;
	
	/**
	 *
	 * Creates a cache object to store unique values.
	 *
	 * @private
	 * @param {Array} [values] The values to cache.
	 */
	function SetCache(values) {
	  var length = values ? values.length : 0;
	
	  this.data = { 'hash': nativeCreate(null), 'set': new Set };
	  while (length--) {
	    this.push(values[length]);
	  }
	}
	
	// Add functions to the `Set` cache.
	SetCache.prototype.push = cachePush;
	
	module.exports = SetCache;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 221 */
/*!************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/utility/constant.js ***!
  \************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Creates a function that returns `value`.
	 *
	 * @static
	 * @memberOf _
	 * @category Utility
	 * @param {*} value The value to return from the new function.
	 * @returns {Function} Returns the new function.
	 * @example
	 *
	 * var object = { 'user': 'fred' };
	 * var getter = _.constant(object);
	 *
	 * getter() === object;
	 * // => true
	 */
	function constant(value) {
	  return function() {
	    return value;
	  };
	}
	
	module.exports = constant;


/***/ },
/* 222 */
/*!***************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/indexOfNaN.js ***!
  \***************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Gets the index at which the first occurrence of `NaN` is found in `array`.
	 *
	 * @private
	 * @param {Array} array The array to search.
	 * @param {number} fromIndex The index to search from.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {number} Returns the index of the matched `NaN`, else `-1`.
	 */
	function indexOfNaN(array, fromIndex, fromRight) {
	  var length = array.length,
	      index = fromIndex + (fromRight ? 0 : -1);
	
	  while ((fromRight ? index-- : ++index < length)) {
	    var other = array[index];
	    if (other !== other) {
	      return index;
	    }
	  }
	  return -1;
	}
	
	module.exports = indexOfNaN;


/***/ },
/* 223 */
/*!**************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/arrayCopy.js ***!
  \**************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copies the values of `source` to `array`.
	 *
	 * @private
	 * @param {Array} source The array to copy values from.
	 * @param {Array} [array=[]] The array to copy values to.
	 * @returns {Array} Returns `array`.
	 */
	function arrayCopy(source, array) {
	  var index = -1,
	      length = source.length;
	
	  array || (array = Array(length));
	  while (++index < length) {
	    array[index] = source[index];
	  }
	  return array;
	}
	
	module.exports = arrayCopy;


/***/ },
/* 224 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseCopy.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copies the properties of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy properties from.
	 * @param {Object} [object={}] The object to copy properties to.
	 * @param {Array} props The property names to copy.
	 * @returns {Object} Returns `object`.
	 */
	function baseCopy(source, object, props) {
	  if (!props) {
	    props = object;
	    object = {};
	  }
	  var index = -1,
	      length = props.length;
	
	  while (++index < length) {
	    var key = props[index];
	    object[key] = source[key];
	  }
	  return object;
	}
	
	module.exports = baseCopy;


/***/ },
/* 225 */
/*!*******************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/initCloneArray.js ***!
  \*******************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Initializes an array clone.
	 *
	 * @private
	 * @param {Array} array The array to clone.
	 * @returns {Array} Returns the initialized clone.
	 */
	function initCloneArray(array) {
	  var length = array.length,
	      result = new array.constructor(length);
	
	  // Add array properties assigned by `RegExp#exec`.
	  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
	    result.index = array.index;
	    result.input = array.input;
	  }
	  return result;
	}
	
	module.exports = initCloneArray;


/***/ },
/* 226 */
/*!*******************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/initCloneByTag.js ***!
  \*******************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var bufferClone = __webpack_require__(/*! ./bufferClone */ 241);
	
	/** `Object#toString` result references. */
	var boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    numberTag = '[object Number]',
	    regexpTag = '[object RegExp]',
	    stringTag = '[object String]';
	
	var arrayBufferTag = '[object ArrayBuffer]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';
	
	/** Used to match `RegExp` flags from their coerced string values. */
	var reFlags = /\w*$/;
	
	/**
	 * Initializes an object clone based on its `toStringTag`.
	 *
	 * **Note:** This function only supports cloning values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @param {string} tag The `toStringTag` of the object to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneByTag(object, tag, isDeep) {
	  var Ctor = object.constructor;
	  switch (tag) {
	    case arrayBufferTag:
	      return bufferClone(object);
	
	    case boolTag:
	    case dateTag:
	      return new Ctor(+object);
	
	    case float32Tag: case float64Tag:
	    case int8Tag: case int16Tag: case int32Tag:
	    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
	      var buffer = object.buffer;
	      return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);
	
	    case numberTag:
	    case stringTag:
	      return new Ctor(object);
	
	    case regexpTag:
	      var result = new Ctor(object.source, reFlags.exec(object));
	      result.lastIndex = object.lastIndex;
	  }
	  return result;
	}
	
	module.exports = initCloneByTag;


/***/ },
/* 227 */
/*!********************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/initCloneObject.js ***!
  \********************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Initializes an object clone.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneObject(object) {
	  var Ctor = object.constructor;
	  if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
	    Ctor = Object;
	  }
	  return new Ctor;
	}
	
	module.exports = initCloneObject;


/***/ },
/* 228 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/toObject.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(/*! ../lang/isObject */ 57);
	
	/**
	 * Converts `value` to an object if it is not one.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {Object} Returns the object.
	 */
	function toObject(value) {
	  return isObject(value) ? value : Object(value);
	}
	
	module.exports = toObject;


/***/ },
/* 229 */
/*!****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseIsMatch.js ***!
  \****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqual = __webpack_require__(/*! ./baseIsEqual */ 231);
	
	/**
	 * The base implementation of `_.isMatch` without support for callback
	 * shorthands and `this` binding.
	 *
	 * @private
	 * @param {Object} object The object to inspect.
	 * @param {Array} props The source property names to match.
	 * @param {Array} values The source values to match.
	 * @param {Array} strictCompareFlags Strict comparison flags for source values.
	 * @param {Function} [customizer] The function to customize comparing objects.
	 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	 */
	function baseIsMatch(object, props, values, strictCompareFlags, customizer) {
	  var index = -1,
	      length = props.length,
	      noCustomizer = !customizer;
	
	  while (++index < length) {
	    if ((noCustomizer && strictCompareFlags[index])
	          ? values[index] !== object[props[index]]
	          : !(props[index] in object)
	        ) {
	      return false;
	    }
	  }
	  index = -1;
	  while (++index < length) {
	    var key = props[index],
	        objValue = object[key],
	        srcValue = values[index];
	
	    if (noCustomizer && strictCompareFlags[index]) {
	      var result = typeof objValue != 'undefined' || (key in object);
	    } else {
	      result = customizer ? customizer(objValue, srcValue, key) : undefined;
	      if (typeof result == 'undefined') {
	        result = baseIsEqual(srcValue, objValue, customizer, true);
	      }
	    }
	    if (!result) {
	      return false;
	    }
	  }
	  return true;
	}
	
	module.exports = baseIsMatch;


/***/ },
/* 230 */
/*!***********************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/isStrictComparable.js ***!
  \***********************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(/*! ../lang/isObject */ 57);
	
	/**
	 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` if suitable for strict
	 *  equality comparisons, else `false`.
	 */
	function isStrictComparable(value) {
	  return value === value && (value === 0 ? ((1 / value) > 0) : !isObject(value));
	}
	
	module.exports = isStrictComparable;


/***/ },
/* 231 */
/*!****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseIsEqual.js ***!
  \****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqualDeep = __webpack_require__(/*! ./baseIsEqualDeep */ 242);
	
	/**
	 * The base implementation of `_.isEqual` without support for `this` binding
	 * `customizer` functions.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {Function} [customizer] The function to customize comparing values.
	 * @param {boolean} [isLoose] Specify performing partial comparisons.
	 * @param {Array} [stackA] Tracks traversed `value` objects.
	 * @param {Array} [stackB] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 */
	function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
	  // Exit early for identical values.
	  if (value === other) {
	    // Treat `+0` vs. `-0` as not equal.
	    return value !== 0 || (1 / value == 1 / other);
	  }
	  var valType = typeof value,
	      othType = typeof other;
	
	  // Exit early for unlike primitive values.
	  if ((valType != 'function' && valType != 'object' && othType != 'function' && othType != 'object') ||
	      value == null || other == null) {
	    // Return `false` unless both values are `NaN`.
	    return value !== value && other !== other;
	  }
	  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
	}
	
	module.exports = baseIsEqual;


/***/ },
/* 232 */
/*!******************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/createBaseFor.js ***!
  \******************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var toObject = __webpack_require__(/*! ./toObject */ 228);
	
	/**
	 * Creates a base function for `_.forIn` or `_.forInRight`.
	 *
	 * @private
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new base function.
	 */
	function createBaseFor(fromRight) {
	  return function(object, iteratee, keysFunc) {
	    var iterable = toObject(object),
	        props = keysFunc(object),
	        length = props.length,
	        index = fromRight ? length : -1;
	
	    while ((fromRight ? index-- : ++index < length)) {
	      var key = props[index];
	      if (iteratee(iterable[key], key, iterable) === false) {
	        break;
	      }
	    }
	    return object;
	  };
	}
	
	module.exports = createBaseFor;


/***/ },
/* 233 */,
/* 234 */,
/* 235 */,
/* 236 */,
/* 237 */,
/* 238 */,
/* 239 */
/*!**************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/cachePush.js ***!
  \**************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(/*! ../lang/isObject */ 57);
	
	/**
	 * Adds `value` to the cache.
	 *
	 * @private
	 * @name push
	 * @memberOf SetCache
	 * @param {*} value The value to cache.
	 */
	function cachePush(value) {
	  var data = this.data;
	  if (typeof value == 'string' || isObject(value)) {
	    data.set.add(value);
	  } else {
	    data.hash[value] = true;
	  }
	}
	
	module.exports = cachePush;


/***/ },
/* 240 */
/*!*****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseToString.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Converts `value` to a string if it is not one. An empty string is returned
	 * for `null` or `undefined` values.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	  if (typeof value == 'string') {
	    return value;
	  }
	  return value == null ? '' : (value + '');
	}
	
	module.exports = baseToString;


/***/ },
/* 241 */
/*!****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/bufferClone.js ***!
  \****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var constant = __webpack_require__(/*! ../utility/constant */ 221),
	    isNative = __webpack_require__(/*! ../lang/isNative */ 132);
	
	/** Native method references. */
	var ArrayBuffer = isNative(ArrayBuffer = global.ArrayBuffer) && ArrayBuffer,
	    bufferSlice = isNative(bufferSlice = ArrayBuffer && new ArrayBuffer(0).slice) && bufferSlice,
	    floor = Math.floor,
	    Uint8Array = isNative(Uint8Array = global.Uint8Array) && Uint8Array;
	
	/** Used to clone array buffers. */
	var Float64Array = (function() {
	  // Safari 5 errors when using an array buffer to initialize a typed array
	  // where the array buffer's `byteLength` is not a multiple of the typed
	  // array's `BYTES_PER_ELEMENT`.
	  try {
	    var func = isNative(func = global.Float64Array) && func,
	        result = new func(new ArrayBuffer(10), 0, 1) && func;
	  } catch(e) {}
	  return result;
	}());
	
	/** Used as the size, in bytes, of each `Float64Array` element. */
	var FLOAT64_BYTES_PER_ELEMENT = Float64Array ? Float64Array.BYTES_PER_ELEMENT : 0;
	
	/**
	 * Creates a clone of the given array buffer.
	 *
	 * @private
	 * @param {ArrayBuffer} buffer The array buffer to clone.
	 * @returns {ArrayBuffer} Returns the cloned array buffer.
	 */
	function bufferClone(buffer) {
	  return bufferSlice.call(buffer, 0);
	}
	if (!bufferSlice) {
	  // PhantomJS has `ArrayBuffer` and `Uint8Array` but not `Float64Array`.
	  bufferClone = !(ArrayBuffer && Uint8Array) ? constant(null) : function(buffer) {
	    var byteLength = buffer.byteLength,
	        floatLength = Float64Array ? floor(byteLength / FLOAT64_BYTES_PER_ELEMENT) : 0,
	        offset = floatLength * FLOAT64_BYTES_PER_ELEMENT,
	        result = new ArrayBuffer(byteLength);
	
	    if (floatLength) {
	      var view = new Float64Array(result, 0, floatLength);
	      view.set(new Float64Array(buffer, 0, floatLength));
	    }
	    if (byteLength != offset) {
	      view = new Uint8Array(result, offset);
	      view.set(new Uint8Array(buffer, offset));
	    }
	    return result;
	  };
	}
	
	module.exports = bufferClone;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 242 */
/*!********************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/baseIsEqualDeep.js ***!
  \********************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var equalArrays = __webpack_require__(/*! ./equalArrays */ 244),
	    equalByTag = __webpack_require__(/*! ./equalByTag */ 245),
	    equalObjects = __webpack_require__(/*! ./equalObjects */ 246),
	    isArray = __webpack_require__(/*! ../lang/isArray */ 130),
	    isTypedArray = __webpack_require__(/*! ../lang/isTypedArray */ 247);
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    funcTag = '[object Function]',
	    objectTag = '[object Object]';
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;
	
	/**
	 * A specialized version of `baseIsEqual` for arrays and objects which performs
	 * deep comparisons and tracks traversed objects enabling objects with circular
	 * references to be compared.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} [customizer] The function to customize comparing objects.
	 * @param {boolean} [isLoose] Specify performing partial comparisons.
	 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
	 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
	  var objIsArr = isArray(object),
	      othIsArr = isArray(other),
	      objTag = arrayTag,
	      othTag = arrayTag;
	
	  if (!objIsArr) {
	    objTag = objToString.call(object);
	    if (objTag == argsTag) {
	      objTag = objectTag;
	    } else if (objTag != objectTag) {
	      objIsArr = isTypedArray(object);
	    }
	  }
	  if (!othIsArr) {
	    othTag = objToString.call(other);
	    if (othTag == argsTag) {
	      othTag = objectTag;
	    } else if (othTag != objectTag) {
	      othIsArr = isTypedArray(other);
	    }
	  }
	  var objIsObj = (objTag == objectTag || (isLoose && objTag == funcTag)),
	      othIsObj = (othTag == objectTag || (isLoose && othTag == funcTag)),
	      isSameTag = objTag == othTag;
	
	  if (isSameTag && !(objIsArr || objIsObj)) {
	    return equalByTag(object, other, objTag);
	  }
	  if (isLoose) {
	    if (!isSameTag && !(objIsObj && othIsObj)) {
	      return false;
	    }
	  } else {
	    var valWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
	        othWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');
	
	    if (valWrapped || othWrapped) {
	      return equalFunc(valWrapped ? object.value() : object, othWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
	    }
	    if (!isSameTag) {
	      return false;
	    }
	  }
	  // Assume cyclic values are equal.
	  // For more information on detecting circular references see https://es5.github.io/#JO.
	  stackA || (stackA = []);
	  stackB || (stackB = []);
	
	  var length = stackA.length;
	  while (length--) {
	    if (stackA[length] == object) {
	      return stackB[length] == other;
	    }
	  }
	  // Add `object` and `other` to the stack of traversed objects.
	  stackA.push(object);
	  stackB.push(other);
	
	  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);
	
	  stackA.pop();
	  stackB.pop();
	
	  return result;
	}
	
	module.exports = baseIsEqualDeep;


/***/ },
/* 243 */,
/* 244 */
/*!****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/equalArrays.js ***!
  \****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A specialized version of `baseIsEqualDeep` for arrays with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Array} array The array to compare.
	 * @param {Array} other The other array to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} [customizer] The function to customize comparing arrays.
	 * @param {boolean} [isLoose] Specify performing partial comparisons.
	 * @param {Array} [stackA] Tracks traversed `value` objects.
	 * @param {Array} [stackB] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	 */
	function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
	  var index = -1,
	      arrLength = array.length,
	      othLength = other.length,
	      result = true;
	
	  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
	    return false;
	  }
	  // Deep compare the contents, ignoring non-numeric properties.
	  while (result && ++index < arrLength) {
	    var arrValue = array[index],
	        othValue = other[index];
	
	    result = undefined;
	    if (customizer) {
	      result = isLoose
	        ? customizer(othValue, arrValue, index)
	        : customizer(arrValue, othValue, index);
	    }
	    if (typeof result == 'undefined') {
	      // Recursively compare arrays (susceptible to call stack limits).
	      if (isLoose) {
	        var othIndex = othLength;
	        while (othIndex--) {
	          othValue = other[othIndex];
	          result = (arrValue && arrValue === othValue) || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
	          if (result) {
	            break;
	          }
	        }
	      } else {
	        result = (arrValue && arrValue === othValue) || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
	      }
	    }
	  }
	  return !!result;
	}
	
	module.exports = equalArrays;


/***/ },
/* 245 */
/*!***************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/equalByTag.js ***!
  \***************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/** `Object#toString` result references. */
	var boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    numberTag = '[object Number]',
	    regexpTag = '[object RegExp]',
	    stringTag = '[object String]';
	
	/**
	 * A specialized version of `baseIsEqualDeep` for comparing objects of
	 * the same `toStringTag`.
	 *
	 * **Note:** This function only supports comparing values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} value The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {string} tag The `toStringTag` of the objects to compare.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalByTag(object, other, tag) {
	  switch (tag) {
	    case boolTag:
	    case dateTag:
	      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
	      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
	      return +object == +other;
	
	    case errorTag:
	      return object.name == other.name && object.message == other.message;
	
	    case numberTag:
	      // Treat `NaN` vs. `NaN` as equal.
	      return (object != +object)
	        ? other != +other
	        // But, treat `-0` vs. `+0` as not equal.
	        : (object == 0 ? ((1 / object) == (1 / other)) : object == +other);
	
	    case regexpTag:
	    case stringTag:
	      // Coerce regexes to strings and treat strings primitives and string
	      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
	      return object == (other + '');
	  }
	  return false;
	}
	
	module.exports = equalByTag;


/***/ },
/* 246 */
/*!*****************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/internal/equalObjects.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var keys = __webpack_require__(/*! ../object/keys */ 53);
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * A specialized version of `baseIsEqualDeep` for objects with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} [customizer] The function to customize comparing values.
	 * @param {boolean} [isLoose] Specify performing partial comparisons.
	 * @param {Array} [stackA] Tracks traversed `value` objects.
	 * @param {Array} [stackB] Tracks traversed `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
	  var objProps = keys(object),
	      objLength = objProps.length,
	      othProps = keys(other),
	      othLength = othProps.length;
	
	  if (objLength != othLength && !isLoose) {
	    return false;
	  }
	  var skipCtor = isLoose,
	      index = -1;
	
	  while (++index < objLength) {
	    var key = objProps[index],
	        result = isLoose ? key in other : hasOwnProperty.call(other, key);
	
	    if (result) {
	      var objValue = object[key],
	          othValue = other[key];
	
	      result = undefined;
	      if (customizer) {
	        result = isLoose
	          ? customizer(othValue, objValue, key)
	          : customizer(objValue, othValue, key);
	      }
	      if (typeof result == 'undefined') {
	        // Recursively compare objects (susceptible to call stack limits).
	        result = (objValue && objValue === othValue) || equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB);
	      }
	    }
	    if (!result) {
	      return false;
	    }
	    skipCtor || (skipCtor = key == 'constructor');
	  }
	  if (!skipCtor) {
	    var objCtor = object.constructor,
	        othCtor = other.constructor;
	
	    // Non `Object` object instances with different constructors are not equal.
	    if (objCtor != othCtor &&
	        ('constructor' in object && 'constructor' in other) &&
	        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
	          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
	      return false;
	    }
	  }
	  return true;
	}
	
	module.exports = equalObjects;


/***/ },
/* 247 */
/*!*************************************************************!*\
  !*** ./~/fluxxor/~/lodash-node/modern/lang/isTypedArray.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var isLength = __webpack_require__(/*! ../internal/isLength */ 122),
	    isObjectLike = __webpack_require__(/*! ../internal/isObjectLike */ 190);
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    weakMapTag = '[object WeakMap]';
	
	var arrayBufferTag = '[object ArrayBuffer]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';
	
	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	typedArrayTags[dateTag] = typedArrayTags[errorTag] =
	typedArrayTags[funcTag] = typedArrayTags[mapTag] =
	typedArrayTags[numberTag] = typedArrayTags[objectTag] =
	typedArrayTags[regexpTag] = typedArrayTags[setTag] =
	typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/**
	 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;
	
	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	function isTypedArray(value) {
	  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
	}
	
	module.exports = isTypedArray;


/***/ }
/******/ ]);
//# sourceMappingURL=bgHelper.bundle.js.map