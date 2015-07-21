/*
 * A Flux store for TabWindows
 */
'use strict';
var Fluxxor = require('fluxxor');
var _ = require('underscore');
var constants = require('./constants.js');
var TabWindow = require('./tabWindow.js');

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
      console.log( "syncWindowList: new window id: ", chromeWindow.id );
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
    console.log("syncWindowList: windows: ", chromeWindowList);
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
    console.log("Flux store - this.tabWindows.getAll: ", this.tabWindows);
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

  console.log("TabWindowStore.init: actions: ", actions);
  var flux = new Fluxxor.Flux(stores, actions);
  console.log("TabWindowStore.init: flux: ", flux);
  var winStore = stores.TabWindowStore;
  flux.on("dispatch", function(type, payload) {
      if (console && console.log) {
          console.log("[Dispatch]", type, payload);
      }
  });
  return {
    flux: flux,
    winStore: winStore
  };
}

module.exports.init = init;