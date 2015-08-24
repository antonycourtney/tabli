/*
 * A Flux store for TabWindows
 */
'use strict';

import * as Fluxxor from 'fluxxor';
import * as React from 'react';
import * as _ from 'underscore';
import * as constants from './constants';
import * as TabWindow from './tabWindow';

/*
 * find the index of a tab in a ChromeWindow by its tab Id
 *
 * just dumb linear search for now
 */
function findTabIndex(chromeWindow,targetTabId) {
  for (var i = 0; i < chromeWindow.tabs.length; i++) {
    var tab = chromeWindow.tabs[i];
    if (tab.id == targetTabId)
      return i;
  }
  return null;
} 


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
      constants.REPLACE_WINDOW_STATE, this.onReplaceWindowState,
      constants.SYNC_CHROME_WINDOW, this.onSyncChromeWindow,
      constants.REMOVE_CHROME_WINDOW, this.onRemoveChromeWindow,
      constants.TAB_CREATED, this.onTabCreated,
      constants.TAB_REMOVED, this.onTabRemoved,
      constants.TAB_UPDATED, this.onTabUpdated             
/*      
      constants.TAB_MOVED, this.onTabMoved,
      constants.TAB_DETACHED, this.onTabDetached,
      constants.TAB_ATTACHED, this.onTabAttached,
      constants.TAB_ACTIVATED, this.onTabActivated
  */

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

  removeChromeWindow: function(windowId) {
    console.log("removeChromeWindow: ", windowId);
    var tabWindow = this.windowIdMap[windowId];
    if( !tabWindow ) {
      console.warn("window id not found -- ignoring");
    } else {
      this.removeTabWindow(tabWindow);      
    }
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
    console.log("attachChromeWindow: ", tabWindow, chromeWindow);
    // Was this Chrome window id previously associated with some other tab window?
    var oldTabWindow = this.windowIdMap[chromeWindow.id];
    if (oldTabWindow) {
      console.log("found previous tab window -- detaching");
      console.log("oldTabWindow: ", oldTabWindow);
      this.removeTabWindow(oldTabWindow);
    }
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
      // console.log( "syncChromeWindow: new window id: ", chromeWindow.id );
      tabWindow = TabWindow.makeChromeTabWindow( chromeWindow );
      this.addTabWindow(tabWindow);
    } else {
      console.warn( "syncChromeWindow: cache hit for window id: ", chromeWindow.id );
      // Set chromeWindow to current snapshot of tab contents:
      tabWindow.chromeWindow = chromeWindow;
      tabWindow.open = true;
    }
  },

  handleTabCreated: function(tab) {
    var tabWindow = this.windowIdMap[tab.windowId];
    if (!tabWindow) {
      console.warn("Got tab created event for unknown window ", tab);
    } else {
      console.log("handleTabCreated: ", tabWindow, tab);
      if (!tabWindow.chromeWindow) {
        console.warn("got tab created for bad chromeWindow");
      }
      if (!tabWindow.chromeWindow.tabs) {
        console.warn("first tab in chrome window; initializing...");
        tabWindow.chromeWindow.tabs = [tab];
      } else {
        // append this tab onto tabs at index: 
        tabWindow.chromeWindow.tabs.splice(tab.index,0,tab);
      }
    }
  },

  handleTabRemoved: function(tabId,removeInfo) {
    if (removeInfo.isWindowClosing) {
      console.log("handleTabRemoved: window closing, ignoring...");
      // Window is closing, ignore...
      return;
    }
    var tabWindow = this.windowIdMap[removeInfo.windowId];
    if (!tabWindow) {
      console.warn("Got tab removed event for unknown window ", tabId, removeInfo);
    } else {
      var chromeWindow = tabWindow.chromeWindow;

      var tabIndex = findTabIndex(tabWindow.chromeWindow, tabId);
      if (tabIndex!=null) {
        tabWindow.chromeWindow.tabs.splice(tabIndex,1);
      }
    }
  },

  handleTabUpdated: function(tabId,changeInfo,tab) {
    console.log("handleTabUpdated: ", tabId, changeInfo, tab);
    var tabWindow = this.windowIdMap[tab.windowId];
    if (!tabWindow) {
      console.warn("Got tab updated event for unknown window ", tab);
      return;
    } 
    console.log("handleTabUpdated: ", tabWindow, tab);
    if (!tabWindow.chromeWindow) {
      console.warn("got tab Updated for bad chromeWindow");
    }
    if (!tabWindow.chromeWindow.tabs) {
      console.warn("No tabs in chrome Window; dropping update...");
      tabWindow.chromeWindow.tabs = [tab];
    } else {
      /* we should be able to trust tab.index, but this seems safer... */
      var tabIndex = findTabIndex(tabWindow.chromeWindow, tabId);
      if (tabIndex==null) {
        console.warn("Got tab update for unknown tab: ", tabId, tab);
        return;
      }
      tabWindow.chromeWindow.tabs[tabIndex] = tab;
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

    /*
     * TODO / FIXME: A _focused flag on each window is wrong rep
     * for an event-driven implementation
     */

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
      self.emit("change");
    });
  },

  onAddTabWindows: function(payload) {
    _.each(payload.tabWindows, this.addTabWindow);
    this.emit("change");
  },

  onReplaceWindowState: function(payload) {
    // clear all state and then add tab windows from payload
    this.resetState();
    this.onAddTabWindows(payload);
  },

  onCloseTabWindow: function(payload) {
    var self = this;
    this.closeTabWindow(payload.tabWindow, function () {
        self.emit("change");      
      });
  },

  onRevertTabWindow: function(payload) {
    var self = this;
    this.revertTabWindow(payload.tabWindow, function () {
        self.emit("change");      
      });
  },

  onRemoveTabWindow: function(payload) {
    this.removeTabWindow(payload.tabWindow);
    this.emit("change");
  },

  onRemoveChromeWindow: function(payload) {
    this.removeChromeWindow(payload.windowId);
    this.emit("change");
  },

  onSyncChromeWindow: function(payload) {
    this.syncChromeWindow(payload.chromeWindow);
    this.emit("change");
  },

  onAttachChromeWindow: function(payload) {
    this.attachChromeWindow(payload.tabWindow,payload.chromeWindow);
    this.emit("change");
  },

  onSyncWindowList: function(payload) {
    console.log("onSyncWindowList: ", payload);
    this.syncWindowList(payload.windowList,payload.focusedWindow);
    this.emit("change");
  },

  onTabCreated: function(payload) {
    console.log("onTabCreated: ", payload);
    this.handleTabCreated(payload.tab);
    this.emit("change");
  },

  onTabRemoved: function(payload) {
    this.handleTabRemoved(payload.tabId,payload.removeInfo);
    this.emit("change");
  },

  onTabUpdated: function(payload) {
    this.handleTabUpdated(payload.tabId,payload.changeInfo,payload.tab);
    this.emit("change");
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
export function init(actions) {
  var stores = {
    TabWindowStore: new TabWindowStore()
  };

  var flux = new Fluxxor.Flux(stores, actions);
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
