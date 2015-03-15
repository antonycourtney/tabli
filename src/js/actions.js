/*
 * actions that can be sent to Flux store
 */
'use strict';

var constants = require('./constants.js');

var actions = {
  addTabWindow: function(tabWindow) {
    var payload = { tabWindow: tabWindow };
    this.dispatch(constants.ADD_TAB_WINDOW, payload);
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
        chrome.windows.getCurrent(null, function (currentWindow) { 
          var t_finish = performance.now();
          console.log("syncWindowList: gathering window state took ", t_finish - t_start, " ms");
          var payload = { windowList: windowList, currentWindow: currentWindow };
          self.dispatch(constants.SYNC_WINDOW_LIST, payload);
        });
     });
  }
};

module.exports = actions;