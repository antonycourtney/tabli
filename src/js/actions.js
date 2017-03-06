// @flow
/* globals alert */
import * as utils from './utils'
import tabliBrowser from './chromeBrowser'
import * as Constants from './components/constants'
import { TabItem, TabWindow} from './tabWindow' // eslint-disable-line

type TabId = number

import type {RefUpdater} from 'oneref'
import TabManagerState from './tabManagerState'

// type RefUpdater<A> = (uf: ((a: A) => A)) => A

const TABLI_ABOUT_URL = 'http://www.gettabli.com/contact.html'
const TABLI_HELP_URL = 'http://www.gettabli.com/tabli-usage.html'
const TABLI_REVIEW_URL = 'https://chrome.google.com/webstore/detail/tabli/igeehkedfibbnhbfponhjjplpkeomghi/reviews'
const TABLI_FEEDBACK_URL = 'mailto:tabli-feedback@antonycourtney.com'

type TMSUpdater = RefUpdater<TabManagerState>
type WindowId = number

/**
 * sync a single Chrome window by its Chrome window id
 *
 */
export function syncChromeWindowById (windowId: WindowId, updater: TMSUpdater) {
  chrome.windows.get(windowId, { populate: true }, (chromeWindow) => {
    updater((state) => state.syncChromeWindow(chromeWindow))
  })
}

/**
 * get all open Chrome windows and synchronize state with our tab window store
 *
 */
export function syncChromeWindows (updater: TMSUpdater) {
  var tPreGet = performance.now()
  chrome.windows.getAll({ populate: true }, (windowList) => {
    var tPostGet = performance.now()
    console.log('syncChromeWindows: chrome.windows.getAll took ', tPostGet - tPreGet, ' ms')
    var tPreSync = performance.now()
    updater((state) => state.syncWindowList(windowList))
    var tPostSync = performance.now()
    console.log('syncChromeWindows: syncWindowList took ', tPostSync - tPreSync, ' ms')
  })
}

/**
 * restoreFromAppState
 *
 * Restore a saved window using only App state.
 * Fallback for when no session id available or session restore fails
 */
const restoreFromAppState = (lastFocusedTabWindow, tabWindow: TabWindow, updater: TMSUpdater) => {
  function cf (chromeWindow) {
    updater((state) => state.attachChromeWindow(tabWindow, chromeWindow))
  }
  /*
   * special case handling of replacing the contents of a fresh window
   */
  chrome.windows.getLastFocused({ populate: true }, (currentChromeWindow) => {
    const tabItems = tabWindow.tabItems
    // If a snapshot, only use tabItems that were previously open:
    const targetItems = tabWindow.snapshot ? tabItems.filter(ti => ti.open) : tabItems
    const urls = targetItems.map((ti) => ti.url).toArray()

    if (currentChromeWindow.tabs &&
      (currentChromeWindow.tabs.length === 1) &&
      (currentChromeWindow.tabs[0].url === 'chrome://newtab/') &&
      (currentChromeWindow.id != null) &&
      (currentChromeWindow.tabs[0].id != null)) {
      // console.log("found new window -- replacing contents")
      var origTabId = currentChromeWindow.tabs[0].id

      // new window -- replace contents with urls:
      // TODO: replace this loop with call to utils.seqActions
      for (var i = 0; i < urls.length; i++) {
        // First use our existing tab:
        if (i === 0) {
          chrome.tabs.update(origTabId, { url: urls[i] })
        } else {
          const tabInfo = { windowId: currentChromeWindow.id, url: urls[i] }
          chrome.tabs.create(tabInfo)
        }
      }

      chrome.windows.get(currentChromeWindow.id, { populate: true }, cf)
    } else {
      // normal case -- create a new window for these urls:
      var createData = {
        url: urls,
        focused: true,
        type: 'normal',
        width: Constants.BROWSER_DEFAULT_WIDTH,
        height: Constants.BROWSER_DEFAULT_HEIGHT
      }
      if (lastFocusedTabWindow) {
        createData.width = lastFocusedTabWindow.width
        createData.height = lastFocusedTabWindow.height
      }
      chrome.windows.create(createData, cf)
    }
  })
}

/**
 * restore a bookmark window.
 *
 * N.B.: NOT exported; called from openWindow
 */
function restoreBookmarkWindow (lastFocusedTabWindow, tabWindow: TabWindow, updater: TMSUpdater) {
  console.log('restoreBookmarkWindow: restoring "' + tabWindow.title + '"')
  function cf (chromeWindow) {
    updater((state) => state.attachChromeWindow(tabWindow, chromeWindow))
  }

  if (tabWindow.snapshot && tabWindow.chromeSessionId) {
    console.log('restoring chrome session id ', tabWindow.chromeSessionId)
    // TODO: may want to re-validate the session id by
    // calling chrome.sessions.getRecentlyClosed...
    chrome.sessions.restore(tabWindow.chromeSessionId, rs => {
      if (chrome.runtime.lastError) {
        console.warn('Caught exception restoring via session API: ', chrome.runtime.lastError.message)
        console.warn('(restoring from Tabli state)')
        restoreFromAppState(lastFocusedTabWindow, tabWindow, updater)
      } else {
        console.log('Chrome session restore succeeded')
        cf(rs.window)
      }
    })
  } else {
    restoreFromAppState(lastFocusedTabWindow, tabWindow, updater)
  }
}

export function openWindow (lastFocusedTabWindow: TabWindow, targetTabWindow: TabWindow, updater: TMSUpdater) {
  if (targetTabWindow.open) {
    // existing, open window -- just transfer focus
    chrome.windows.update(targetTabWindow.openWindowId, { focused: true })

  // TODO: update focus in winStore
  } else {
    // bookmarked window -- need to open it!
    restoreBookmarkWindow(lastFocusedTabWindow, targetTabWindow, updater)
  }
}

export function closeTab (tabWindow: TabWindow, tabId: TabId, updater: TMSUpdater) {
  const openTabCount = tabWindow.openTabCount
  chrome.tabs.remove(tabId, () => {
    if (openTabCount === 1) {
      updater((state) => state.handleTabWindowClosed(tabWindow))
    } else {
      /*
       * We'd like to do a full chrome.windows.get here so that we get the currently active tab
       * but amazingly we still see the closed tab when we do that!
      chrome.windows.get( tabWindow.openWindowId, { populate: true }, function ( chromeWindow ) {
        console.log("closeTab: got window state: ", chromeWindow)
        winStore.syncChromeWindow(chromeWindow)
      })
      */
      updater((state) => state.handleTabClosed(tabWindow, tabId))
    }
  })
}

export function saveTab (tabWindow: TabWindow, tabItem: TabItem, updater: TMSUpdater) {
  const tabMark = { parentId: tabWindow.savedFolderId, title: tabItem.title, url: tabItem.url }
  chrome.bookmarks.create(tabMark, (tabNode) => {
    updater((state) => state.handleTabSaved(tabWindow, tabItem, tabNode))
  })
}

export function unsaveTab (tabWindow: TabWindow, tabItem: TabItem, updater: TMSUpdater) {
  chrome.bookmarks.remove(tabItem.savedState.bookmarkId, () => {
    updater((state) => state.handleTabUnsaved(tabWindow, tabItem))
  })
}

export function closeWindow (tabWindow: TabWindow, updater: TMSUpdater) {
  if (!tabWindow.open) {
    console.log('closeWindow: request to close non-open window, ignoring...')
    return
  }

  chrome.windows.remove(tabWindow.openWindowId, () => {
    updater((state) => state.handleTabWindowClosed(tabWindow))
  })
}

export function expandWindow (tabWindow: TabWindow, expand: ?boolean, updater: TMSUpdater) {
  updater(state => state.handleTabWindowExpand(tabWindow, expand))
}

// activate a specific tab:
export function activateTab (
  lastFocusedTabWindow: TabWindow,
  targetTabWindow: TabWindow,
  tab: TabItem,
  tabIndex: number,
  updater: TMSUpdater
) {
  // console.log("activateTab: ", tabWindow, tab )

  if (targetTabWindow.open) {
    // OK, so we know this window is open.  What about the specific tab?
    if (tab.open) {
      // Tab is already open, just make it active:
      // console.log("making tab active")
      /*
            chrome.tabs.update(tab.openTabId, { active: true }, () => {
              // console.log("making tab's window active")
              chrome.windows.update(tabWindow.openWindowId, { focused: true })
            })
      */
      tabliBrowser.activateTab(tab.openState.openTabId, () => {
        tabliBrowser.setFocusedWindow(targetTabWindow.openWindowId)
      })
    } else {
      // restore this bookmarked tab:
      var createOpts = {
        windowId: targetTabWindow.openWindowId,
        url: tab.url,
        index: tabIndex,
        active: true
      }

      // console.log("restoring bookmarked tab")
      chrome.tabs.create(createOpts, () => {
      })
    }
  } else {
    // console.log("activateTab: opening non-open window")
    // TODO: insert our own callback so we can activate chosen tab after opening window!
    openWindow(lastFocusedTabWindow, targetTabWindow, updater)
  }
}

export function revertWindow (tabWindow: TabWindow, updater: TMSUpdater) {
  /*
   * We used to reload saved tabs, but this is slow, could lose tab state, and doesn't deal gracefully with
   * pinned tabs.
   * Instead we'll try just removing the unsaved tabs and re-opening any saved, closed tabs.
   * This has the downside of not removing duplicates of any saved tabs.
   */
  const unsavedOpenTabIds = tabWindow.tabItems.filter((ti) => ti.open && !ti.saved).map((ti) => ti.openState.openTabId).toArray()
  const savedClosedUrls = tabWindow.tabItems.filter((ti) => !ti.open && ti.saved).map((ti) => ti.savedState.url).toArray()

  // re-open saved URLs:
  // We need to do this before removing tab ids or window could close if all unsaved
  for (var i = 0; i < savedClosedUrls.length; i++) {
    // need to open it:
    var tabInfo = { windowId: tabWindow.openWindowId, url: savedClosedUrls[i] }
    chrome.tabs.create(tabInfo)
  }

  // blow away all the unsaved open tabs:
  chrome.tabs.remove(unsavedOpenTabIds, () => {
    syncChromeWindowById(tabWindow.openWindowId, updater)
  })
}

/*
 * save the specified tab window and make it a managed window
 */
export function manageWindow (
  tabliFolderId: string,
  currentWindowId: number,
  tabWindow: TabWindow,
  title: string,
  updater: TMSUpdater
) {
  // and write out a Bookmarks folder for this newly managed window:
  if (!tabliFolderId) {
    alert('Could not save bookmarks -- no tab manager folder')
  }

  var windowFolder = {parentId: tabliFolderId, title}
  chrome.bookmarks.create(windowFolder, (windowFolderNode) => {
    // console.log( "succesfully created bookmarks folder ", windowFolderNode )
    // console.log( "for window: ", tabWindow )

    // We'll groupBy and then take the first item of each element of the sequence:
    const uniqTabItems = tabWindow.tabItems.groupBy((ti) => ti.url).toIndexedSeq().map((vs) => vs.get(0)).toArray()

    var bookmarkActions = uniqTabItems.map((tabItem) => {
      function makeBookmarkAction (v, cf) {
        const tabMark = { parentId: windowFolderNode.id, title: tabItem.title, url: tabItem.url }
        chrome.bookmarks.create(tabMark, cf)
      }

      return makeBookmarkAction
    })

    utils.seqActions(bookmarkActions, null, () => {
      // Now do an explicit get of subtree to get node populated with children
      chrome.bookmarks.getSubTree(windowFolderNode.id, (folderNodes) => {
        var fullFolderNode = folderNodes[0]

        // We'll retrieve the latest chrome Window state and attach that:
        chrome.windows.get(tabWindow.openWindowId, { populate: true }, (chromeWindow) => {
          updater((state) => state.attachBookmarkFolder(fullFolderNode, chromeWindow))
        })
      })
    })
  })
}

/* stop managing the specified window...move all bookmarks for this managed window to Recycle Bin */
export function unmanageWindow (archiveFolderId: string, tabWindow: TabWindow, updater: TMSUpdater) {
  // console.log("unmanageWindow: ", tabWindow.toJS())
  if (!archiveFolderId) {
    alert('could not move managed window folder to archive -- no archive folder')
    return
  }

  // Could potentially disambiguate names in archive folder...
  chrome.bookmarks.move(tabWindow.savedFolderId, { parentId: archiveFolderId }, () => {
    // console.log("unmanageWindow: bookmark folder moved to archive folder")
    updater((state) => state.unmanageWindow(tabWindow))
  })
}

export function showHelp (winStore: TabManagerState, updater: TMSUpdater) {
  chrome.tabs.create({ url: TABLI_HELP_URL })
}

export function showAbout (winStore: TabManagerState, updater: TMSUpdater) {
  chrome.tabs.create({ url: TABLI_ABOUT_URL })
}
export function showReview (winStore: TabManagerState, updater: TMSUpdater) {
  chrome.tabs.create({ url: TABLI_REVIEW_URL })
}
export function sendFeedback (winStore: TabManagerState, updater: TMSUpdater) {
  chrome.tabs.create({ url: TABLI_FEEDBACK_URL })
}

export function showPopout (winStore: TabManagerState, updater: TMSUpdater) {
  const ptw = winStore.getPopoutTabWindow()
  if (ptw) {
    tabliBrowser.setFocusedWindow(ptw.openWindowId)
  }
  chrome.windows.create({ url: 'popout.html',
    type: 'popup',
    left: 0,
    top: 0,
    width: Constants.POPOUT_DEFAULT_WIDTH,
    height: Constants.POPOUT_DEFAULT_HEIGHT
  })
}

export function hidePopout (winStore: TabManagerState, updater: TMSUpdater) {
  const ptw = winStore.getPopoutTabWindow()
  closeWindow(ptw, updater)
}

export function toggleExpandAll (winStore: TabManagerState, updater: TMSUpdater) {
  updater(st => {
    const allWindows = st.getAll()
    const updWindows = allWindows.map(w => w.remove('expanded'))
    const nextSt = st.registerTabWindows(updWindows).set('expandAll', !st.expandAll)
    return nextSt
  })
}

/*
 * move an open tab (in response to a drag event):
 */
export function moveTabItem (
  targetTabWindow: TabWindow,
  targetIndex: number,
  sourceTabItem: TabItem,
  uf: TMSUpdater
) {
  if (!sourceTabItem.open) {
    console.log('moveTabItem: source tab not open, ignoring...')
    return
  }

  const tabId = sourceTabItem.openState.openTabId
  if (!targetTabWindow.open) {
    console.log('moveTabItem: target tab window not open, ignoring...')
    return
  }
  const targetWindowId = targetTabWindow.openWindowId
  const moveProps = { windowId: targetWindowId, index: targetIndex }
  chrome.tabs.move(tabId, moveProps, (chromeTab) => {
    // console.log("moveTabItem: tab move complete: ", chromeTab)
    // Let's just refresh the whole window:
    syncChromeWindowById(targetWindowId, uf)
  })
}

export function hideRelNotes (winStore: TabManagerState, updater: TMSUpdater) {
  const manifest = chrome.runtime.getManifest()
  chrome.storage.local.set({ readRelNotesVersion: manifest.version }, () => {
    updater(st => st.set('showRelNotes', false))
  })
}

export function showRelNotes (winStore: TabManagerState, updater: TMSUpdater) {
  updater(st => st.set('showRelNotes', true))
}
