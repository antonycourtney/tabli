/*
 * actions that can be sent to Flux store
 */
'use strict';

import * as constants from './constants';

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
      self.dispatch(constants.REMOVE_TAB_WINDOW, payload);
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
    console.log("restoreBookmarkWindow: ", tabWindow, tabWindow.chromeWindow);
    var self = this;
    /*
     * special case handling of replacing the contents of a fresh window 
     */    
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

    var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
    if (tabWindow.open) {
      // existing window -- just transfer focus
      chrome.windows.update( windowId, { focused: true });
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
    console.log("activateTab: ", tabWindow, tab );
    if( tabWindow.open ) {
      // OK, so we know this window is open.  What about the specific tab?
      if (tab.open) { 
        // Tab is already open, just make it active:
        console.log("making tab active");
        chrome.tabs.update( tab.id, { active: true }, function () {
          console.log("making tab's window active");
          chrome.windows.update( tabWindow.chromeWindow.id, { focused: true });
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
    chrome.tabs.remove(tab.id);
  },

  syncWindowList: function(cb) {
    var self = this;
    var t_start = performance.now();
    chrome.windows.getAll( {populate: true}, function (windowList) {
        chrome.windows.getLastFocused(null, function (focusedWindow) { 
          var t_finish = performance.now();
          console.log("syncWindowList: gathering window state took ", t_finish - t_start, " ms");
          var payload = { windowList: windowList, focusedWindow: focusedWindow };
          self.dispatch(constants.SYNC_WINDOW_LIST, payload);
          if (cb) {
            cb();
          }
        });
     });
  },


  /* actions registered as Chrome window and tab event listeners */

  chromeWindowCreated: function(chromeWindow) {
    var payload = { chromeWindow };
    this.dispatch(constants.CHROME_WINDOW_CREATED, payload);
  },

  chromeWindowRemoved: function(windowId) {
    var payload = { windowId };
    this.dispatch(constants.CHROME_WINDOW_REMOVED, payload);
  },

  chromeWindowFocusChanged: function(windowId) {
    var payload = { windowId };
    this.dispatch(constants.CHROME_WINDOW_FOCUS_CHANGED, payload);  
  },

  /* tab event handlers */
  chromeTabCreated: function(tab) {
    this.dispatch(constants.CHROME_TAB_CREATED,{ tab });
  },
  chromeTabRemoved: function(tabId,removeInfo) {
    this.dispatch(constants.CHROME_TAB_REMOVED,{ tabId,removeInfo });
  },
  chromeTabUpdated: function(tabId,changeInfo,tab) {
    this.dispatch(constants.CHROME_TAB_UPDATED,{ tabId, changeInfo, tab });
  },
  chromeTabMoved: function(tabId,moveInfo) {
    this.dispatch(constants.CHROME_TAB_MOVED,{ tabId, moveInfo });
  },
  chromeTabDetached: function(tabId,detachInfo) {
    this.dispatch(constants.CHROME_TAB_DETACHED,{ tabId, detachInfo });
  },
  chromeTabAttached: function(tab) {
    this.dispatch(constants.CHROME_TAB_ATTACHED,{ tabId, attachInfo });
  },
  chromeTabActivated: function(activeInfo) {
    this.dispatch(constants.CHROME_TAB_ACTIVATED,activeInfo);
  },
  chromeTabReplaced: function(addedTabId,removedTabId) {
    this.dispatch(constants.CHROME_TAB_REPLACED,{addedTabId,removedTabId});
  }
};
export default actions;