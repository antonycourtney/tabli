/*
 * A Flux store for TabWindows
 */
'use strict';
var Fluxxor = require('fluxxor');
var constants = require('./constants.js');

var TabWindow = require('./tabWindow.js');

var windowIdMap = {};
var tabWindows = [];

var bgw = chrome.extension.getBackgroundPage();

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

function restoreBookmarkWindow( tabWindow, callback ) {
  chrome.windows.getLastFocused( {populate: true }, function (currentChromeWindow) {
    var urls = [];
    var tabs = tabWindow.getTabItems();
    var urls = tabs.map( function (item) { return item.url; } );
    function cf( chromeWindow ) {
      console.log("restoreBookmarkWindow: cf");
      attachChromeWindow(tabWindow,chromeWindow);
      if ( callback ) {
        console.log("restoreBookmarkWindow: invoking callback");
        callback();  
      }
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
      };
      // And now invoke cf with this chrome window:
      cf( currentChromeWindow );        
    } else {
      // normal case -- create a new window for these urls:
      chrome.windows.create( { url: urls, focused: true, type: 'normal'}, cf );
    }
  });
}

function openTabWindow(tabWindow,callback) {
  var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
  if (tabWindow.open) {
    // existing window -- just transfer focus
    chrome.windows.update( windowId, { focused: true }, callback );
  } else {
    // bookmarked window -- need to open it!
    restoreBookmarkWindow( tabWindow, callback );      
  }    
}

function activateTab(tabWindow,tab,tabIndex,callback) {
  console.log("activateTab: ", tabWindow, tab );
  if( tabWindow.open ) {
    // OK, so we know this window is open.  What about the specific tab?
    if (tab.open) { 
      // Tab is already open, just make it active:
      console.log("making tab active");
      chrome.tabs.update( tab.id, { active: true }, function () {
        console.log("making tab's window active");
        chrome.windows.update( tabWindow.chromeWindow.id, { focused: true }, callback);
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
    openTabWindow( tabWindow, function() {
      console.log("activateTab: window open complete.");
      // TODO: should really attempt to activate chosen tab
      callback();
    });
  }        
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
function syncWindowList( chromeWindowList ) {
  // To GC any closed windows:
  for ( var i = 0; i < tabWindows.length; i++ ) {
    var tabWindow = tabWindows[ i ];
    if( tabWindow )
      tabWindow.open = false;
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
  console.log("syncWindowList: complete");
}   

var TabWindowStore = Fluxxor.createStore({
  initialize: function() {
    this.bindActions(
      constants.ADD_TAB_WINDOW, this.onAddTabWindow,
      constants.CLOSE_TAB_WINDOW, this.onCloseTabWindow,
      constants.OPEN_TAB_WINDOW, this.onOpenTabWindow,
      constants.REMOVE_TAB_WINDOW, this.onRemoveTabWindow,
      constants.ATTACH_CHROME_WINDOW, this.onAttachChromeWindow,
      constants.REVERT_TAB_WINDOW, this.onRevertTabWindow,
      constants.ACTIVATE_TAB, this.onActivateTab,
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

  onOpenTabWindow: function(payload) {
    var self = this;
    openTabWindow(payload.tabWindow, function () {
      console.log("openTabWindow: complete");
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

  onActivateTab: function(payload) {
    var self = this;
    activateTab(payload.tabWindow,payload.tab,payload.tabIndex,function() {
      self.emit("change");
    });
  },

  onSyncWindowList: function(payload) {
    syncWindowList(payload.windowList);
    this.emit("change");
  },

  getAll: function() {
    return tabWindows;
  },

  // returns a tabWindow or undefined
  getTabWindowByChromeId: function(chromeId) {
    return windowIdMap[chromeId];
  }
});

module.exports = TabWindowStore;