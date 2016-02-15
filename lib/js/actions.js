'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.syncChromeWindowById = syncChromeWindowById;
exports.syncChromeWindows = syncChromeWindows;
exports.openWindow = openWindow;
exports.closeTab = closeTab;
exports.saveTab = saveTab;
exports.unsaveTab = unsaveTab;
exports.closeWindow = closeWindow;
exports.activateTab = activateTab;
exports.revertWindow = revertWindow;
exports.manageWindow = manageWindow;
exports.unmanageWindow = unmanageWindow;
exports.showHelp = showHelp;

var _tabWindow = require('./tabWindow');

var TabWindow = _interopRequireWildcard(_tabWindow);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var TABLI_HELP_URL = 'http://antonycourtney.github.io/tabli/tabli-usage.html';

/**
 * sync a single Chrome window by its Chrome window id
 *
 * @param {function} cb -- callback to update state
 */
function syncChromeWindowById(windowId, cb) {
  chrome.windows.get(windowId, { populate: true }, function (chromeWindow) {
    cb(function (state) {
      return state.syncChromeWindow(chromeWindow);
    });
  });
}

/**
 * get all open Chrome windows and synchronize state with our tab window store
 *
 * @param {function} cb -- callback to updated state
 */
function syncChromeWindows(cb) {
  var t_preGet = performance.now();
  chrome.windows.getAll({ populate: true }, function (windowList) {
    var t_postGet = performance.now();
    console.log('syncChromeWindows: chrome.windows.getAll took ', t_postGet - t_preGet, ' ms');
    var t_preSync = performance.now();
    cb(function (state) {
      return state.syncWindowList(windowList);
    });
    var t_postSync = performance.now();
    console.log('syncChromeWindows: syncWindowList took ', t_postSync - t_preSync, ' ms');
  });
}

/**
 * restore a bookmark window.
 *
 * N.B.: NOT exported; called from openWindow
 */
function restoreBookmarkWindow(tabWindow, cb) {
  /*
   * special case handling of replacing the contents of a fresh window
   */
  chrome.windows.getLastFocused({ populate: true }, function (currentChromeWindow) {
    var urls = tabWindow.tabItems.map(function (ti) {
      return ti.url;
    }).toArray();
    function cf(chromeWindow) {
      cb(function (state) {
        return state.attachChromeWindow(tabWindow, chromeWindow);
      });
    }

    if (currentChromeWindow.tabs.length === 1 && currentChromeWindow.tabs[0].url === 'chrome://newtab/') {
      // console.log("found new window -- replacing contents");
      var origTabId = currentChromeWindow.tabs[0].id;

      // new window -- replace contents with urls:
      // TODO: replace this loop with call to utils.seqActions
      for (var i = 0; i < urls.length; i++) {
        // First use our existing tab:
        if (i === 0) {
          chrome.tabs.update(origTabId, { url: urls[i] });
        } else {
          var tabInfo = { windowId: currentChromeWindow.id, url: urls[i] };
          chrome.tabs.create(tabInfo);
        }
      }

      chrome.windows.get(currentChromeWindow.id, { populate: true }, cf);
    } else {
      // normal case -- create a new window for these urls:
      chrome.windows.create({ url: urls, focused: true, type: 'normal' }, cf);
    }
  });
}

function openWindow(tabWindow, cb) {
  console.log('actions.openWindow: ', tabWindow.toJS(), cb);

  if (tabWindow.open) {
    // existing, open window -- just transfer focus
    chrome.windows.update(tabWindow.openWindowId, { focused: true });

    // TODO: update focus in winStore
  } else {
      // bookmarked window -- need to open it!
      restoreBookmarkWindow(tabWindow, cb);
    }
}

function closeTab(tabWindow, tabId, cb) {
  var openTabCount = tabWindow.openTabCount;
  chrome.tabs.remove(tabId, function () {
    if (openTabCount === 1) {
      cb(function (state) {
        return state.handleTabWindowClosed(tabWindow);
      });
    } else {
      /*
       * We'd like to do a full chrome.windows.get here so that we get the currently active tab
       * but amazingly we still see the closed tab when we do that!
      chrome.windows.get( tabWindow.openWindowId, { populate: true }, function ( chromeWindow ) {
        console.log("closeTab: got window state: ", chromeWindow);
        winStore.syncChromeWindow(chromeWindow);
      });
      */
      cb(function (state) {
        return state.handleTabClosed(tabWindow, tabId);
      });
    }
  });
}

function saveTab(tabWindow, tabItem, cb) {
  var tabMark = { parentId: tabWindow.savedFolderId, title: tabItem.title, url: tabItem.url };
  chrome.bookmarks.create(tabMark, function (tabNode) {
    cb(function (state) {
      return state.handleTabSaved(tabWindow, tabItem, tabNode);
    });
  });
}

function unsaveTab(tabWindow, tabItem, cb) {
  chrome.bookmarks.remove(tabItem.savedBookmarkId, function () {
    cb(function (state) {
      return state.handleTabUnsaved(tabWindow, tabItem);
    });
  });
}

function closeWindow(tabWindow, cb) {
  if (!tabWindow.open) {
    console.log('closeWindow: request to close non-open window, ignoring...');
    return;
  }

  chrome.windows.remove(tabWindow.openWindowId, function () {
    cb(function (state) {
      return state.handleTabWindowClosed(tabWindow);
    });
  });
}

// activate a specific tab:
function activateTab(tabWindow, tab, tabIndex, cb) {
  // console.log("activateTab: ", tabWindow, tab );

  if (tabWindow.open) {
    // OK, so we know this window is open.  What about the specific tab?
    if (tab.open) {
      // Tab is already open, just make it active:
      // console.log("making tab active");
      /*
            chrome.tabs.update(tab.openTabId, { active: true }, () => {
              // console.log("making tab's window active");
              chrome.windows.update(tabWindow.openWindowId, { focused: true });
            });
      */
      tabliBrowser.activateTab(tab.openTabId, function () {
        tabliBrowser.setFocusedWindow(tabWindow.openWindowId);
      });
    } else {
      // restore this bookmarked tab:
      var createOpts = {
        windowId: tabWindow.openWindowId,
        url: tab.url,
        index: tabIndex,
        active: true
      };

      // console.log("restoring bookmarked tab")
      chrome.tabs.create(createOpts, function () {});
    }
  } else {
    // console.log("activateTab: opening non-open window");
    // TODO: insert our own callback so we can activate chosen tab after opening window!
    openWindow(tabWindow, cb);
  }
}

function revertWindow(tabWindow, cb) {
  var currentTabIds = tabWindow.tabItems.filter(function (ti) {
    return ti.open;
  }).map(function (ti) {
    return ti.openTabId;
  }).toArray();

  var revertedTabWindow = TabWindow.removeOpenWindowState(tabWindow);

  // re-open saved URLs:
  // We need to do this before removing current tab ids or window will close
  var savedUrls = revertedTabWindow.tabItems.map(function (ti) {
    return ti.url;
  }).toArray();

  for (var i = 0; i < savedUrls.length; i++) {
    // need to open it:
    var tabInfo = { windowId: tabWindow.openWindowId, url: savedUrls[i] };
    chrome.tabs.create(tabInfo);
  }

  // blow away all the existing tabs:
  chrome.tabs.remove(currentTabIds, function () {
    syncChromeWindowById(tabWindow.openWindowId, cb);
  });
}

/*
 * save the specified tab window and make it a managed window
 */
function manageWindow(tabliFolderId, tabWindow, title, cb) {
  // and write out a Bookmarks folder for this newly managed window:
  if (!tabliFolderId) {
    alert('Could not save bookmarks -- no tab manager folder');
  }

  var windowFolder = { parentId: tabliFolderId,
    title: title
  };
  chrome.bookmarks.create(windowFolder, function (windowFolderNode) {
    // console.log( "succesfully created bookmarks folder ", windowFolderNode );
    // console.log( "for window: ", tabWindow );

    // We'll groupBy and then take the first item of each element of the sequence:
    var uniqTabItems = tabWindow.tabItems.groupBy(function (ti) {
      return ti.url;
    }).toIndexedSeq().map(function (vs) {
      return vs.get(0);
    }).toArray();

    var bookmarkActions = uniqTabItems.map(function (tabItem) {
      function makeBookmarkAction(v, bmcb) {
        var tabMark = { parentId: windowFolderNode.id, title: tabItem.title, url: tabItem.url };
        chrome.bookmarks.create(tabMark, bmcb);
      }

      return makeBookmarkAction;
    });

    utils.seqActions(bookmarkActions, null, function () {
      // Now do an explicit get of subtree to get node populated with children
      chrome.bookmarks.getSubTree(windowFolderNode.id, function (folderNodes) {
        var fullFolderNode = folderNodes[0];

        // We'll retrieve the latest chrome Window state and attach that:
        chrome.windows.get(tabWindow.openWindowId, { populate: true }, function (chromeWindow) {
          // Hack:  Chrome may think focus has moved to the popup itself, so let's just
          // set chromeWindow.focused to last focused state (tabWindow.focused)
          var focusedChromeWindow = Object.assign({}, chromeWindow, { focused: tabWindow.focused });
          cb(function (state) {
            return state.attachBookmarkFolder(fullFolderNode, focusedChromeWindow);
          });
        });
      });
    });
  });
}

/* stop managing the specified window...move all bookmarks for this managed window to Recycle Bin */
function unmanageWindow(archiveFolderId, tabWindow, cb) {
  // console.log("unmanageWindow: ", tabWindow.toJS());
  if (!archiveFolderId) {
    alert('could not move managed window folder to archive -- no archive folder');
    return;
  }

  // Could potentially disambiguate names in archive folder...
  chrome.bookmarks.move(tabWindow.savedFolderId, { parentId: archiveFolderId }, function () {
    // console.log("unmanageWindow: bookmark folder moved to archive folder");
    cb(function (state) {
      return state.unmanageWindow(tabWindow);
    });
  });
}

function showHelp() {
  console.log('showHelp: opening manual');
  chrome.tabs.create({ url: TABLI_HELP_URL });
}