// @flow
/**
 * Background helper page.
 * Gathering bookmark and window state and places in local storage so that
 * popup rendering will be as fast as possible
 */
/* global Blob, URL */

import * as _ from 'lodash'
import * as Immutable from 'immutable'
import * as semver from 'semver'
import * as TabWindow from './tabWindow'
import TabManagerState from './tabManagerState'
import * as utils from './utils'
import * as actions from './actions'
import ViewRef from './viewRef'
import { refUpdater } from 'oneref'
import ChromePromise from 'chrome-promise'
const chromep = new ChromePromise()

/*
import * as searchOps from './searchOps'
import ChromePromise from 'chrome-promise'
const chromep = new ChromePromise()
*/

const tabmanFolderTitle = 'Tabli Saved Windows'
const archiveFolderTitle = '_Archive'

let lastSessionTimestamp = -1

/* On startup load managed windows from bookmarks folder */
function loadManagedWindows (winStore, tabManFolder) {
  var folderTabWindows = []
  for (var i = 0; i < tabManFolder.children.length; i++) {
    var windowFolder = tabManFolder.children[i]
    if (windowFolder.title[0] === '_') {
      continue
    }

    var fc = windowFolder.children
    if (!fc) {
      console.log('Found bookmarks folder with no children, skipping: ', fc)
      continue
    }

    folderTabWindows.push(TabWindow.makeFolderTabWindow(windowFolder))
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
        console.log('found target child folder: ', childFolderName)
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
  var tabmanFolderId = null
  var archiveFolderId = null

  const tree = await chromep.bookmarks.getTree()
  var otherBookmarksNode = tree[0].children[1]

  // console.log( "otherBookmarksNode: ", otherBookmarksNode )
  const tabManFolder = await ensureChildFolder(otherBookmarksNode, tabmanFolderTitle)
  // console.log('tab manager folder acquired.')
  tabmanFolderId = tabManFolder.id
  const archiveFolder = await ensureChildFolder(tabManFolder, archiveFolderTitle)
  // console.log('archive folder acquired.')
  archiveFolderId = archiveFolder.id
  const subTreeNodes = await chromep.bookmarks.getSubTree(tabManFolder.id)
  // console.log("bookmarks.getSubTree for TabManFolder: ", subTreeNodes)
  const baseWinStore = new TabManagerState({folderId: tabmanFolderId, archiveFolderId})
  const loadedWinStore = loadManagedWindows(baseWinStore, subTreeNodes[0])

  const items = await chromep.storage.local.get({readRelNotesVersion: ''})
  const relNotesStore = initRelNotes(loadedWinStore, items.readRelNotesVersion)

  return relNotesStore
}

function setupConnectionListener (storeRef) {
  chrome.runtime.onConnect.addListener((cport): void => {
    const port : any = cport  // to deal with typo in 'onDisconnect' in flow-interfaces-chrome
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

/**
 * create a TabMan element, render it to HTML and save it for fast loading when
 * opening the popup
 */
function onTabCreated (uf, tab, markActive) {
  // console.log("onTabCreated: ", tab)
  uf(state => {
    const tabWindow = state.getTabWindowByChromeId(tab.windowId)
    if (!tabWindow) {
      console.warn('tabs.onCreated: window id not found: ', tab.windowId)
      return state
    }
    const st = state.handleTabCreated(tabWindow, tab)
    const nw = st.getTabWindowByChromeId(tab.windowId)
    const ast = markActive ? st.handleTabActivated(nw, tab.id) : st
    return ast
  })
}

function onTabRemoved (uf, windowId, tabId) {
  uf(state => {
    const tabWindow = state.getTabWindowByChromeId(windowId)
    if (!tabWindow) {
      console.warn('tabs.onTabRemoved: window id not found: ', windowId)
      return state
    }
    return state.handleTabClosed(tabWindow, tabId)
  })
}

/*
 * A little helper for running an async function returning a
 * state -> state update function from a non-async context,
 * which becomes a Promise<state -> state)
 */
/*
const asyncRunner = (uf) => (af) => {
  let stp = af()
  stp.then(sf => uf(sf))
    .catch(err => {
      console.error('asyncRunner: error executing async function: ', err)
    })
}
*/

/*
 * It's super gross to use the uf to grab state, pass it along
 * to actions, and return a state->state updater, but we both want to use the current state and ensure
 * that we update the latest version of state after any async actions
 */
/*
 * TODO
const depudeTab = async (uf, tabId, changeInfo, tab) => {
  uf(state => {
  const url = changeInfo.url
  if (url != null) {
    const urlRE = new RegExp('^' + url + '$')
    // call searchOps...
    const openWindows = this.getOpen().toArray()
    const filteredWindows = searchOps.filterTabWindows(openWindows,
      urlRE, {matchUrl: true})
    if (filteredWindows.length > 0) {
      const ftw = filteredWindows[0]
      const {tabWindow: targetTabWindow, itemMatches} = ftw
      const targetTab = itemMatches.first()
      console.log('handleTabUpdated: duplicate url detected - closing tab')
      await chromep.tabs.remove(tabId)
      console.log('handleTabUpdated: tab closed, switching to existing tab:')
      const currentWindow = this.getCurrentWindow()
      actions.activateTab(currentWindow, targetTabWindow, targetTab, 0, uf)
    }
  }
}
*/

const onTabUpdated = (uf, tabId, changeInfo, tab) => {
  uf(state => {
    const tabWindow = state.getTabWindowByChromeId(tab.windowId)
    if (!tabWindow) {
      console.warn('tabs.onUpdated: window id not found: ', tab.windowId)
      return state
    }
    return state.handleTabUpdated(tabWindow, tabId, changeInfo)
  })
  /* asyncRunner(uf)(async () => dedupeTab(uf, tabId, changeInfo, tab)) */
}

function registerEventHandlers (uf) {
  // window events:
  chrome.windows.onRemoved.addListener((windowId) => {
    uf((state) => {
      const tabWindow = state.getTabWindowByChromeId(windowId)
      console.log('got window closed event')
      const st = tabWindow ? state.handleTabWindowClosed(tabWindow) : state
      return st
    })
  })
  chrome.windows.onCreated.addListener(chromeWindow => {
    console.log('windows.onCreated: ', chromeWindow)
    uf((state) => {
      return state.syncChromeWindow(chromeWindow)
    })
  })
  chrome.windows.onFocusChanged.addListener(windowId => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      return
    }
    uf((state) => {
      return state.setCurrentWindowId(windowId)
    })
  },
    { windowTypes: ['normal'] }
  )

  // tab events:
  chrome.tabs.onCreated.addListener(tab => onTabCreated(uf, tab))
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
    onTabUpdated(uf, tabId, changeInfo, tab))
  chrome.tabs.onActivated.addListener(activeInfo => {
    // console.log("tabs.onActivated: ", activeInfo)
    uf((state) => {
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
    onTabRemoved(uf, removeInfo.windowId, tabId)
  })
  chrome.tabs.onReplaced.addListener((addedTabId: number, removedTabId: number) => {
    console.log('tabs.onReplaced: added: ', addedTabId, ', removed: ', removedTabId)
    uf(state => {
      const tabWindow = state.getTabWindowByChromeTabId(removedTabId)
      if (!tabWindow) {
        console.warn('tabs.onReplaced: could not find window for removed tab: ', removedTabId)
        return state
      }
      const nextSt = state.handleTabClosed(tabWindow, removedTabId)

      // And arrange for the added tab to be added to the window:
      chrome.tabs.get(addedTabId, tab => onTabCreated(uf, tab))
      return nextSt
    })
  })
  chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
    // console.log("tab.onMoved: ", tabId, moveInfo)
    // Let's just refresh the whole window:
    actions.syncChromeWindowById(moveInfo.windowId, uf)
  })
  chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
    // just handle like tab closing:
    onTabRemoved(uf, detachInfo.oldWindowId, tabId)
  })
  chrome.tabs.onAttached.addListener((tabId: number, attachInfo) => {
    // handle like tab creation:
    chrome.tabs.get(tabId, tab => onTabCreated(uf, tab, true))
  })

  chrome.sessions.onChanged.addListener(() => {
    chrome.sessions.getRecentlyClosed(sessions => {
      const winSessions = sessions.filter(s => 'window' in s).filter(s => s.lastModified > lastSessionTimestamp)
      uf(st => attachSessions(st, winSessions))
    })
  })
}

/**
 * Heuristic scan to find any open windows that seem to have come from saved windows
 * and re-attach them on initial load of the background page. Mainly useful for
 * development and for re-starting Tablie.
 *
 * Heuristics here are imperfect; only way to get this truly right would be with a proper
 * session management API.
 *
 * return: Promise<TabManagerState>
 *
 */
async function reattachWindows (bmStore) {
  const MATCH_THRESHOLD = 0.4

  const urlIdMap = bmStore.getUrlBookmarkIdMap()

  // type constructor for match info:
  const MatchInfo = Immutable.Record({windowId: -1, matches: Immutable.Map(), bestMatch: null, tabCount: 0})

  const windowList = await chromep.windows.getAll({ populate: true })

  function getMatchInfo (w) {
    // matches :: Array<Set<BookmarkId>>
    const matchSets = w.tabs.map(t => urlIdMap.get(t.url, null)).filter(x => x)
    // countMaps :: Array<Map<BookmarkId,Num>>
    const countMaps = matchSets.map(s => s.countBy(v => v))

    // Now let's reduce array, merging all maps into a single map, aggregating counts:
    const aggMerge = (mA, mB) => mA.mergeWith((prev, next) => prev + next, mB)

    // matchMap :: Map<BookmarkId,Num>
    const matchMap = countMaps.reduce(aggMerge, Immutable.Map())

    // Ensure (# matches / # saved URLs) for each bookmark > MATCH_THRESHOLD
    function aboveMatchThreshold (matchCount, bookmarkId) {
      const savedTabWindow = bmStore.bookmarkIdMap.get(bookmarkId)
      const savedUrlCount = savedTabWindow.tabItems.count()
      const matchRatio = matchCount / savedUrlCount
      // console.log("match threshold for '", savedTabWindow.title, "': ", matchRatio, matchCount, savedUrlCount)
      return (matchRatio >= MATCH_THRESHOLD)
    }

    const threshMap = matchMap.filter(aboveMatchThreshold)

    const bestMatch = utils.bestMatch(threshMap)

    return new MatchInfo({ windowId: w.id, matches: matchMap, bestMatch, tabCount: w.tabs.length })
  }

  /**
   * We could come up with better heuristics here, but for now we'll be conservative
   * and only re-attach when there is an unambiguous best match
   */
  // Only look at windows that match exactly one bookmark folder
  // (Could be improved by sorting entries on number of matches and picking best (if there is one))
  const windowMatchInfo = Immutable.Seq(windowList).map(getMatchInfo).filter(mi => mi.bestMatch)

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

// does session state match window snapshot?
// Note: We no longer require snapshot===true so that we can
// deal with sessions.onChanged event before close event.
const matchSnapshot = (tabWindow, session: Object) => {
  if ((session.window != null) && (session.window.tabs != null)) {
    const snapUrls = tabWindow.tabItems.filter(ti => ti.open).map(ti => ti.url).toArray()
    const sessionUrls = session.window.tabs.map(t => t.url)
    if (_.isEqual(snapUrls, sessionUrls)) {
      console.log('matchSnapshot: found session for window "' + tabWindow.title + '"')
      return true
    }
  }
  return false
}

const attachSessions = (st, sessions) => {
  // We used to filter to only attach to closed windows, but
  // then we have a race between close event and sessions.onChanged
  const tabWindows = st.bookmarkIdMap.toIndexedSeq().toArray()
  let nextSt = st
  for (let tabWindow of tabWindows) {
    for (let s of sessions) {
      if (s.window && matchSnapshot(tabWindow, s)) {
        let nextWin = tabWindow.set('chromeSessionId', s.window.sessionId)
        nextSt = nextSt.registerTabWindow(nextWin)
      }
      if (s.lastModified > lastSessionTimestamp) {
        lastSessionTimestamp = s.lastModified
      }
    }
  }
  return nextSt
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
  // Now try attach sessions:
  const sessions = await chromep.sessions.getRecentlyClosed()
  const winSessions = sessions.filter(s => 'window' in s)
  const sessStore = attachSessions(nextStore, winSessions)
  return sessStore
}

async function main () {
  try {
    console.log('bgHelper started...')
    const rawBMStore = await initWinStore()
    const attachBMStore = await reattachWindows(rawBMStore)
    const bmStore = await loadSnapState(attachBMStore)

    window.storeRef = new ViewRef(bmStore)
    const storeRefUpdater = refUpdater(window.storeRef)

    await actions.loadPreferences(storeRefUpdater)

    await actions.syncChromeWindows(storeRefUpdater)
    console.log('initial sync of chrome windows complete.')
    const syncedStore = await actions.syncCurrent(storeRefUpdater)
    // dumpAll(syncedStore)
    // dumpChromeWindows()

    setupConnectionListener(window.storeRef)

    registerEventHandlers(storeRefUpdater)

    // In case of restart: hide any previously open popout that
    // might be hanging around...
    // TODO: We MUST chain this action...
    const noPopStore = await actions.hidePopout(syncedStore, storeRefUpdater)

    if (noPopStore.preferences.popoutOnStart) {
      actions.showPopout(noPopStore, storeRefUpdater)
    }
    chrome.commands.onCommand.addListener(command => {
      if (command === 'show_popout') {
        actions.showPopout(window.storeRef.getValue(), storeRefUpdater)
      }
    })
  } catch (e) {
    console.error('*** caught top level exception: ', e)
  }
}

main()
