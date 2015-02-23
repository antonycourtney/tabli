/*
 * A Flux store for TabWindows
 */
 var Fluxxor = require('fluxxor');
 var constants = require('./constants.js');

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

function removeTabWindow(tabWindow) {
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
  var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
  if ( windowId ) 
    delete windowIdMap[ windowId ];
}

function closeTabWindow(tabWindow, cb) {
  console.log("closeTabWindow: ", tabWindow);
  if (!tabWindow.open) {
    console.log("closeTabWindow: request to close non-open window, ignoring...");
    return;
  }
  var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
  chrome.windows.remove( windowId, function() {
    tabWindow.open = false;
    delete windowIdMap[ windowId ];
    if (!tabWindow.isManaged()) {
      console.log("unmanaged window -- removing");
      removeTabWindow(tabWindow);
    }
    cb();    
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
    chrome.windows.update( windowId, { focused: true } );
  } else {
    // bookmarked window -- need to open it!
    restoreBookmarkWindow( tabWindow, callback );      
  }    
}

function attachChromeWindow(tabWindow,chromeWindow) {
  console.log("attachChromeWindow");
  tabWindow.chromeWindow = chromeWindow;
  tabWindow.open = true;
  windowIdMap[ chromeWindow.id ] = tabWindow;
  console.log("attachChromeWindow: complete.");
}

var TabWindowStore = Fluxxor.createStore({
  initialize: function() {
    this.bindActions(
      constants.ADD_TAB_WINDOW, this.onAddTabWindow,
      constants.CLOSE_TAB_WINDOW, this.onCloseTabWindow,
      constants.OPEN_TAB_WINDOW, this.onOpenTabWindow,
      constants.REMOVE_TAB_WINDOW, this.onRemoveTabWindow,
      constants.ATTACH_CHROME_WINDOW, this.onAttachChromeWindow
      );
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

  getAll: function() {
    return tabWindows;
  },

  // returns a tabWindow or undefined
  getTabWindowByChromeId: function(chromeId) {
    return windowIdMap[chromeId];
  }
});

module.exports = TabWindowStore;