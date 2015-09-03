'use strict';


/**
 * get all open Chrome windows and synchronize state with our tab window store
 *
 * cb -- if non-null, no-argument callback to call when complete
 *
 */
export function syncChromeWindows(winStore,cb) {
  var t_preGet = performance.now();
  chrome.windows.getAll( {populate: true}, function (windowList) {
      var t_postGet = performance.now();
      console.log("syncChromeWindows: chrome.windows.getAll took ", t_postGet - t_preGet, " ms");
      winStore.syncWindowList(windowList);
      if (cb)
        cb();
   });
}

/**
 * restore a bookmark window.
 *
 * N.B.: NOT exported; called from openTabWindow
 */
function restoreBookmarkWindow(winStore, tabWindow) {
  console.log("restoreBookmarkWindow: ", tabWindow);
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
      winStore.attachChromeWindow(tabWindow,chromeWindow);
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
}

export function openTabWindow(winStore,tabWindow) {
  var self = this;

  var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
  if (tabWindow.open) {
    // existing, open window -- just transfer focus
    chrome.windows.update( windowId, { focused: true });
    // TODO: update focus in winStore
  } else {
    // bookmarked window -- need to open it!
    restoreBookmarkWindow(winStore,tabWindow);      
  }    
}

// activate a specific tab:
export function activateTab(winStore,tabWindow,tab,tabIndex) {
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
    openTabWindow(tabWindow);
    // TODO: activate chosen tab after opening window!
  }        
}

export function closeTab(winStore,windowId,tabId) {
  console.log("closeTab: closing tab ", windowId, tabId);;
  var self = this;
  chrome.tabs.remove(tabId,() => {
    winStore.handleTabClosed(windowId,tabId);
  });
}

export function closeTabWindow(winStore,tabWindow) {
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
    winStore.handleTabWindowClosed(tabWindow);
  });
}