/**
 * Background helper page.
 * Gathering bookmark and window state and places in local storage so that
 * popup rendering will be as fast as possible
 */
import chromeBrowser from './chromeBrowser';
import * as Tabli from '../tabli-core/src/js/index';
import * as _ from 'lodash';
import * as Immutable from 'immutable';

const TabManagerState = Tabli.TabManagerState;
const TabWindow = Tabli.TabWindow;
const Popup = Tabli.components.Popup;
const actions = Tabli.actions;
const ViewRef = Tabli.ViewRef;
const utils = Tabli.utils;

import * as React from 'react';

import * as ReactDOMServer from 'react-dom/server';
import { refUpdater } from 'oneref';

const tabmanFolderTitle = 'Tabli Saved Windows';
const archiveFolderTitle = '_Archive';

/* On startup load managed windows from bookmarks folder */
function loadManagedWindows(winStore, tabManFolder) {
  var folderTabWindows = [];
  for (var i = 0; i < tabManFolder.children.length; i++) {
    var windowFolder = tabManFolder.children[i];
    if (windowFolder.title[0] === '_') {
      continue;
    }

    var fc = windowFolder.children;
    if (!fc) {
      console.log('Found bookmarks folder with no children, skipping: ', fc);
      continue;
    }

    folderTabWindows.push(TabWindow.makeFolderTabWindow(windowFolder));
  }

  return winStore.registerTabWindows(folderTabWindows);
}

/*
 * given a specific parent Folder node, ensure a particular child exists.
 * Will invoke callback either synchronously or asynchronously passing the node
 * for the named child
 */
function ensureChildFolder(parentNode, childFolderName, callback) {
  if (parentNode.children) {
    for (var i = 0; i < parentNode.children.length; i++) {
      var childFolder = parentNode.children[i];
      if (childFolder.title.toLowerCase() === childFolderName.toLowerCase()) {
        // exists
        // console.log( "found target child folder: ", childFolderName );
        callback(childFolder);
        return true;
      }
    }
  }

  console.log('Child folder ', childFolderName, ' Not found, creating...');

  // If we got here, child Folder doesn't exist
  var folderObj = { parentId: parentNode.id, title: childFolderName };
  chrome.bookmarks.create(folderObj, callback);
}

/**
 * acquire main folder and archive folder and initialize
 * window store
 */
function initWinStore(cb) {
  var tabmanFolderId = null;
  var archiveFolderId = null;

  chrome.bookmarks.getTree((tree) => {
    var otherBookmarksNode = tree[0].children[1];

    // console.log( "otherBookmarksNode: ", otherBookmarksNode );
    ensureChildFolder(otherBookmarksNode, tabmanFolderTitle, (tabManFolder) => {
      console.log('tab manager folder acquired.');
      tabmanFolderId = tabManFolder.id;
      ensureChildFolder(tabManFolder, archiveFolderTitle, (archiveFolder) => {
        console.log('archive folder acquired.');
        archiveFolderId = archiveFolder.id;
        chrome.bookmarks.getSubTree(tabManFolder.id, (subTreeNodes) => {
          // console.log("bookmarks.getSubTree for TabManFolder: ", subTreeNodes);
          const baseWinStore = new TabManagerState({ folderId: tabmanFolderId, archiveFolderId });
          const loadedWinStore = loadManagedWindows(baseWinStore, subTreeNodes[0]);
          cb(loadedWinStore);
        });
      });
    });
  });
}

function setupConnectionListener(storeRef) {
  chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((msg) => {
      var listenerId = msg.listenerId;
      port.onDisconnect.addListener(() => {
        storeRef.removeViewListener(listenerId);
//        console.log("Removed view listener ", listenerId);
//        console.log("after remove: ", storeRef);
      });
    });
  });
}

/**
 * Download the specified object as JSON (for testing)
 */
function downloadJSON(dumpObj, filename) {
  const dumpStr = JSON.stringify(dumpObj, null, 2);
  const winBlob = new Blob([dumpStr], { type: 'application/json' });
  const url = URL.createObjectURL(winBlob);
  chrome.downloads.download({ url, filename });
}

/**
 * dump all windows -- useful for creating performance tests
 *
 * NOTE:  Requires the "downloads" permission in the manifest!
 */
function dumpAll(winStore) {  // eslint-disable-line no-unused-vars
  const allWindows = winStore.getAll();

  const jsWindows = allWindows.map((tw) => tw.toJS());

  const dumpObj = { allWindows: jsWindows };

  downloadJSON(dumpObj, 'winStoreSnap.json');
}

function dumpChromeWindows() { // eslint-disable-line no-unused-vars
  chrome.windows.getAll({ populate: true }, (chromeWindows) => {
    downloadJSON({ chromeWindows }, 'chromeWindowSnap.json');
  });
}

/**
 * create a TabMan element, render it to HTML and save it for fast loading when
 * opening the popup
 */

function invokeLater(f) {
  window.setTimeout(f, 0);
}

function onTabCreated(uf,tab,markActive) {
  uf(state => {
    const tabWindow = state.getTabWindowByChromeId(tab.windowId);
    if (!tabWindow) {
      console.warn("tabs.onCreated: window id not found: ", tab.windowId);
      return state;
    }
    const st = state.handleTabCreated(tabWindow,tab);
    const nw = st.getTabWindowByChromeId(tab.windowId);
    const ast = markActive ? st.handleTabActivated(nw,tab.id) : st;
    return ast;
  });
}

function onTabRemoved(uf,windowId,tabId) {
  uf(state => {
    const tabWindow = state.getTabWindowByChromeId(windowId);
    if (!tabWindow) {
      console.warn("tabs.onTabRemoved: window id not found: ", windowId);
      return state;
    }
    return state.handleTabClosed(tabWindow, tabId);
  });
}

function registerEventHandlers(uf) {
    // window events:
    chrome.windows.onRemoved.addListener((windowId) => {
      uf((state) => {
        const tabWindow = state.getTabWindowByChromeId(windowId);
        const st = tabWindow ? state.handleTabWindowClosed(tabWindow) : state;
        return st;
      });
    });
    chrome.windows.onCreated.addListener(chromeWindow => {
      uf((state) => {
        return state.syncChromeWindow(chromeWindow);
      });
    });
    chrome.windows.onFocusChanged.addListener(windowId => {
      if (windowId===chrome.windows.WINDOW_ID_NONE)
        return;
      uf((state) => {
        return state.setCurrentWindowId(windowId);
      });
    },
      { windowTypes: ['normal'] }
    );

    // tab events:
    chrome.tabs.onCreated.addListener(tab => onTabCreated(uf,tab));
    chrome.tabs.onUpdated.addListener((tabId,changeInfo,tab) => {
      uf(state => {
        const tabWindow = state.getTabWindowByChromeId(tab.windowId);
        if (!tabWindow) {
          console.warn("tabs.onUpdated: window id not found: ", tab.windowId);
          return state;
        }
        return state.handleTabUpdated(tabWindow,tabId,changeInfo);
      });
    });
    chrome.tabs.onActivated.addListener(activeInfo => {
      // console.log("tabs.onActivated: ", activeInfo);
      uf((state) => {
        const tabWindow = state.getTabWindowByChromeId(activeInfo.windowId);
        if (!tabWindow) {
          console.warn("tabs.onActivated: window id not found: ", activeInfo.windowId, activeInfo);
          return state;
        }
        const st = tabWindow ? state.handleTabActivated(tabWindow,activeInfo.tabId) : state;
        return st;
      });
    });
    chrome.tabs.onRemoved.addListener((tabId,removeInfo) => {
      if (removeInfo.isWindowClosing) {
        // window closing, ignore...
        return;
      }
      onTabRemoved(uf,removeInfo.windowId,tabId);
    });
    chrome.tabs.onReplaced.addListener((addedTabId,removedTabId) => {
      // console.log("tabs.onReplaced: added: ", addedTabId, ", removed: ", removedTabId);
      uf(state => {
        const tabWindow = state.getTabWindowByChromeTabId(removedTabId);
        if (!tabWindow) {
          console.warn("tabs.onReplaced: could not find window for removed tab: ", removedTabId);
          return state;
        }
        const nextSt = state.handleTabClosed(tabWindow,removedTabId);

        // And arrange for the added tab to be added to the window:
        chrome.tabs.get(addedTabId,tab => onTabCreated(uf,tab));
        return nextSt;
      });
    });
    chrome.tabs.onMoved.addListener((tabId,moveInfo) => {
      // console.log("tab.onMoved: ", tabId, moveInfo);
      // Let's just refresh the whole window:
      actions.syncChromeWindowById(moveInfo.windowId,uf);
    });
    chrome.tabs.onDetached.addListener((tabId,detachInfo) => {
      // just handle like tab closing:
      onTabRemoved(uf,detachInfo.oldWindowId,tabId);
    });
    chrome.tabs.onAttached.addListener((tabId,attachInfo) => {
      // handle like tab creation:
      chrome.tabs.get(tabId,tab => onTabCreated(uf,tab,true));
    });
    chrome.browserAction.onClicked.addListener((chromeTab) => {
      console.log("broswerAction: clicked!");
      uf(state => {
        actions.showPopout(state);
        return state;
      });
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
 * calls cb with a TabManager state when complete.
 *
 */
function reattachWindows(bmStore,cb) {

  const MATCH_THRESHOLD = 0.4;

  const urlIdMap = bmStore.getUrlBookmarkIdMap();

  // type constructor for match info:
  const MatchInfo = Immutable.Record({windowId: -1, matches: Immutable.Map(), bestMatch: null, tabCount: 0});

  chrome.windows.getAll({ populate: true }, (windowList) => {

    function getMatchInfo(w) {
      // matches :: Array<Set<BookmarkId>>
      const matchSets = w.tabs.map(t => urlIdMap.get(t.url,null) ).filter(x => x);
      // countMaps :: Array<Map<BookmarkId,Num>>
      const countMaps = matchSets.map(s => s.countBy(v => v));

      // Now let's reduce array, merging all maps into a single map, aggregating counts:
      const aggMerge = (mA,mB) => mA.mergeWith((prev,next) => prev + next, mB);
      
      // matchMap :: Map<BookmarkId,Num>
      const matchMap = countMaps.reduce(aggMerge,Immutable.Map());

      // Ensure (# matches / # saved URLs) for each bookmark > MATCH_THRESHOLD
      function aboveMatchThreshold(matchCount,bookmarkId) {
        const savedTabWindow = bmStore.bookmarkIdMap.get(bookmarkId);
        const savedUrlCount = savedTabWindow.tabItems.count();
        const matchRatio = matchCount / savedUrlCount;
        // console.log("match threshold for '", savedTabWindow.title, "': ", matchRatio, matchCount, savedUrlCount);
        return (matchRatio >= MATCH_THRESHOLD);
      }

      const threshMap = matchMap.filter(aboveMatchThreshold);

      const bestMatch = utils.bestMatch(threshMap);

      return new MatchInfo({ windowId: w.id, matches: matchMap, bestMatch, tabCount: w.tabs.length });
    }
    
    /**
     * We could come up with better heuristics here, but for now we'll be conservative
     * and only re-attach when there is an unambiguous best match
     */
    // Only look at windows that match exactly one bookmark folder
    // (Could be improved by sorting entries on number of matches and picking best (if there is one))
    const windowMatchInfo = Immutable.Seq(windowList).map(getMatchInfo).filter(mi => mi.bestMatch);

    // console.log("windowMatchInfo: ", windowMatchInfo.toJS());

    // Now gather an inverse map of the form:
    // Map<BookmarkId,Map<WindowId,Num>>
    const bmMatches = windowMatchInfo.groupBy((mi) => mi.bestMatch);

    console.log("bmMatches: ", bmMatches.toJS());

    // bmMatchMaps: Map<BookmarkId,Map<WindowId,Num>>
    const bmMatchMaps = bmMatches.map(mis => {
      // mis :: Seq<MatchInfo>

      // mercifully each mi will have a distinct windowId at this point:
      const entries = mis.map(mi => {
        const matchTabCount = mi.matches.get(mi.bestMatch);
        return [mi.windowId,matchTabCount];
      });

      return Immutable.Map(entries);
    });

    console.log("bmMatchMaps: ", bmMatchMaps.toJS());

    // bestBMMatches :: Seq.Keyed<BookarkId,WindowId>;
    const bestBMMatches = bmMatchMaps.map(mm => utils.bestMatch(mm)).filter(ct => ct);
    console.log("bestBMMatches: ", bestBMMatches.toJS());

    // Form a map from chrome window ids to chrome window snapshots:
    const chromeWinMap = _.fromPairs(windowList.map(w => [w.id,w]));

    // And build up our attached state by attaching to each window in bestBMMatches:

    const attacher = (st,windowId,bookmarkId) => {
      const chromeWindow = chromeWinMap[windowId];
      const bmTabWindow = st.bookmarkIdMap.get(bookmarkId);
      const nextSt = st.attachChromeWindow(bmTabWindow, chromeWindow);
      return nextSt;
    }

    const attachedStore = bestBMMatches.reduce(attacher, bmStore);

    cb(attachedStore);
  });  
}


function main() {
  initWinStore((rawBMStore) => {
    reattachWindows(rawBMStore,(bmStore) => {
      console.log("init: done reading bookmarks and re-attaching: ", bmStore.toJS());

      // window.winStore = winStore;
      chrome.windows.getCurrent(null, (currentWindow) => {
        console.log("bgHelper: currentWindow: ", currentWindow);
        actions.syncChromeWindows((uf) => {
          console.log('initial sync of chrome windows complete.');
          const syncedStore = uf(bmStore).setCurrentWindow(currentWindow);
          console.log("window ids in store: ", _.keys(syncedStore.windowIdMap.toJS()));
          console.log("current window after initial sync: ", syncedStore.currentWindowId, syncedStore.getCurrentWindow());
          window.storeRef = new ViewRef(syncedStore);

          // dumpAll(syncedStore);
          // dumpChromeWindows();

          setupConnectionListener(window.storeRef);

          const storeRefUpdater = refUpdater(window.storeRef);
          registerEventHandlers(storeRefUpdater);

          /*
           * OK, this really shows limits of our refUpdater strategy, which conflates the
           * state updater action with the notion of a completion callback.
           * We really want to use callback chaining to ensure we don't show the popout
           * until after the popout is closed.
           */
          actions.closePopout(window.storeRef.getValue(),(uf) => {
            storeRefUpdater(uf);      
            actions.showPopout(window.storeRef.getValue(),storeRefUpdater);
          });
        });
      });    
    });
  });
}

main();
