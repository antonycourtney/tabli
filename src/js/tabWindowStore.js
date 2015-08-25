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
      constants.CHROME_WINDOW_CREATED, this.onChromeWindowCreated,
      constants.CHROME_WINDOW_REMOVED, this.onChromeWindowRemoved,
      constants.CHROME_WINDOW_FOCUS_CHANGED, this.onChromeWindowFocusChanged,
      constants.CHROME_TAB_CREATED, this.onChromeTabCreated,
      constants.CHROME_TAB_REMOVED, this.onChromeTabRemoved,
      constants.CHROME_TAB_UPDATED, this.onChromeTabUpdated,
      constants.CHROME_TAB_ACTIVATED, this.onChromeTabActivated             
/*      
      constants.CHROME_TAB_MOVED, this.onChromeTabMoved,
      constants.CHROME_TAB_DETACHED, this.onChromeTabDetached,
      constants.CHROME_TAB_ATTACHED, this.onChromeTabAttached,
  */

      );
  },

  resetState: function() {
    this.windowIdMap = {};
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
    this.tabWindows.push( tabWindow );     
  },

  clearWindowIdMapEntry: function(tabWindow) {
    console.log("clearWindowIdMapEntry: ", tabWindow);
    var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
    if (windowId) 
      delete this.windowIdMap[ windowId ];
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
    this.clearWindowIdMapEntry(tabWindow);
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

  handleChromeWindowCreated: function(chromeWindow) {
    this.syncChromeWindow(chromeWindow);
  },

  handleChromeWindowRemoved: function(windowId) {
    console.log("handleChromeWindowRemoved: ", windowId);
    var tabWindow = this.windowIdMap[windowId];
    if( !tabWindow ) {
      console.warn("window id not found -- ignoring");
    } else {
      if (!(tabWindow.isManaged())) { 
        // unmanaged windiw -- just remove
        this.removeTabWindow(tabWindow);
      } else {
        // managed window -- mark as closed and dissociate chrome window
        tabWindow.open = false;
        tabWindow.chromeWindow = null;
        this.clearWindowIdMapEntry(tabWindow);
      }      
    }
  },

  handleChromeWindowFocusChanged: function(windowId) {
    /* TODO / FIXME: more efficient rep for focused window */
    for ( var i = 0; i < this.tabWindows.length; i++ ) {
      var tabWindow = this.tabWindows[ i ];
      if( tabWindow ) {
        tabWindow._focused = false;
      }
    }
    if (windowId != chrome.windows.WINDOW_ID_NONE) {
      var tabWindow = this.windowIdMap[windowId];
      if (!tabWindow) {
        console.warn("Got focus event for unknown window id ", windowId );
        return;
      } 
      tabWindow._focused = true;
    }
  },

  handleChromeTabActivated: function(tabId,windowId) {
    var tabWindow = this.windowIdMap[windowId];
    if( !tabWindow ) {
      console.warn("window id not found -- ignoring");
    } else {
      var tabs = tabWindow.chromeWindow.tabs;
      if (tabs) {
        for (var i = 0; i < tabs.length; i++) {
          var tab = tabs[i];
          tab.active = (tab.id==tabId);
        }
      }  
    }    
  },


  handleChromeTabCreated: function(tab) {
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
        tabWindow.chromeWindow.tabs.splice(tab.index,0,tab);
      }
    }
  },

  handleChromeTabRemoved: function(tabId,removeInfo) {
    if (removeInfo.isWindowClosing) {
      console.log("handleChromeTabRemoved: window closing, ignoring...");
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

  handleChromeTabUpdated: function(tabId,changeInfo,tab) {
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
    if (focusedWindow) {
      var currentTabWindow = this.windowIdMap[focusedWindow.id];
      if (currentTabWindow) {
        currentTabWindow._focused = true;
      } else {
        console.log("syncWindowList: last focused window id ", focusedWindow.id, " not found -- ignoring");
      }
    } else {
      console.log("syncWindowList: focusedWindow undefined -- ignoring");
    }
    console.log("syncWindowList: complete");
    this.emit("change");
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

  onAttachChromeWindow: function(payload) {
    this.attachChromeWindow(payload.tabWindow,payload.chromeWindow);
    this.emit("change");
  },

  onSyncWindowList: function(payload) {
    console.log("onSyncWindowList: ", payload);
    this.syncWindowList(payload.windowList,payload.focusedWindow);
    this.emit("change");
  },

  onChromeWindowCreated: function(payload) {
    this.handleChromeWindowCreated(payload.chromeWindow);
    this.emit("change");
  },

  onChromeWindowRemoved: function(payload) {
    this.handleChromeWindowRemoved(payload.windowId);
    this.emit("change");
  },

  onChromeWindowFocusChanged: function(payload) {
    this.handleChromeWindowFocusChanged(payload.windowId);
    this.emit("change");
  },

  onChromeTabCreated: function(payload) {
    console.log("onChromeTabCreated: ", payload);
    this.handleChromeTabCreated(payload.tab);
    this.emit("change");
  },

  onChromeTabRemoved: function(payload) {
    this.handleChromeTabRemoved(payload.tabId,payload.removeInfo);
    this.emit("change");
  },

  onChromeTabUpdated: function(payload) {
    this.handleChromeTabUpdated(payload.tabId,payload.changeInfo,payload.tab);
    this.emit("change");
  },

  onChromeTabActivated: function(payload) {
    this.handleChromeTabActivated(payload.tabId,payload.windowId);
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
