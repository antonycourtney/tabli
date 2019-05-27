// @flow
/* globals alert */
import * as log from 'loglevel'
import * as utils from './utils'
import * as prefs from './preferences'
import tabliBrowser from './chromeBrowser'
import * as Constants from './components/constants'
import { TabItem, TabWindow} from './tabWindow' // eslint-disable-line
import type { Ref } from 'oneref'
import TabManagerState from './tabManagerState'
import ChromePromise from 'chrome-promise'
const chromep = ChromePromise

type TabId = number

const USER_PREFS_KEY = 'UserPreferences'

const TABLI_ABOUT_URL = 'http://www.gettabli.com/contact.html'
const TABLI_HELP_URL = 'http://www.gettabli.com/tabli-usage.html'
const TABLI_REVIEW_URL = 'https://chrome.google.com/webstore/detail/tabli/igeehkedfibbnhbfponhjjplpkeomghi/reviews'
const TABLI_FEEDBACK_URL = 'mailto:tabli-feedback@antonycourtney.com'

type WindowId = number
type TMSRef = Ref<TabManagerState>

/**
 * sync a single Chrome window by its Chrome window id
 *
 */
export function syncChromeWindowById (windowId: WindowId, storeRef: TMSRef) {
  chrome.windows.get(windowId, { populate: true }, (chromeWindow) => {
    storeRef.update((state) => state.syncChromeWindow(chromeWindow))
  })
}

/**
 * get all open Chrome windows and synchronize state with our tab window store
 *
 */
export const syncChromeWindows = async (storeRef: TMSRef): TabManagerState => {
  var tPreGet = performance.now()
  const windowList = await chromep.windows.getAll({ populate: true })
  var tPostGet = performance.now()
  log.info('syncChromeWindows: chrome.windows.getAll took ', tPostGet - tPreGet, ' ms')
  var tPreSync = performance.now()
  const nextSt = storeRef.update((state) => state.syncWindowList(windowList))
  var tPostSync = performance.now()
  log.info('syncChromeWindows: syncWindowList took ', tPostSync - tPreSync, ' ms')
  return nextSt
}

/**
 * get current chrome window and mark it as current window in store
 */
export const syncCurrent = async (storeRef: TMSRef): TabManagerState => {
  try {
    const currentChromeWindow = await chromep.windows.getCurrent(null)
    storeRef.update(st => st.setCurrentWindow(currentChromeWindow))
    return storeRef.getValue()
  } catch (e) {
    log.error('syncCurrent: ', e)
    log.log('(ignoring exception)')
    return storeRef.getValue()
  }
}
/**
 * restoreFromAppState
 *
 * Restore a saved window using only App state.
 * Fallback for when no session id available or session restore fails
 */
const restoreFromAppState = (
  lastFocusedTabWindow: TabWindow,
  tabWindow: TabWindow,
  revertOnOpen: boolean,
  mbTab: ?TabItem,
  storeRef: TMSRef) => {
  const attachWindow = (chromeWindow) => {
    storeRef.update((state) => state.attachChromeWindow(tabWindow, chromeWindow))
  }

  /*
   * special case handling of replacing the contents of a fresh window
   */
  chrome.windows.getLastFocused({ populate: true }, (currentChromeWindow) => {
    let urls
    if (mbTab) {
      log.log('restore saved window: restoring single tab: ', mbTab.toJS())
      urls = [ mbTab.url ]
    } else {
      const tabItems = tabWindow.tabItems
      // If a snapshot, only use tabItems that were previously open:
      let targetItems = tabWindow.snapshot ? tabItems.filter(ti => ti.open) : tabItems

      if (revertOnOpen) {
        // So revertOnOpen something of a misnomer. If a snapshot available,
        // limits what's opened to what was previously open and
        // explicitly saved, to minimize the number of tabs we load.
        targetItems = targetItems.filter(ti => ti.saved)
        if (targetItems.count() === 0) {
          // No saved items open, full revert:
          targetItems = tabItems.filter(ti => ti.saved)
        }
      }
      urls = targetItems.map((ti) => ti.url).toArray()
    }
    if (currentChromeWindow.tabs &&
      (currentChromeWindow.tabs.length === 1) &&
      (currentChromeWindow.tabs[0].url === 'chrome://newtab/') &&
      (currentChromeWindow.id != null) &&
      (currentChromeWindow.tabs[0].id != null)) {
      // log.log("found new window -- replacing contents")
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

      chrome.windows.get(currentChromeWindow.id, { populate: true }, attachWindow)
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
      log.log('restoreFromAppState: creating windows: ', createData)
      chrome.windows.create(createData, attachWindow)
    }
  })
}

/**
 * restore a bookmark window.
 *
 * N.B.: NOT exported; called from openWindow
 */
function restoreBookmarkWindow (
  lastFocusedTabWindow: TabWindow,
  tabWindow: TabWindow,
  mbTab: ?TabItem,
  storeRef: TMSRef) {
  log.log('restoreBookmarkWindow: restoring "' + tabWindow.title + '"')
  const st = storeRef.getValue()
  restoreFromAppState(lastFocusedTabWindow, tabWindow, st.preferences.revertOnOpen, mbTab, storeRef)
}

export function openWindow (
  lastFocusedTabWindow: TabWindow,
  targetTabWindow: TabWindow,
  storeRef: TMSRef
) {
  if (targetTabWindow.open) {
    // existing, open window -- just transfer focus
    chrome.windows.update(targetTabWindow.openWindowId, { focused: true })

  // TODO: update focus in winStore
  } else {
    // bookmarked window -- need to open it!
    restoreBookmarkWindow(lastFocusedTabWindow, targetTabWindow, null, storeRef)
  }
}

export const closeTab = async (origTabWindow: TabWindow, tabId: TabId, storeRef: TMSRef): TabManagerState => {
  const origTabCount = origTabWindow.openTabCount
  const chromeWindowId = origTabWindow.openWindowId
  await chromep.tabs.remove(tabId)
  if (origTabCount === 1) {
    storeRef.update((state) => {
      const tabWindow = state.getTabWindowByChromeId(chromeWindowId)
      return state.handleTabWindowClosed(tabWindow)
    })
  } else {
    /*
     * We'd like to do a full chrome.windows.get here so that we get the currently active tab
     * but amazingly we still see the closed tab when we do that!
    chrome.windows.get( tabWindow.openWindowId, { populate: true }, function ( chromeWindow ) {
      log.log("closeTab: got window state: ", chromeWindow)
      winStore.syncChromeWindow(chromeWindow)
    })
    */
    storeRef.update((state) => {
      const tabWindow = state.getTabWindowByChromeId(chromeWindowId)
      return state.handleTabClosed(tabWindow, tabId)
    })
  }
  log.log('actions.closeTab: returning')
  return storeRef.getValue()
}

export function saveTab (tabWindow: TabWindow, tabItem: TabItem, storeRef: TMSRef) {
  const tabMark = { parentId: tabWindow.savedFolderId, title: tabItem.title, url: tabItem.url }
  chrome.bookmarks.create(tabMark, (tabNode) => {
    storeRef.update((state) => state.handleTabSaved(tabWindow, tabItem, tabNode))
  })
}

export function unsaveTab (tabWindow: TabWindow, tabItem: TabItem, storeRef: TMSRef) {
  chrome.bookmarks.remove(tabItem.safeSavedState.bookmarkId, () => {
    storeRef.update((state) => state.handleTabUnsaved(tabWindow, tabItem))
  })
}

export const closeWindow = async (tabWindow: TabWindow, storeRef: TMSRef): TabManagerState => {
  if (!tabWindow.open) {
    log.log('closeWindow: request to close non-open window, ignoring...')
  } else {
    await chromep.windows.remove(tabWindow.openWindowId)
    storeRef.update((state) => state.handleTabWindowClosed(tabWindow))
  }
  return storeRef.getValue()
}

export function expandWindow (tabWindow: TabWindow, expand: ?boolean, storeRef: TMSRef) {
  storeRef.update(state => state.handleTabWindowExpand(tabWindow, expand))
}

// activate a specific tab:
export function activateTab (
  lastFocusedTabWindow: TabWindow,
  targetTabWindow: TabWindow,
  tab: TabItem,
  tabIndex: number,
  storeRef: TMSRef
) {
  // log.log("activateTab: ", tabWindow, tab )

  if (targetTabWindow.open) {
    // OK, so we know this window is open.  What about the specific tab?
    if (tab.open) {
      // Tab is already open, just make it active:
      // log.log("making tab active")
      /*
            chrome.tabs.update(tab.openTabId, { active: true }, () => {
              // log.log("making tab's window active")
              chrome.windows.update(tabWindow.openWindowId, { focused: true })
            })
      */
      tabliBrowser.activateTab(tab.safeOpenState.openTabId, () => {
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

      // log.log("restoring bookmarked tab")
      chrome.tabs.create(createOpts, () => {
      })
    }
  } else {
    log.log('activateTab: opening single tab of saved window')
    // TODO: insert our own callback so we can activate chosen tab after opening window!
    restoreBookmarkWindow(lastFocusedTabWindow, targetTabWindow, tab, storeRef)
  }
}

export function revertWindow (tabWindow: TabWindow, storeRef: TMSRef) {
  /*
   * We used to reload saved tabs, but this is slow, could lose tab state, and doesn't deal gracefully with
   * pinned tabs.
   * Instead we'll try just removing the unsaved tabs and re-opening any saved, closed tabs.
   * This has the downside of not removing duplicates of any saved tabs.
   */
  const unsavedOpenTabIds = tabWindow.tabItems.filter((ti) => ti.open && !ti.saved).map((ti) => ti.safeOpenState.openTabId).toArray()
  const savedClosedUrls = tabWindow.tabItems.filter((ti) => !ti.open && ti.saved).map((ti) => ti.safeSavedState.url).toArray()

  // re-open saved URLs:
  // We need to do this before removing tab ids or window could close if all unsaved
  for (var i = 0; i < savedClosedUrls.length; i++) {
    // need to open it:
    var tabInfo = { windowId: tabWindow.openWindowId, url: savedClosedUrls[i] }
    chrome.tabs.create(tabInfo)
  }

  // blow away all the unsaved open tabs:
  chrome.tabs.remove(unsavedOpenTabIds, () => {
    syncChromeWindowById(tabWindow.openWindowId, storeRef)
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
  storeRef: TMSRef
) {
  // and write out a Bookmarks folder for this newly managed window:
  if (!tabliFolderId) {
    alert('Could not save bookmarks -- no tab manager folder')
  }

  var windowFolder = { parentId: tabliFolderId, title }
  chrome.bookmarks.create(windowFolder, (windowFolderNode) => {
    // log.log( "succesfully created bookmarks folder ", windowFolderNode )
    // log.log( "for window: ", tabWindow )

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
          storeRef.update((state) => state.attachBookmarkFolder(fullFolderNode, chromeWindow))
        })
      })
    })
  })
}

/* stop managing the specified window...move all bookmarks for this managed window to Recycle Bin */
export function unmanageWindow (archiveFolderId: string, tabWindow: TabWindow, storeRef: TMSRef) {
  // log.log("unmanageWindow: ", tabWindow.toJS())
  if (!archiveFolderId) {
    alert('could not move managed window folder to archive -- no archive folder')
    return
  }

  // Could potentially disambiguate names in archive folder...
  chrome.bookmarks.move(tabWindow.savedFolderId, { parentId: archiveFolderId }, () => {
    // log.log("unmanageWindow: bookmark folder moved to archive folder")
    storeRef.update((state) => state.unmanageWindow(tabWindow))
  })
}

export async function setWindowTitle (title: string, tabWindow: TabWindow, storeRef: TMSRef) {
  if (!tabWindow.saved) {
    log.error('attempt to set window title on unsaved window: ', tabWindow.toJS())
  }
  try {
    await chromep.bookmarks.update(tabWindow.savedFolderId, { title })
    log.log('setWindowTitle: updated window title')
  } catch (err) {
    log.error('error updating window title: ', err)
  }
}

export function showHelp () {
  chrome.tabs.create({ url: TABLI_HELP_URL })
}

export function showAbout () {
  chrome.tabs.create({ url: TABLI_ABOUT_URL })
}
export function showReview () {
  chrome.tabs.create({ url: TABLI_REVIEW_URL })
}
export function sendFeedback () {
  chrome.tabs.create({ url: TABLI_FEEDBACK_URL })
}

export function showPreferences () {
  const prefsURL = chrome.runtime.getURL('preferences.html')
  log.log({ prefsURL })
  chrome.tabs.create({ url: prefsURL })
}

export const showPopout = async (winStore: TabManagerState, storeRef: TMSRef): TabManagerState => {
  const ptw = winStore.getPopoutTabWindow()
  if (ptw) {
    tabliBrowser.setFocusedWindow(ptw.openWindowId)
  } else {
    await chromep.windows.create({ url: 'popout.html',
      type: 'popup',
      left: 0,
      top: 0,
      width: Constants.POPOUT_DEFAULT_WIDTH,
      height: Constants.POPOUT_DEFAULT_HEIGHT
    })
  }
  return winStore
}

export const hidePopout = async (winStore: TabManagerState, storeRef: TMSRef): TabManagerState => {
  const ptw = winStore.getPopoutTabWindow()
  if (ptw) {
    const nextSt = await closeWindow(ptw, storeRef)
    return nextSt
  }
  return winStore
}

export function toggleExpandAll (winStore: TabManagerState, storeRef: TMSRef) {
  storeRef.update(st => {
    const allWindows = st.getAll()
    const updWindows = allWindows.map(w => w.remove('expanded'))
    const nextSt = st.registerTabWindows(updWindows).set('expandAll', !st.expandAll)
    return nextSt
  })
}

/*
 * move an open tab (in response to a drag event):
 */
export const moveTabItem = async (
  targetTabWindow: TabWindow,
  targetIndex: number,
  movedTabItem: TabItem,
  storeRef: TMSRef
) => {
  /* The tab being moved can be in 4 possible states based
  * on open and saved flags, same for target window...
  */
  let chromeTab = null
  // Let's first handle whether tab being moved is open,
  // and if so either move or close it:
  if (movedTabItem.open) {
    const openTabId = movedTabItem.safeOpenState.openTabId
    if (targetTabWindow.open) {
      const targetWindowId = targetTabWindow.openWindowId
      const moveProps = { windowId: targetWindowId, index: targetIndex }
      chromeTab = await chromep.tabs.move(openTabId, moveProps)
    } else {
      // Not entirely clear what to do in this case;
      // We'll only remove the tab if tab is saved, since
      // it will at least be available in the target window
      // This means that dragging an (open, !saved) tab to a
      // closed window is a NOP.

      if (movedTabItem.saved && targetTabWindow.saved) {
        // Also need to check to ensure the source window is
        // actually open, since the tab being in the open state
        // may just indicate that the tab was open when window
        // was last open:
        const bookmarkId = movedTabItem.savedState.bookmarkId
        const st = storeRef.getValue()
        const srcTabWindow = st.getSavedWindowByTabBookmarkId(bookmarkId)
        if (srcTabWindow.open) {
          await chromep.tabs.remove(openTabId)
        }
      }
    }
  }
  if (movedTabItem.saved && targetTabWindow.saved) {
    const bookmarkId = movedTabItem.savedState.bookmarkId
    const folderId = targetTabWindow.savedFolderId
    const bmNode = await chromep.bookmarks.move(bookmarkId, { parentId: folderId })
    storeRef.update(st => {
      const srcTabWindow = st.getSavedWindowByTabBookmarkId(bookmarkId)
      const updSt = st.handleSavedTabMoved(srcTabWindow, targetTabWindow, movedTabItem, chromeTab, bmNode)
      return updSt
    })
  }
  // Let's just refresh the whole window:
  // syncChromeWindowById(targetWindowId, storeRef)
}

export function hideRelNotes (winStore: TabManagerState, storeRef: TMSRef) {
  const manifest = chrome.runtime.getManifest()
  chrome.storage.local.set({ readRelNotesVersion: manifest.version }, () => {
    storeRef.update(st => st.set('showRelNotes', false))
  })
}

export function showRelNotes (winStore: TabManagerState, storeRef: TMSRef) {
  storeRef.update(st => st.set('showRelNotes', true))
}

export const loadPreferences = async (storeRef: TMSRef): TabManagerState => {
  const items = await chromep.storage.local.get(USER_PREFS_KEY)
  log.log('loadPreferences: read: ', items)
  const prefsStr = items[USER_PREFS_KEY]
  const userPrefs = prefs.Preferences.deserialize(prefsStr)
  log.log('loadPreferences: userPrefs: ', userPrefs.toJS())
  storeRef.update(st => st.set('preferences', userPrefs))
  return storeRef.getValue()
}

export const savePreferences = async (userPrefs: prefs.Preferences, storeRef: TMSRef): TabManagerState => {
  let saveObj = {}
  saveObj[USER_PREFS_KEY] = userPrefs.serialize()
  await chromep.storage.local.set(saveObj)
  log.log('wrote preferences to local storage: ', saveObj)
  // and update application state:
  storeRef.update(st => st.set('preferences', userPrefs))
  return storeRef.getValue()
}

export const setReloadHandler = (reloadFn: () => void) => {
  const bgPage = chrome.extension.getBackgroundPage()
  bgPage.reloadHandler = reloadFn
}

export const reload = async () => {
  const bgPage = chrome.extension.getBackgroundPage()
  const reloadHandler = bgPage.reloadHandler
  if (reloadHandler) {
    reloadHandler()
  }
}
