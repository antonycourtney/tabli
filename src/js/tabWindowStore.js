/*
 * A Flux store for TabWindows
 */
'use strict';
var Fluxxor = require('fluxxor');
var constants = require('./constants.js');

var TabWindow = require('./tabWindow.js');

var windowIdMap = {};
var tabWindows = [];

/*
 * add a new Tab window to global maps:
 */
function addTabWindow( tabWindow ) {
  var chromeWindow = tabWindow.chromeWindow;
  if( chromeWindow ) {
    windowIdMap[ chromeWindow.id ] = tabWindow;
  }
  tabWindows.push( tabWindow );     
}

function clearMapEntry(tabWindow) {
  console.log("clearMapEntry: ", tabWindow);
  var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
  if ( windowId ) 
    delete windowIdMap[ windowId ];  
}

function removeTabWindow(tabWindow) {
  console.log("removeTabWindow: ", tabWindow);
  // could keep an inverse map instead of doing a linear search...
  for (var i = 0; i < tabWindows.length; i++) {
    if (tabWindows[i]===tabWindow)
      break;
  }
  if (i < tabWindows.length) {
    delete tabWindows[ i ];
  } else {
    console.log("removeTabWindow: request to remove window not in collection", tabWindow);
  }
  clearMapEntry(tabWindow);
}

function closeTabWindow(tabWindow, cb) {
  console.log("store closeTabWindow: ", tabWindow);
  if (!tabWindow.isManaged()) {
    console.log("unmanaged window -- removing");
    removeTabWindow(tabWindow);
  } else {
    clearMapEntry(tabWindow);
  }
  cb();      
}

function revertTabWindow( tabWindow, callback ) {
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
}

function attachChromeWindow(tabWindow,chromeWindow) {
  tabWindow.chromeWindow = chromeWindow;
  tabWindow.open = true;
  windowIdMap[ chromeWindow.id ] = tabWindow;
}

/**
 * synchronize windows from chrome.windows.getAll with internal map of
 * managed and unmanaged tab windows
 */
function syncWindowList( chromeWindowList, currentWindow ) {
  console.log("syncWindowList: windows: ", chromeWindowList);
  // To GC any closed windows:
  for ( var i = 0; i < tabWindows.length; i++ ) {
    var tabWindow = tabWindows[ i ];
    if( tabWindow ) {
      tabWindow.open = false;
      tabWindow._current = false;
    }
  }
  for ( var i = 0; i < chromeWindowList.length; i++ ) {
    var chromeWindow = chromeWindowList[ i ];
    var tabWindow = windowIdMap[chromeWindow.id];
    if( !tabWindow ) {
      console.log( "syncWindowList: new window id: ", chromeWindow.id );
      tabWindow = TabWindow.makeChromeTabWindow( chromeWindow );
      addTabWindow(tabWindow);
    } else {
      // console.log( "syncWindowList: cache hit for id: ", chromeWindow.id );
      // Set chromeWindow to current snapshot of tab contents:
      tabWindow.chromeWindow = chromeWindow;
      tabWindow.open = true;
    }
  }
  // GC any closed, unmanaged windows:
  for ( var i = 0; i < tabWindows.length; i++ ) {
    tabWindow = tabWindows[ i ];
    if( tabWindow && !( tabWindow._managed ) && !( tabWindow.open ) ) {
      console.log( "syncWindowList: detected closed window: ", tabWindow );
      removeTabWindow(tabWindow);
    }
  }
  // mark current window:
  var currentTabWindow = windowIdMap[currentWindow.id];
  currentTabWindow._current = true;

  console.log("syncWindowList: complete");
}   

var TabWindowStore = Fluxxor.createStore({
  initialize: function() {
    this.bindActions(
      constants.ADD_TAB_WINDOW, this.onAddTabWindow,
      constants.CLOSE_TAB_WINDOW, this.onCloseTabWindow,
      constants.REMOVE_TAB_WINDOW, this.onRemoveTabWindow,
      constants.ATTACH_CHROME_WINDOW, this.onAttachChromeWindow,
      constants.REVERT_TAB_WINDOW, this.onRevertTabWindow,
      constants.SYNC_WINDOW_LIST, this.onSyncWindowList
      );
  },

  onCloseTab: function(payload) {
    var self = this;
    console.log("onCloseTab: closing tab...");
    closeTab(payload.tab,function() {
      console.log("onCloseTab: close complete...");
      self.emit("change");
    });
  },

  onAddTabWindow: function(payload) {
    addTabWindow(payload.tabWindow);
    this.emit("change");
  },

  onCloseTabWindow: function(payload) {
    var self = this;
    closeTabWindow(payload.tabWindow, function () {
        self.emit("change");      
      });
  },

  onRevertTabWindow: function(payload) {
    var self = this;
    revertTabWindow(payload.tabWindow, function () {
        self.emit("change");      
      });
  },

  onRemoveTabWindow: function(payload) {
    removeTabWindow(payload.tabWindow);
    this.emit("change");
  },

  onAttachChromeWindow: function(payload) {
    attachChromeWindow(payload.tabWindow,payload.chromeWindow);
    this.emit("change");
  },

  onSyncWindowList: function(payload) {
    console.log("onSyncWindowList: ", payload);
    syncWindowList(payload.windowList,payload.currentWindow);
    this.emit("change");
  },

  getAll: function() {
    console.log("Flux store - tabWindows.getAll: ", tabWindows);
    return tabWindows.slice();
  },

  // returns a tabWindow or undefined
  getTabWindowByChromeId: function(chromeId) {
    return windowIdMap[chromeId];
  }
});

module.exports = TabWindowStore;