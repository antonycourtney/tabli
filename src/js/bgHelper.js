// @flow
/**
 * Background helper page.
 * Gathering bookmark and window state and places in local storage so that
 * popup rendering will be as fast as possible
 */
/* global Blob, URL */

// import * as _ from 'lodash'
import has from 'lodash/has'
import fromPairs from 'lodash/fromPairs'
import * as Immutable from 'immutable'
import * as semver from 'semver'
import * as TabWindow from './tabWindow'
import TabManagerState from './tabManagerState'
import * as utils from './utils'
import * as actions from './actions'
import ViewRef from './viewRef'
import ChromePromise from 'chrome-promise'
const chromep = ChromePromise

const _ = { has, fromPairs }

const tabliFolderTitle = 'Tabli Saved Windows'
const archiveFolderTitle = '_Archive'
let tabliFolderId = null
let archiveFolderId = null

const isValidWindowFolder = (bookmarkNode: Object) => {
  if (_.has(bookmarkNode, 'url')) {
    return false
  }
  if (bookmarkNode.title[0] === '_') {
    return false
  }
  return true
}

/* On startup load managed windows from bookmarks folder */
function loadManagedWindows (winStore, tabliFolder) {
  var folderTabWindows = []
  for (var i = 0; i < tabliFolder.children.length; i++) {
    var windowFolder = tabliFolder.children[i]
    if (isValidWindowFolder(windowFolder)) {
      folderTabWindows.push(TabWindow.makeFolderTabWindow(windowFolder))
    }
  }

  return winStore.registerTabWindows(folderTabWindows)
}

/*
 * given a specific parent Folder node, ensure a particular child exists.
 * returns: Promise<BookmarkTreeNode>
 */
async function ensureChildFolder (parentNode, childFolderName) {
  if (parentNode.children) {
    for (var i = 0; i < parentNode.children.length; i++) {
      var childFolder = parentNode.children[i]
      if (childFolder.title.toLowerCase() === childFolderName.toLowerCase()) {
        // exists
        // console.log('found target child folder: ', childFolderName)
        return childFolder
      }
    }
  }

  console.log('Child folder ', childFolderName, ' Not found, creating...')

  // If we got here, child Folder doesn't exist
  var folderObj = { parentId: parentNode.id, title: childFolderName }
  return chromep.bookmarks.create(folderObj)
}

/**
 *
 * initialize showRelNotes field of TabManagerState based on comparing
 * relNotes version from localStorage with this extension manifest
 *
 * @return {TabManagerState} possibly updated TabManagerState
 */
function initRelNotes (st, storedVersion) {
  const manifest = chrome.runtime.getManifest()
  //  console.log("initRelNotes: storedVersion: ", storedVersion, ", manifest: ", manifest.version)
  const showRelNotes = !semver.valid(storedVersion) || semver.gt(manifest.version, storedVersion)
  return st.set('showRelNotes', showRelNotes)
}

/**
 * acquire main folder and archive folder and initialize
 * window store
 *
 * returns: Promise<TabManagerState>
 */
const initWinStore = async () => {
  const tree = await chromep.bookmarks.getTree()
  var otherBookmarksNode = tree[0].children[1]

  // console.log( "otherBookmarksNode: ", otherBookmarksNode )
  const tabliFolder = await ensureChildFolder(otherBookmarksNode, tabliFolderTitle)
  // console.log('tab manager folder acquired.')
  tabliFolderId = tabliFolder.id
  const archiveFolder = await ensureChildFolder(tabliFolder, archiveFolderTitle)
  // console.log('archive folder acquired.')
  archiveFolderId = archiveFolder.id
  const subTreeNodes = await chromep.bookmarks.getSubTree(tabliFolder.id)
  // console.log("bookmarks.getSubTree for tabliFolder: ", subTreeNodes)
  const baseWinStore = new TabManagerState({ folderId: tabliFolderId, archiveFolderId })
  const loadedWinStore = loadManagedWindows(baseWinStore, subTreeNodes[0])

  const items = await chromep.storage.local.get({ readRelNotesVersion: '' })
  const relNotesStore = initRelNotes(loadedWinStore, items.readRelNotesVersion)

  return relNotesStore
}

function setupConnectionListener (storeRef) {
  chrome.runtime.onConnect.addListener((cport): void => {
    const port : any = cport // to deal with typo in 'onDisconnect' in flow-interfaces-chrome
    port.onMessage.addListener((msg) => {
      var listenerId = msg.listenerId
      port.onDisconnect.addListener(() => {
        storeRef.removeViewListener(listenerId)
      //        console.log("Removed view listener ", listenerId)
      //        console.log("after remove: ", storeRef)
      })
    })
  })
}

/**
 * Download the specified object as JSON (for testing)
 */
function downloadJSON (dumpObj, filename) {
  const dumpStr = JSON.stringify(dumpObj, null, 2)
  const winBlob = new Blob([dumpStr], { type: 'application/json' })
  const url = URL.createObjectURL(winBlob)
  chrome.downloads.download({ url, filename })
}

/**
 * dump all windows -- useful for creating performance tests
 *
 * NOTE:  Requires the "downloads" permission in the manifest!
 */
function dumpAll (winStore) { // eslint-disable-line no-unused-vars
  const allWindows = winStore.getAll()

  const jsWindows = allWindows.map((tw) => tw.toJS())

  const dumpObj = { allWindows: jsWindows }

  downloadJSON(dumpObj, 'winStoreSnap.json')
}

function dumpChromeWindows () { // eslint-disable-line no-unused-vars
  chrome.windows.getAll({ populate: true }, (chromeWindows) => {
    downloadJSON({ chromeWindows }, 'chromeWindowSnap.json')
  })
}

function onTabCreated (storeRef, tab, markActive) {
  console.log('onTabCreated: ', tab)
  storeRef.update(state => {
    const tabWindow = state.getTabWindowByChromeId(tab.windowId)
    if (!tabWindow) {
      console.warn('tabs.onCreated: window id not found: ', tab.windowId)
      return state
    }
    /*
     * This snippet tries to catch the "Open in New Window" context
     * menu action and attach it to the relevant saved window.
     * But instead we're going with the simpler, more predictable
     * UX that clicking on a saved tab in a closed, saved window
     * will open just that saved tab and attach to the window.
     *
        const firstTab = (tabWindow.openTabCount === 0)
        if (firstTab && tabWindow.windowType !== 'popup') {
          console.log('detected first tab in newly opened window')
          window.setTimeout(() => {
            maybeAttachNewWindow(storeRef, tab.windowId)
          }, 300)
        }
    */
    const st = state.handleTabCreated(tabWindow, tab)
    const nw = st.getTabWindowByChromeId(tab.windowId)
    const ast = markActive ? st.handleTabActivated(nw, tab.id) : st
    return ast
  })
  const st = storeRef.getValue()
  if (st.preferences.dedupeTabs) {
    // let's try passing tab as changeInfo since presumaby the
    // keys are the same:
    dedupeTab(storeRef, tab.id, tab, tab)
  }
}

function onTabRemoved (storeRef, windowId, tabId) {
  console.log('onTabRemoved: ', windowId, tabId)
  storeRef.update(state => {
    const tabWindow = state.getTabWindowByChromeId(windowId)
    if (!tabWindow) {
      console.warn('tabs.onTabRemoved: window id not found: ', windowId)
      return state
    }
    return state.handleTabClosed(tabWindow, tabId)
  })
}

const dedupeTab = async (storeRef, tabId, changeInfo, tab) => {
  const url = changeInfo.url
  if (url != null) {
    const st = storeRef.getValue()
    const matchPairs = st.findURL(url)
    // and filter out the tab we're checking:
    const isSelf = (tw, ti) => (
      tw.open && tw.openWindowId === tab.windowId &&
      ti.open && ti.openState.openTabId === tabId
    )
    const filteredMatchPairs = matchPairs.filter(([tw, ti]) => !isSelf(tw, ti))
    if (filteredMatchPairs.length > 0) {
      const [origTabWindow, origTab] = filteredMatchPairs[0]
      // if we wanted to programatically go back instead of closing:
      // (required <all_urls> permission in manifest)
      // const revertScript = {code: 'history.back();'}
      // await chromep.tabs.executeScript(tabId, revertScript)

      const tabWindow = st.getTabWindowByChromeId(tab.windowId)
      const tabClosedSt = await actions.closeTab(tabWindow, tabId, storeRef)
      const currentWindow = tabClosedSt.getCurrentWindow()
      actions.activateTab(currentWindow, origTabWindow, origTab, 0, storeRef)
    }
  }
}

const onTabUpdated = (storeRef, tabId, changeInfo, tab) => {
  storeRef.update(state => {
    const tabWindow = state.getTabWindowByChromeId(tab.windowId)
    if (!tabWindow) {
      console.warn('tabs.onUpdated: window id not found: ', tab.windowId)
      return state
    }
    return state.handleTabUpdated(tabWindow, tabId, changeInfo)
  })
  const st = storeRef.getValue()
  if (st.preferences.dedupeTabs) {
    dedupeTab(storeRef, tabId, changeInfo, tab)
  }
}

const onBookmarkCreated = (storeRef, id, bookmark) => {
  console.log('boomark created: ', id, bookmark)
  storeRef.update(state => {
    let nextSt = state
    /* is this bookmark a folder? */
    if (!isValidWindowFolder(bookmark)) {
      // Ordinary (non-folder) bookmark
      // Is parent a Tabli window folder?
      const tabWindow = state.getSavedWindowByBookmarkId(bookmark.parentId)
      if (tabWindow) {
        // Do we already have this as a saved tab?
        const entry = tabWindow.findChromeBookmarkId(bookmark.id)
        if (!entry) {
          console.log('new bookmark in saved window: ', bookmark)
          nextSt = state.handleBookmarkCreated(tabWindow, bookmark)
        }
      }
    } else {
      // folder (window) bookmark
      // Is this a Tabli window folder (parent is Tabli folder?)
      if (bookmark.parentId === tabliFolderId) {
        const tabWindow = state.getSavedWindowByBookmarkId(bookmark.id)
        if (!tabWindow) {
          // new saved window (bookmark folder) not in local state
          const tw = TabWindow.makeFolderTabWindow(bookmark)
          nextSt = state.registerTabWindow(tw)
        }
      }
    }
    return nextSt
  })
}

/*
 * higher-order helper that determines whether a bookmark node
 * is either a saved window folder or saved tab, and invokes
 * handles for each case
 */

const handleBookmarkUpdate = (storeRef, parentId, bookmark, handleTab, handleTabWindow) => {
  console.log('got bookmark update: ', bookmark)
  storeRef.update(state => {
    let nextSt = state
    /* is this bookmark a folder? */
    if (!isValidWindowFolder(bookmark)) {
      // Ordinary (non-folder) bookmark
      // Is parent a Tabli window folder?
      const tabWindow = state.getSavedWindowByBookmarkId(parentId)
      if (tabWindow) {
        // Do we already have this as a saved tab?
        const entry = tabWindow.findChromeBookmarkId(bookmark.id)
        if (entry) {
          const [index, tabItem] = entry
          nextSt = handleTab(state, tabWindow, index, tabItem)
        }
      }
    } else {
      // folder (window) bookmark
      // Is this a Tabli window folder (parent is Tabli folder?)
      if (parentId === tabliFolderId) {
        const tabWindow = state.getSavedWindowByBookmarkId(bookmark.id)
        if (tabWindow) {
          nextSt = handleTabWindow(state, tabWindow)
        }
      }
    }
    return nextSt
  })
}

const onBookmarkRemoved = (storeRef, id, removeInfo) => {
  console.log('onBookmarkRemoved: ', id, removeInfo)
  handleBookmarkUpdate(storeRef, removeInfo.parentId, removeInfo.node,
    (st, tabWindow, index, tabItem) => st.handleTabUnsaved(tabWindow, tabItem),
    (st, tabWindow) => st.unmanageWindow(tabWindow)
  )
}

const safeUpdateWindowTitle = (st, tabWindow, title) => {
  return (title == null) ? st : st.updateSavedWindowTitle(tabWindow, title)
}

const onBookmarkChanged = async (storeRef, id, changeInfo) => {
  console.log('bookmark changed: ', id, changeInfo)
  const res = await chromep.bookmarks.get(id)
  if (res && res.length > 0) {
    const bookmark = res[0]
    handleBookmarkUpdate(storeRef, bookmark.parentId, bookmark,
      (st, tabWindow, index, tabItem) => st.handleBookmarkUpdated(tabWindow, tabItem, changeInfo),
      (st, tabWindow) => safeUpdateWindowTitle(st, tabWindow, changeInfo.title)
    )
  }
}

const onBookmarkMoved = (storeRef, id, moveInfo) => {
  console.log('bookmark moved: ', id, moveInfo)
  if (moveInfo.oldParentId === tabliFolderId && moveInfo.parentId === archiveFolderId) {
    // looks like window was unmanaged:
    storeRef.update(state => {
      let nextSt = state
      const tabWindow = state.getSavedWindowByBookmarkId(id.toString())
      if (tabWindow) {
        nextSt = state.unmanageWindow(tabWindow)
      }
      return nextSt
    })
  }
}

function registerEventHandlers (storeRef) {
  // window events:
  chrome.windows.onRemoved.addListener((windowId) => {
    storeRef.update((state) => {
      const tabWindow = state.getTabWindowByChromeId(windowId)
      const st = tabWindow ? state.handleTabWindowClosed(tabWindow) : state
      return st
    })
  })
  chrome.windows.onCreated.addListener(chromeWindow => {
    storeRef.update((state) => {
      return state.syncChromeWindow(chromeWindow)
    })
  })
  chrome.windows.onFocusChanged.addListener(windowId => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      return
    }
    storeRef.update((state) => {
      return state.setCurrentWindowId(windowId)
    })
  },
  { windowTypes: ['normal'] }
  )

  // tab events:
  chrome.tabs.onCreated.addListener(tab => onTabCreated(storeRef, tab))
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
    onTabUpdated(storeRef, tabId, changeInfo, tab))
  chrome.tabs.onActivated.addListener(activeInfo => {
    // console.log("tabs.onActivated: ", activeInfo)
    storeRef.update((state) => {
      const tabWindow = state.getTabWindowByChromeId(activeInfo.windowId)
      if (!tabWindow) {
        console.warn('tabs.onActivated: window id not found: ', activeInfo.windowId, activeInfo)
        return state
      }
      const st = tabWindow ? state.handleTabActivated(tabWindow, activeInfo.tabId) : state
      return st
    })
  })
  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (removeInfo.isWindowClosing) {
      // window closing, ignore...
      return
    }
    onTabRemoved(storeRef, removeInfo.windowId, tabId)
  })
  chrome.tabs.onReplaced.addListener((addedTabId: number, removedTabId: number) => {
    console.log('tabs.onReplaced: added: ', addedTabId, ', removed: ', removedTabId)
    storeRef.update(state => {
      const tabWindow = state.getTabWindowByChromeTabId(removedTabId)
      if (!tabWindow) {
        console.warn('tabs.onReplaced: could not find window for removed tab: ', removedTabId)
        return state
      }
      const nextSt = state.handleTabClosed(tabWindow, removedTabId)

      // And arrange for the added tab to be added to the window:
      chrome.tabs.get(addedTabId, tab => onTabCreated(storeRef, tab))
      return nextSt
    })
  })
  chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
    // console.log("tab.onMoved: ", tabId, moveInfo)
    // Let's just refresh the whole window:
    actions.syncChromeWindowById(moveInfo.windowId, storeRef)
  })
  chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
    // just handle like tab closing:
    onTabRemoved(storeRef, detachInfo.oldWindowId, tabId)
  })
  chrome.tabs.onAttached.addListener((tabId: number, attachInfo) => {
    // handle like tab creation:
    chrome.tabs.get(tabId, tab => onTabCreated(storeRef, tab, true))
  })
  chrome.bookmarks.onCreated.addListener((id, bookmark) =>
    onBookmarkCreated(storeRef, id, bookmark))
  chrome.bookmarks.onRemoved.addListener((index, bookmark) =>
    onBookmarkRemoved(storeRef, index, bookmark))
  chrome.bookmarks.onMoved.addListener((id, moveInfo) =>
    onBookmarkMoved(storeRef, id, moveInfo))
  chrome.bookmarks.onChanged.addListener((id, changeInfo) =>
    onBookmarkChanged(storeRef, id, changeInfo))
}

const MATCH_THRESHOLD = 0.25
// type constructor for match info:
const MatchInfo = Immutable.Record({ windowId: -1, matches: Immutable.Map(), bestMatch: null, tabCount: 0 })

const getWindowMatchInfo = (bmStore, urlIdMap, w) => {
  // matches :: Array<Set<BookmarkId>>
  const matchSets = w.tabs.map(t => urlIdMap.get(t.url, null)).filter(x => x)
  // countMaps :: Array<Map<BookmarkId,Num>>
  const countMaps = matchSets.map(s => s.countBy(v => v))

  // Now let's reduce array, merging all maps into a single map, aggregating counts:
  const aggMerge = (mA, mB) => mA.mergeWith((prev, next) => prev + next, mB)

  // matchMap :: Map<BookmarkId,Num>
  const matchMap = countMaps.reduce(aggMerge, Immutable.Map())

  /*
   * The logic here is convoluted but seems to work OK
   * in practice.
   */
  // Ensure (# matches / # saved URLs) for each bookmark > MATCH_THRESHOLD
  function aboveMatchThreshold (matchCount, bookmarkId) {
    const tabCount = w.tabs.length
    const savedTabWindow = bmStore.bookmarkIdMap.get(bookmarkId)
    const savedUrlCount = savedTabWindow.tabItems.count()
    const matchRatio = matchCount / savedUrlCount
    // console.log("match threshold for '", savedTabWindow.title, "': ", matchRatio, matchCount, savedUrlCount)
    return ((matchCount > 1) ||
            (savedUrlCount === 1 && matchCount === 1) ||
            (matchCount === tabCount) ||
            (matchRatio >= MATCH_THRESHOLD))
  }

  const threshMap = matchMap.filter(aboveMatchThreshold)

  const bestMatch = utils.bestMatch(threshMap)

  return new MatchInfo({ windowId: w.id, matches: matchMap, bestMatch, tabCount: w.tabs.length })
}

/**
 * Heuristic scan to find any open windows that seem to have come from saved windows
 * and re-attach them on initial load of the background page. Mainly useful for
 * development and for re-starting Tabli.
 *
 * Heuristics here are imperfect; only way to get this truly right would be with a proper
 * session management API.
 *
 * return: Promise<TabManagerState>
 *
 */
function attachWindowList (bmStore, windowList) {
  const urlIdMap = bmStore.getUrlBookmarkIdMap()

  /**
   * We could come up with better heuristics here, but for now we'll be conservative
   * and only re-attach when there is an unambiguous best match
   */
  // Only look at windows that match exactly one bookmark folder
  // (Could be improved by sorting entries on number of matches and picking best (if there is one))
  const windowMatchInfo = Immutable.Seq(windowList)
    .map(w => getWindowMatchInfo(bmStore, urlIdMap, w))
    .filter(mi => mi.bestMatch)

  // console.log("windowMatchInfo: ", windowMatchInfo.toJS())

  // Now gather an inverse map of the form:
  // Map<BookmarkId,Map<WindowId,Num>>
  const bmMatches = windowMatchInfo.groupBy((mi) => mi.bestMatch)

  // console.log("bmMatches: ", bmMatches.toJS())

  // bmMatchMaps: Map<BookmarkId,Map<WindowId,Num>>
  const bmMatchMaps = bmMatches.map(mis => {
    // mis :: Seq<MatchInfo>

    // mercifully each mi will have a distinct windowId at this point:
    const entries = mis.map(mi => {
      const matchTabCount = mi.matches.get(mi.bestMatch)
      return [mi.windowId, matchTabCount]
    })

    return Immutable.Map(entries)
  })

  // console.log("bmMatchMaps: ", bmMatchMaps.toJS())

  // bestBMMatches :: Seq.Keyed<BookarkId,WindowId>
  const bestBMMatches = bmMatchMaps.map(mm => utils.bestMatch(mm)).filter(ct => ct)
  // console.log("bestBMMatches: ", bestBMMatches.toJS())

  // Form a map from chrome window ids to chrome window snapshots:
  const chromeWinMap = _.fromPairs(windowList.map(w => [w.id, w]))

  // And build up our attached state by attaching to each window in bestBMMatches:

  const attacher = (st, windowId, bookmarkId) => {
    const chromeWindow = chromeWinMap[windowId]
    const bmTabWindow = st.bookmarkIdMap.get(bookmarkId)
    const nextSt = st.attachChromeWindow(bmTabWindow, chromeWindow)
    return nextSt
  }

  const attachedStore = bestBMMatches.reduce(attacher, bmStore)

  return attachedStore
}

/**
 * get all Chrome windows and attach to best match:
 */
async function reattachWindows (bmStore) {
  const windowList = await chromep.windows.getAll({ populate: true })

  return attachWindowList(bmStore, windowList)
}

/**
 * For a newly created window, check if we should attach it to an existing
 * closed, saved window.  Intended primarily for "Open in New Window" on
 * a saved tab.
 * NOTE: This is fully functional, but is no longer actually used.
 * After building this out, decided a simpler an more flexible UX
 * is to attach a saved window when single-clicking on a saved, closed tab,
 * but allow the "Open in New Window" context menu action to remain detached.
 */
async function maybeAttachNewWindow (stRef, windowId) { // eslint-disable-line no-unused-vars
  try {
    const chromeWindow = await chromep.windows.get(windowId, { populate: true, windowTypes: ['normal'] })
    if (!chromeWindow) {
      console.warn('maybeAttachNewWindow: null window, ignoring....')
      return
    }

    stRef.update(st => {
      return attachWindowList(st, [chromeWindow])
    })
  } catch (e) {
    console.warn('caught error getting chrome window (ignoring...): ', e)
  }
}

/**
 * load window state for saved windows from local storage and attach to
 * any closed, saved windows
 */
async function loadSnapState (bmStore) {
  const items = await chromep.storage.local.get('savedWindowState')
  if (!items) {
    return bmStore
  }
  const savedWindowStateStr = items.savedWindowState
  if (!savedWindowStateStr) {
    console.log('loadSnapState: no saved window state found in local storage')
    return bmStore
  }
  const savedWindowState = JSON.parse(savedWindowStateStr)
  const closedWindowsMap = bmStore.bookmarkIdMap.filter(bmWin => !bmWin.open)
  const closedWindowIds = closedWindowsMap.keys()
  let savedOpenTabsMap = {}
  for (let id of closedWindowIds) {
    const savedState = savedWindowState[id]
    if (savedState) {
      const openTabItems = savedState.tabItems.filter(ti => ti.open)
      if (openTabItems.length > 0) {
        const convTabItems = openTabItems.map(ti => TabWindow.tabItemFromJS(ti))
        const tiList = Immutable.List(convTabItems)
        savedOpenTabsMap[id] = tiList
      }
    }
  }
  const keyCount = Object.keys(savedOpenTabsMap).length
  console.log('read window snapshot state for ', keyCount, ' saved windows')
  const updBookmarkMap = bmStore.bookmarkIdMap.map((tabWindow, bmId) => {
    const snapTabs = savedOpenTabsMap[bmId]
    if (snapTabs == null) {
      return tabWindow
    }
    const baseSavedItems = tabWindow.tabItems.filter(ti => ti.saved).map(TabWindow.resetSavedItem)
    const mergedTabs = TabWindow.mergeSavedOpenTabs(baseSavedItems, snapTabs)
    return (tabWindow
      .set('tabItems', mergedTabs)
      .set('snapshot', true))
  })
  const nextStore = bmStore.set('bookmarkIdMap', updBookmarkMap)
  console.log('merged window state snapshot from local storage')
  return nextStore
}

const testChromeTab =  {
  "active": false,
  "audible": false,
  "favIconUrl": "https://facebook.github.io/immutable-js/static/favicon.png",
  "height": 862,
  "highlighted": false,
  "id": 240,
  "incognito": false,
  "index": 0,
  "muted": false,
  "mutedCause": "",
  "pinned": false,
  "selected": false,
  "status": "complete",
  "title": "Immutable.js",
  "url": "https://facebook.github.io/immutable-js/",
  "width": 1258,
  "windowId": 239
}

async function main () {
  try {
    console.log('bgHelper started, env: ', process.env.NODE_ENV)
    let obj = { a: 20 }
    Object.defineProperty(obj, 'x', { value: 27 })
    Object.defineProperty(Object.getPrototypeOf(obj), 'y', { get: function () { return this.x + 10 } })
    console.log('obj: ', obj, ', obj.x: ', obj.x, 'obj.y: ', obj.y)
    const tab = TabWindow.makeOpenTabItem(testChromeTab)
    console.log('test tab: ', tab.toJS())
    console.log('test tab openState: ', tab.get('openState').toJS())
    actions.setReloadHandler(main)
    const rawBMStore = await initWinStore()
    const attachBMStore = await reattachWindows(rawBMStore)
    const bmStore = await loadSnapState(attachBMStore)

    const storeRef = new ViewRef(bmStore)
    window.storeRef = storeRef

    await actions.loadPreferences(storeRef)
    await actions.syncChromeWindows(storeRef)
    console.log('initial sync of chrome windows complete.')
    const syncedStore = await actions.syncCurrent(storeRef)
    // dumpAll(syncedStore)
    // dumpChromeWindows()

    setupConnectionListener(storeRef)

    registerEventHandlers(storeRef)

    // In case of restart: hide any previously open popout that
    // might be hanging around...
    // console.log('store before hiding popout: ', syncedStore.toJS())
    const noPopStore = await actions.hidePopout(syncedStore, storeRef)

    // console.log('noPopStore: ', noPopStore)

    if (noPopStore.preferences.popoutOnStart) {
      actions.showPopout(noPopStore, storeRef)
    }
    chrome.commands.onCommand.addListener(command => {
      if (command === 'show_popout') {
        actions.showPopout(window.storeRef.getValue(), storeRef)
      }
    })
  } catch (e) {
    console.error('*** caught top level exception: ', e)
  }
}

main()
