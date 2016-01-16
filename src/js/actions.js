import * as TabWindow from './tabWindow';
import * as utils from './utils';

const TABLI_HELP_URL = 'http://antonycourtney.github.io/tabli/tabli-usage.html';

/**
 * sync a single Chrome window by its Chrome window id
 *
 * @param {function} cb -- callback to update state
 */
export function syncChromeWindowById(windowId, cb) {
  chrome.windows.get(windowId, { populate: true }, (chromeWindow) => {
    cb((state) => state.syncChromeWindow(chromeWindow));
  });
}

/**
 * get all open Chrome windows and synchronize state with our tab window store
 *
 * @param {function} cb -- callback to updated state
 */
export function syncChromeWindows(cb) {
  var t_preGet = performance.now();
  chrome.windows.getAll({ populate: true }, (windowList) => {
    var t_postGet = performance.now();
    console.log('syncChromeWindows: chrome.windows.getAll took ', t_postGet - t_preGet, ' ms');
    var t_preSync = performance.now();
    cb((state) => state.syncWindowList(windowList));
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
  chrome.windows.getLastFocused({ populate: true }, (currentChromeWindow) => {
    const urls = tabWindow.tabItems.map((ti) => ti.url).toArray();
    function cf(chromeWindow) {
      cb((state) => state.attachChromeWindow(tabWindow, chromeWindow));
    }

    if ((currentChromeWindow.tabs.length === 1) &&
        (currentChromeWindow.tabs[0].url === 'chrome://newtab/')) {
      // console.log("found new window -- replacing contents");
      var origTabId = currentChromeWindow.tabs[0].id;

      // new window -- replace contents with urls:
      // TODO: replace this loop with call to utils.seqActions
      for (var i = 0; i < urls.length; i++) {
        // First use our existing tab:
        if (i === 0) {
          chrome.tabs.update(origTabId, { url: urls[i] });
        } else {
          const tabInfo = { windowId: currentChromeWindow.id, url: urls[i] };
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

export function openWindow(tabWindow, cb) {
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

export function closeTab(tabWindow, tabId, cb) {
  const openTabCount = tabWindow.openTabCount;
  chrome.tabs.remove(tabId, () => {
    if (openTabCount === 1) {
      cb((state) => state.handleTabWindowClosed(tabWindow));
    } else {
      /*
       * We'd like to do a full chrome.windows.get here so that we get the currently active tab
       * but amazingly we still see the closed tab when we do that!
      chrome.windows.get( tabWindow.openWindowId, { populate: true }, function ( chromeWindow ) {
        console.log("closeTab: got window state: ", chromeWindow);
        winStore.syncChromeWindow(chromeWindow);
      });
      */
      cb((state) => state.handleTabClosed(tabWindow, tabId));
    }
  });
}

export function saveTab(tabWindow, tabItem, cb) {
  const tabMark = { parentId: tabWindow.savedFolderId, title: tabItem.title, url: tabItem.url };
  chrome.bookmarks.create(tabMark, (tabNode) => {
    cb((state) => state.handleTabSaved(tabWindow, tabItem, tabNode));
  });
}

export function unsaveTab(tabWindow, tabItem, cb) {
  chrome.bookmarks.remove(tabItem.savedBookmarkId, () => {
    cb((state) => state.handleTabUnsaved(tabWindow, tabItem));
  });
}

export function closeWindow(tabWindow, cb) {
  if (!tabWindow.open) {
    console.log('closeWindow: request to close non-open window, ignoring...');
    return;
  }

  chrome.windows.remove(tabWindow.openWindowId, () => {
    cb((state) => state.handleTabWindowClosed(tabWindow));
  });
}

// activate a specific tab:
export function activateTab(tabWindow, tab, tabIndex, cb) {
  // console.log("activateTab: ", tabWindow, tab );

  if (tabWindow.open) {
    // OK, so we know this window is open.  What about the specific tab?
    if (tab.open) {
      // Tab is already open, just make it active:
      // console.log("making tab active");
      chrome.tabs.update(tab.openTabId, { active: true }, () => {
        // console.log("making tab's window active");
        chrome.windows.update(tabWindow.openWindowId, { focused: true });
      });
    } else {
      // restore this bookmarked tab:
      var createOpts = {
        windowId: tabWindow.openWindowId,
        url: tab.url,
        index: tabIndex,
        active: true,
      };

      // console.log("restoring bookmarked tab")
      chrome.tabs.create(createOpts, () => { });
    }
  } else {
    // console.log("activateTab: opening non-open window");
    // TODO: insert our own callback so we can activate chosen tab after opening window!
    openWindow(tabWindow, cb);
  }
}

export function revertWindow(tabWindow, cb) {
  const currentTabIds = tabWindow.tabItems.filter((ti) => ti.open).map((ti) => ti.openTabId).toArray();

  const revertedTabWindow = TabWindow.removeOpenWindowState(tabWindow);

  // re-open saved URLs:
  // We need to do this before removing current tab ids or window will close
  var savedUrls = revertedTabWindow.tabItems.map((ti) => ti.url).toArray();

  for (var i = 0; i < savedUrls.length; i++) {
    // need to open it:
    var tabInfo = { windowId: tabWindow.openWindowId, url: savedUrls[i] };
    chrome.tabs.create(tabInfo);
  }

  // blow away all the existing tabs:
  chrome.tabs.remove(currentTabIds, () => {
    syncChromeWindowById(tabWindow.openWindowId, cb);
  });
}

/*
 * save the specified tab window and make it a managed window
 */
export function manageWindow(tabliFolderId, tabWindow, title, cb) {
  // and write out a Bookmarks folder for this newly managed window:
  if (!tabliFolderId) {
    alert('Could not save bookmarks -- no tab manager folder');
  }

  var windowFolder = { parentId: tabliFolderId,
                       title,
                     };
  chrome.bookmarks.create(windowFolder, (windowFolderNode) => {
    // console.log( "succesfully created bookmarks folder ", windowFolderNode );
    // console.log( "for window: ", tabWindow );

    // We'll groupBy and then take the first item of each element of the sequence:
    const uniqTabItems = tabWindow.tabItems.groupBy((ti) => ti.url).toIndexedSeq().map((vs) => vs.get(0)).toArray();

    var bookmarkActions = uniqTabItems.map((tabItem) => {
      function makeBookmarkAction(v, bmcb) {
        const tabMark = { parentId: windowFolderNode.id, title: tabItem.title, url: tabItem.url };
        chrome.bookmarks.create(tabMark, bmcb);
      }

      return makeBookmarkAction;
    });

    utils.seqActions(bookmarkActions, null, () => {
      // Now do an explicit get of subtree to get node populated with children
      chrome.bookmarks.getSubTree(windowFolderNode.id, (folderNodes) => {
        var fullFolderNode = folderNodes[0];

        // We'll retrieve the latest chrome Window state and attach that:
        chrome.windows.get(tabWindow.openWindowId, { populate: true }, (chromeWindow) => {
          // Hack:  Chrome may think focus has moved to the popup itself, so let's just
          // set chromeWindow.focused to last focused state (tabWindow.focused)
          const focusedChromeWindow = Object.assign({}, chromeWindow, { focused: tabWindow.focused });
          cb((state) => state.attachBookmarkFolder(fullFolderNode, focusedChromeWindow));
        });
      });
    });
  });
}

/* stop managing the specified window...move all bookmarks for this managed window to Recycle Bin */
export function unmanageWindow(archiveFolderId, tabWindow, cb) {
  // console.log("unmanageWindow: ", tabWindow.toJS());
  if (!archiveFolderId) {
    alert('could not move managed window folder to archive -- no archive folder');
    return;
  }

  // Could potentially disambiguate names in archive folder...
  chrome.bookmarks.move(tabWindow.savedFolderId, { parentId: archiveFolderId }, () => {
    // console.log("unmanageWindow: bookmark folder moved to archive folder");
    cb((state) => state.unmanageWindow(tabWindow));
  });
}

export function showHelp() {
  console.log('showHelp: opening manual');
  chrome.tabs.create({ url: TABLI_HELP_URL });
}
