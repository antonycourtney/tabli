/**
 * long-lived application state for Subjective tab manager
 *
 * We'll instantiate and initialize this in the bgHelper and attach it to the background window,
 * and then retrieve the instance from the background window in the popup
 */
'use strict';

import * as _ from 'underscore';
import * as TabWindow from './tabWindow';
import EventEmitter from 'events';

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
function findTabId(tabWindows,targetTabId) {
  for (var i = 0; i < tabWindows.length; i++) {
    var tabWindow = tabWindows[i];
    if (tabWindow && tabWindow.open) {
      var targetIdx = findTabIndex(tabWindow.chromeWindow,targetTabId);
      if (targetIdx != null)
        return [tabWindow, targetIdx];
    }
  }
  return [];
}

export default class TabWindowStore extends EventEmitter {

  constructor(folderId,archiveFolderId) {
    super();
    this.windowIdMap = {};  // maps from chrome window id for open windows
    this.bookmarkIdMap = {};
    this.notifyCallback = null;
    this.folderId = folderId;
    this.archiveFolderId = archiveFolderId;
  }

  /*
   * add a new Tab window to global maps:
   */
  addTabWindow(tabWindow) {
    var chromeWindow = tabWindow.chromeWindow;
    if (chromeWindow) {
      this.windowIdMap[ chromeWindow.id ] = tabWindow;
    }
    if (tabWindow.bookmarkFolder) {
      this.bookmarkIdMap[ tabWindow.bookmarkFolder.id ] = tabWindow;
    }
  }

  addTabWindows(tabWindows) {
    _.each(tabWindows, (w) => { this.addTabWindow(w); } );
  }

  /* We distinguish between removing an entry from map of open windows (windowIdMap)
   * because when closing a bookmarked window, we only wish to remove it from former
   */
  handleTabWindowClosed(tabWindow) {
    console.log("handleTabWindowClosed: ", tabWindow);
    var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
    if (windowId)
      delete this.windowIdMap[ windowId ];    
    this.emit("change");
  }

  removeBookmarkIdMapEntry(tabWindow) {
    console.log("removeBookmarkIdMapEntry: ", tabWindow);
    var bookmarkId = tabWindow.bookmarkFolder && tabWindow.bookmarkFolder.id;
    if (bookmarkId)
      delete this.bookmarkIdMap[bookmarkId];
    this.emit("change");
  }

  unmanageWindow(tabWindow) {
    this.removeBookmarkIdMapEntry(tabWindow);    
    tabWindow._managed = false;
    tabWindow.bookmarkFolder = null;  // disconnect from this bookmark folder
  }

  revertTabWindow( tabWindow, callback ) {
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

  /**
   * attach a Chrome window to a specific tab window (after opening a saved window)
   */
  attachChromeWindow(tabWindow,chromeWindow) {
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
    this.windowIdMap[ chromeWindow.id ] = tabWindow;
  }


  /**
   * attach a bookmark folder to a specific tab window (after managing)
   */
  attachBookmarkFolder(tabWindow,bookmarkFolder,title) {
      tabWindow.bookmarkFolder = bookmarkFolder;

      //
      // HACK: breaking the tabWindow abstraction
      //
      tabWindow._managed = true;
      tabWindow._managedTitle = title;

      // And re-register in store maps:
      this.addTabWindow(tabWindow);
      this.emit("change");
  }

  handleChromeWindowRemoved(windowId) {
    console.log("handleChromeWindowRemoved: ", windowId);
    var tabWindow = this.windowIdMap[windowId];
    if( !tabWindow ) {
      console.warn("window id not found -- ignoring");
    } else {
      if (!(tabWindow.isManaged())) { 
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

  handleChromeWindowFocusChanged(windowId) {
    /* TODO / FIXME: more efficient rep for focused window */
    var tabWindows = this.getAll();

    for ( var i = 0; i < tabWindows.length; i++ ) {
      var tabWindow = tabWindows[ i ];
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
  }

  handleChromeTabActivated(tabId,windowId) {
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
  }


  handleChromeTabCreated(tab) {
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
  }

  handleTabClosed(windowId,tabId) {
    var tabWindow = this.windowIdMap[windowId];
    if (!tabWindow) {
      console.warn("Got tab removed event for unknown window ", windowId, tabId);
      return;
    }
    var chromeWindow = tabWindow.chromeWindow;
    var tabIndex = findTabIndex(tabWindow.chromeWindow, tabId);
    if (tabIndex!=null) {
      tabWindow.chromeWindow.tabs.splice(tabIndex,1);
    }
    this.emit("change");
  }


  handleChromeTabRemoved(tabId,removeInfo) {
    if (removeInfo.isWindowClosing) {
      console.log("handleChromeTabRemoved: window closing, ignoring...");
      // Window is closing, ignore...
      return;
    }
    this.handleTabClosed(removeInfo.windowId,tabId);
  }

  handleChromeTabUpdated(tabId,changeInfo,tab) {
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
  }

  handleChromeTabReplaced(addedTabId,removedTabId) {
    console.log("handleChromeTabReplaced: ", addedTabId, removedTabId);
    var tabWindows = this.getAll();
    var [removedTabWindow,removedIndex] = findTabId(tabWindows, removedTabId);
    if (removedTabWindow) {
      var tab = removedTabWindow.chromeWindow.tabs[removedIndex]
      console.log("found removed tab: ", tab);
      tab.id = addedTabId;
      // Unfortunately we may not get any events giving us essential info on the
      // added tab.
      // Call chrome.tabs.get and then call handleTabUpdate directly
      chrome.tabs.get(addedTabId,(tab) => {
        console.log("Got replaced tab detail: ", tab);
        window.fluxState.flux.actions.chromeTabUpdated(tab.id,{},tab);
      });
    } else {
      console.log("removed tab id not found!");
    }
  }

  /**
   * Synchronize internal state of our store with snapshot
   * of current Chrome window state
   *
   * @param chromeWindow window to synchronize
   * @param noEmit suppress emitting change event if true. Useful to batch changes, i.e. syncWindowList
   */
  syncChromeWindow(chromeWindow,noEmit) {
    var tabWindow = this.windowIdMap[chromeWindow.id];
    if( !tabWindow ) {
      console.log( "syncChromeWindow: detected new window id: ", chromeWindow.id );
      tabWindow = TabWindow.makeChromeTabWindow( chromeWindow );
      this.addTabWindow(tabWindow);
    } else {
      // console.log( "syncChromeWindow: cache hit for window id: ", chromeWindow.id );
      // Set chromeWindow to current snapshot of tab contents:
      tabWindow.chromeWindow = chromeWindow;
      tabWindow.open = true;
    }
    if (!noEmit) {
      this.emit("change");
    }
  }

  handleChromeWindowCreated(chromeWindow) {
    this.syncChromeWindow(chromeWindow);
  }

  /**
   * synchronize the currently open windows from chrome.windows.getAll with 
   * internal map of open windows
   */
  syncWindowList(chromeWindowList) {

    var tabWindows = this.getOpen();

    // Iterate through tab windows (our current list of open windows)
    // closing any not in chromeWindowList:
    var chromeIds = _.pluck(chromeWindowList,'id');
    var chromeIdSet = new Set(chromeIds);
    tabWindows.forEach((tw) => {
      if (!chromeIdSet.has(tw.chromeWindow.id)) {
        console.log("syncWindowList: detected closed window: ", tw);
        // mark it closed (only matters for bookmarked windows):
        tw.open = false;
        // And remove it from open window map:
        this.handleTabWindowClosed(tw);
      }
    });

    // Now iterate through chromeWindowList and find any chrome windows not in our map of open windows:
    chromeWindowList.forEach((cw) => { this.syncChromeWindow(cw,true); });

    this.emit("change");
  }   

  /**
   * get the currently open tab windows
   */ 
  getOpen() {
    var openWindows = _.values(this.windowIdMap);
    return openWindows;    
  }

  getAll() {
    var openWindows = _.values(this.windowIdMap);
    var managedWindows = _.values(this.bookmarkIdMap);
    var closedManagedWindows = _.filter(managedWindows, (w) => { return !(w.open); });
    return closedManagedWindows.concat(openWindows);
  }

  // returns a tabWindow or undefined
  getTabWindowByChromeId(chromeId) {
    return this.windowIdMap[chromeId];
  }

  /*
   * Set a view listener, and ensure there is at most one.
   *
   * We have our own interface here because we don't have a reliable destructor / close event on the
   * chrome extension popup where 
   */
  setViewListener(listener) {
    if (this.viewListener) {
      console.log("setViewListener: clearing old view listener");
      this.removeListener("change", this.viewListener);
    }
    this.viewListener=listener;
    this.on("change",listener);
  }
}
