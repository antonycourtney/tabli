/**
 * long-lived application state for Subjective tab manager
 *
 * We'll instantiate and initialize this in the bgHelper and attach it to the background window,
 * and then retrieve the instance from the background window in the popup
 */
'use strict';

import * as _ from 'lodash';
import * as Immutable from 'immutable';
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

export default class TabWindowStore extends EventEmitter {

  constructor(folderId,archiveFolderId) {
    super();
    this.windowIdMap = Immutable.Map();  // maps from chrome window id for open windows
    this.bookmarkIdMap = Immutable.Map();
    this.viewListeners = [];
    this.notifyCallback = null;
    this.folderId = folderId;
    this.archiveFolderId = archiveFolderId;
  }

  /**
   * Update store to include the specified window, indexed by 
   * open window id or bookmark id
   *
   * Note that if an earlier snapshot of tabWindow is in the store, it will be
   * replaced
   */
  registerTabWindow(tabWindow) {
    if (tabWindow.open) {
      this.windowIdMap = this.windowIdMap.set(tabWindow.openWindowId,tabWindow);
    }
    if (tabWindow.saved) {
      this.bookmarkIdMap = this.bookmarkIdMap.set(tabWindow.savedFolderId,tabWindow);
    }
  }

  registerTabWindows(tabWindows) {
    _.each(tabWindows, (w) => { this.registerTabWindow(w); } );
  }

  /* We distinguish between removing an entry from map of open windows (windowIdMap)
   * because when closing a bookmarked window, we only wish to remove it from former
   */
  handleTabWindowClosed(tabWindow) {
    console.log("handleTabWindowClosed: ", tabWindow.toJS());
    this.windowIdMap = this.windowIdMap.delete(tabWindow.openWindowId);

    const revertedWindow = TabWindow.resetSavedWindow(tabWindow);

    console.log("handleTabWindowClosed: revertedWindow: ", revertedWindow.toJS());

    this.registerTabWindow(revertedWindow);
    this.emit("change");
  }

  removeBookmarkIdMapEntry(tabWindow) {
    console.log("removeBookmarkIdMapEntry: ", tabWindow);
    this.bookmarkIdMap = this.bookmarkIdMap.delete(tabWindow.savedFolderId);
    this.emit("change");
  }

  unmanageWindow(tabWindow) {
    this.removeBookmarkIdMapEntry(tabWindow);

    // disconnect from the previously associated bookmark folder and re-register
    const umWindow = tabWindow.set('saved',false).set('savedFolderId',-1);
    this.registerTabWindow(umWindow);    
  }


  /**
   * attach a Chrome window to a specific tab window (after opening a saved window)
   */
  attachChromeWindow(tabWindow,chromeWindow) {
    console.log("attachChromeWindow: ", tabWindow, chromeWindow);
    // Was this Chrome window id previously associated with some other tab window?
    const oldTabWindow = this.windowIdMap.get(chromeWindow.id);
    if (oldTabWindow) {
      // This better not be a managed window...
      console.log("found previous tab window -- detaching");
      console.log("oldTabWindow: ", oldTabWindow);
      this.removeTabWindow(oldTabWindow);
    }

    const attachedTabWindow = TabWindow.updateWindow(tabWindow,chromeWindow);

    this.registerTabWindow(attachedTabWindow);
  }

  /**
   * attach a bookmark folder to a specific chrome window
   */
  attachBookmarkFolder(bookmarkFolder,chromeWindow) {
    const folderTabWindow = TabWindow.makeFolderTabWindow(bookmarkFolder);

    const mergedTabWindow = TabWindow.updateWindow(folderTabWindow,chromeWindow);

    // And re-register in store maps:
    this.registerTabWindow(mergedTabWindow);
    this.emit("change");
    return mergedTabWindow;
  }


  handleTabClosed(windowId,tabId) {
    throw new Error("TODO: port handleTabClosed to immutable");
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

  /**
   * Synchronize internal state of our store with snapshot
   * of current Chrome window state
   *
   * @param chromeWindow window to synchronize
   * @param noEmit suppress emitting change event if true. Useful to batch changes, i.e. syncWindowList
   */
  syncChromeWindow(chromeWindow,noEmit) {
    var tabWindow = this.windowIdMap.get(chromeWindow.id);
    if( !tabWindow ) {
      console.log( "syncChromeWindow: detected new window id: ", chromeWindow.id );
      tabWindow = TabWindow.makeChromeTabWindow(chromeWindow);
      this.registerTabWindow(tabWindow);
    } else {
      // console.log( "syncChromeWindow: cache hit for window id: ", chromeWindow.id );

      const updWindow = TabWindow.updateWindow(tabWindow,chromeWindow);
      // Set chromeWindow to current snapshot of tab contents:

      // console.log("updated window: ", updWindow.toJS());

      this.registerTabWindow(updWindow);
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
      if (!chromeIdSet.has(tw.openWindowId)) {
        console.log("syncWindowList: detected closed window: ", tw);
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
    const openWindows = this.windowIdMap.toIndexedSeq().toArray();
    return openWindows;    
  }

  getAll() {
    const openWindows = this.getOpen();
    const closedSavedWindows = this.bookmarkIdMap.toIndexedSeq().filter((w) => !(w.open)).toArray();
    return openWindows.concat(closedSavedWindows);
  }

  // returns a tabWindow or undefined
  getTabWindowByChromeId(windowId) {
    return this.windowIdMap.get(windowId);
  }

  /*
   * Add a view listener and return its listener id
   *
   * We have our own interface here because we don't have a reliable destructor / close event 
   * on the chrome extension popup window
   */
  addViewListener(listener) {
    // check to ensure this listener not yet registered:
    var idx = this.viewListeners.indexOf(listener);
    if (idx===-1) {
      idx = this.viewListeners.length;
      this.viewListeners.push(listener);
      this.on("change",listener);
    }
    return idx;
  }

  removeViewListener(id) {
    console.log("removeViewListener: removing listener id ", id);
    var listener = this.viewListeners[id];
    if (listener) {
      this.removeListener("change",listener);
    } else {
      console.warn("clearViewListener: No listener found for id ", id);
    }
    delete this.viewListeners[id];
  }
}