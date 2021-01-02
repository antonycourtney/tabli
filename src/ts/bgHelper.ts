/**
 * Background helper page.
 * Gathering bookmark and window state and places in local storage so that
 * popup rendering will be as fast as possible
 */

import has from 'lodash/has';
import fromPairs from 'lodash/fromPairs';
import * as Immutable from 'immutable';
import * as semver from 'semver';
import log from 'loglevel';
import TabManagerState from './tabManagerState';
import * as utils from './utils';
import * as actions from './actions';
import * as savedState from './savedState';
import chromep from 'chrome-promise';
import { TabWindow, TabItem } from './tabWindow';
import * as tabWindowUtils from './tabWindowUtils';
import {
    StateRef,
    update,
    removeStateChangeListener,
    mkRef,
    awaitableUpdate,
    mutableGet,
} from 'oneref';
import ChromePromise from 'chrome-promise/chrome-promise';
import injectGlobal from '@emotion/css/types';
const _ = {
    has,
    fromPairs,
};
const chromeEventLog = log.getLogger('chrome-events');
const tabliFolderTitle = 'Tabli Saved Windows';
const archiveFolderTitle = '_Archive';
let tabliFolderId: string | null = null;
let archiveFolderId: string | null = null;

const isValidWindowFolder = (
    bookmarkNode: chrome.bookmarks.BookmarkTreeNode
) => {
    if (_.has(bookmarkNode, 'url')) {
        return false;
    }

    if (bookmarkNode.title[0] === '_') {
        return false;
    }

    return true;
};

/* On startup load managed windows from bookmarks folder */

function loadManagedWindows(
    winStore: TabManagerState,
    tabliFolder: chrome.bookmarks.BookmarkTreeNode
): TabManagerState {
    log.debug('loadManagedWindows:  tabliFolder: ', tabliFolder);

    var folderTabWindows = [];

    for (var i = 0; i < tabliFolder.children!.length; i++) {
        var windowFolder = tabliFolder.children![i];

        if (isValidWindowFolder(windowFolder)) {
            folderTabWindows.push(
                tabWindowUtils.makeFolderTabWindow(windowFolder)
            );
        }
    }

    return winStore.registerTabWindows(folderTabWindows);
}
/*
 * given a specific parent Folder node, ensure a particular child exists.
 * returns: Promise<BookmarkTreeNode>
 */

async function ensureChildFolder(
    parentNode: chrome.bookmarks.BookmarkTreeNode,
    childFolderName: string
) {
    if (parentNode.children) {
        for (var i = 0; i < parentNode.children.length; i++) {
            var childFolder = parentNode.children[i];

            if (
                childFolder.title.toLowerCase() ===
                childFolderName.toLowerCase()
            ) {
                // exists
                // log.debug('found target child folder: ', childFolderName)
                return childFolder;
            }
        }
    }

    log.info('Child folder ', childFolderName, ' Not found, creating...'); // If we got here, child Folder doesn't exist

    var folderObj = {
        parentId: parentNode.id,
        title: childFolderName,
    };
    return chromep.bookmarks.create(folderObj);
}
/**
 *
 * initialize showRelNotes field of TabManagerState based on comparing
 * relNotes version from localStorage with this extension manifest
 *
 * @return {TabManagerState} possibly updated TabManagerState
 */

function initRelNotes(st: TabManagerState, storedVersion: string) {
    const manifest = chrome.runtime.getManifest(); //  log.debug("initRelNotes: storedVersion: ", storedVersion, ", manifest: ", manifest.version)

    const showRelNotes =
        !semver.valid(storedVersion) ||
        semver.gt(manifest.version, storedVersion);
    return st.set('showRelNotes', showRelNotes);
}
/**
 * acquire main folder and archive folder and initialize
 * window store
 *
 * returns: Promise<TabManagerState>
 */

const initWinStore = async () => {
    const tree = await chromep.bookmarks.getTree();
    // log.debug('initWinStore: chrome bookmarks tree: ', tree);

    const rootChildren = tree[0].children!;
    // Try the fixed child index for Chrome:
    let otherBookmarksNode = rootChildren[1];
    if (otherBookmarksNode === undefined) {
        log.warn(
            "Could not attach to Chrome predefined 'Other Bookmarks' folder"
        );
        log.warn(
            'Attempting to attach to root (Boomarks Bar) as a workaround for Brave Browser issue'
        );
        log.warn(
            'See https://github.com/brave/brave-browser/issues/7639 for additional info'
        );
        otherBookmarksNode = rootChildren[rootChildren.length - 1];
    } else {
        log.debug("'Other Bookmarks' folder acquired");
    }

    const tabliFolder = await ensureChildFolder(
        otherBookmarksNode,
        tabliFolderTitle
    ); // log.debug('tab manager folder acquired.')

    tabliFolderId = tabliFolder.id;
    const archiveFolder = await ensureChildFolder(
        tabliFolder,
        archiveFolderTitle
    ); // log.debug('archive folder acquired.')

    archiveFolderId = archiveFolder.id;
    const subTreeNodes = await chromep.bookmarks.getSubTree(tabliFolder.id); // log.debug("bookmarks.getSubTree for tabliFolder: ", subTreeNodes)

    const baseWinStore = new TabManagerState({
        folderId: tabliFolderId,
        archiveFolderId,
    });
    const loadedWinStore = loadManagedWindows(baseWinStore, subTreeNodes[0]);
    const items = await chromep.storage.local.get({
        readRelNotesVersion: '',
    });
    const relNotesStore = initRelNotes(
        loadedWinStore,
        items.readRelNotesVersion
    );
    return relNotesStore;
};

function setupConnectionListener(stateRef: StateRef<TabManagerState>) {
    chrome.runtime.onConnect.addListener((port) => {
        chromeEventLog.debug('Chrome Event: onConnect');

        port.onMessage.addListener((msg: any) => {
            chromeEventLog.debug('Chrome Event: onMessage ', msg);
            var listenerId = msg.listenerId;
            port.onDisconnect.addListener(() => {
                chromeEventLog.debug('Chrome Event: onDisconnect');
                removeStateChangeListener(stateRef, listenerId);
                log.debug('Removed view listener ', listenerId);
            });
        });
    });
}
/**
 * Download the specified object as JSON (for testing)
 */

function downloadJSON(dumpObj: any, filename: string) {
    const dumpStr = JSON.stringify(dumpObj, null, 2);
    const winBlob = new Blob([dumpStr], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(winBlob);
    chrome.downloads.download({
        url,
        filename,
    });
}
/**
 * dump all windows -- useful for creating performance tests
 *
 * NOTE:  Requires the "downloads" permission in the manifest!
 */

function dumpAll(winStore: TabManagerState) {
    // eslint-disable-line no-unused-vars
    const allWindows = winStore.getAll();
    const jsWindows = allWindows.map((tw) => tw.toJS());
    const dumpObj = {
        allWindows: jsWindows,
    };
    downloadJSON(dumpObj, 'winStoreSnap.json');
}

function dumpChromeWindows() {
    // eslint-disable-line no-unused-vars
    chrome.windows.getAll(
        {
            populate: true,
        },
        (chromeWindows) => {
            downloadJSON(
                {
                    chromeWindows,
                },
                'chromeWindowSnap.json'
            );
        }
    );
}

async function onTabCreated(
    stateRef: StateRef<TabManagerState>,
    tab: chrome.tabs.Tab,
    markActive: boolean = false
) {
    chromeEventLog.debug('Chrome Event: tabs.onCreated: ', tab);
    const [st, _] = await awaitableUpdate(stateRef, (state) => {
        const tabWindow = state.getTabWindowByChromeId(tab.windowId);

        if (!tabWindow) {
            log.warn('tabs.onCreated: window id not found: ', tab.windowId);
            return [state, null];
        }
        let openerUrl: string | undefined = undefined;
        if (tab.openerTabId) {
            const entry = tabWindow.findChromeTabId(tab.openerTabId);

            if (entry) {
                const [_, openerTabItem] = entry;
                openerUrl = openerTabItem.url;
            }
        }
        const st = state.handleTabCreated(tabWindow, tab, openerUrl);
        const nw = st.getTabWindowByChromeId(tab.windowId);
        const ast = markActive ? st.handleTabActivated(nw!, tab.id!) : st;
        return [ast, null];
    });

    if (st.preferences.dedupeTabs && tab.id) {
        // let's try passing tab as changeInfo since presumaby the
        // keys are the same:
        dedupeTab(st, stateRef, tab.id, tab, tab);
    }
}

function onTabRemoved(
    stateRef: StateRef<TabManagerState>,
    windowId: number,
    tabId: number
) {
    log.debug('onTabRemoved: ', windowId, tabId);
    update(stateRef, (state) => {
        const tabWindow = state.getTabWindowByChromeId(windowId);

        if (!tabWindow) {
            log.info('tabs.onTabRemoved: window id not found: ', windowId);
            return state;
        }

        return state.handleTabClosed(tabWindow, tabId);
    });
}

const dedupeTab = async (
    st: TabManagerState,
    stateRef: StateRef<TabManagerState>,
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
) => {
    // for debugging:
    const jsifyPairs = (pairs: [any, any][]) =>
        pairs.map(([a, b]) => [a.toJS(), b.toJS()]);

    try {
        const url = changeInfo.url;

        // TODO: We should really look at pendingUrl, to try and dedupe tabs earlier...
        if (url != null && url.length > 0) {
            const tabItem = st.getTabItemByChromeTabId(tabId);

            // If url matches tabItem.openerUrl, this is usually a user-initiated Duplicate
            // operation (via tab context menu), so skip de-dup'ing:
            if (
                tabItem &&
                tabItem.open &&
                tabItem.openState!.openerUrl === url
            ) {
                log.debug(
                    'dedupeTab: user-initiated Duplicate of ',
                    url,
                    ', skipping...'
                );
                return;
            }

            const matchPairs = st.findURL(url); // and filter out the tab we're checking:

            const isSelf = (tw: TabWindow, ti: TabItem) =>
                tw.open &&
                tw.openWindowId === tab.windowId &&
                ti.open &&
                ti.openState!.openTabId === tabId;

            const filteredMatchPairs = matchPairs.filter(
                ([tw, ti]) => !isSelf(tw, ti)
            );

            /*             log.debug('dedupeTab: ', {
                matchPairs: jsifyPairs(matchPairs),
                filteredMatchPairs: jsifyPairs(filteredMatchPairs)
            }); */

            if (filteredMatchPairs.length > 0) {
                const [origTabWindow, origTab] = filteredMatchPairs[0];
                // if we wanted to programatically go back instead of closing:
                // (required <all_urls> permission in manifest)
                // const revertScript = {code: 'history.back();'}
                // await chromep.tabs.executeScript(tabId, revertScript)

                log.debug(
                    '*** dedupeTab: closing detected duplicate tab ',
                    tabId
                );
                const tabWindow = st.getTabWindowByChromeId(tab.windowId);
                const tabClosedSt = await actions.closeTab(
                    tabWindow!,
                    tabId,
                    stateRef
                );
                actions.activateOrRestoreTab(
                    origTabWindow,
                    origTab,
                    0,
                    stateRef
                );
            }
        }
    } catch (e) {
        log.warn('caught error during tab de-dup (ignoring...): ', e);
    }
};

const onTabUpdated = async (
    stateRef: StateRef<TabManagerState>,
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
) => {
    chromeEventLog.debug(
        'Chrome Event: tabs.onUpdated: ',
        tabId,
        changeInfo,
        tab
    );
    const [st, _] = await awaitableUpdate(stateRef, (state) => {
        const tabWindow = state.getTabWindowByChromeId(tab.windowId);

        if (!tabWindow) {
            log.warn('tabs.onUpdated: window id not found: ', tab.windowId);
            return [state, null];
        }

        return [state.handleTabUpdated(tabWindow, tabId, changeInfo), null];
    });

    if (st.preferences.dedupeTabs) {
        dedupeTab(st, stateRef, tabId, changeInfo, tab);
    }
};

const onBookmarkCreated = (
    stateRef: StateRef<TabManagerState>,
    id: string,
    bookmark: chrome.bookmarks.BookmarkTreeNode
) => {
    chromeEventLog.debug('Chrome Event: boomarks.onCreated: ', id, bookmark);
    update(stateRef, (state) => {
        let nextSt = state;
        /* is this bookmark a folder? */

        if (!isValidWindowFolder(bookmark)) {
            // Ordinary (non-folder) bookmark
            // Is parent a Tabli window folder?
            const tabWindow = state.getSavedWindowByBookmarkId(
                bookmark.parentId!
            );

            if (tabWindow) {
                // Do we already have this as a saved tab?
                const entry = tabWindow.findChromeBookmarkId(bookmark.id);

                if (!entry) {
                    log.debug('new bookmark in saved window: ', bookmark);
                    nextSt = state.handleBookmarkCreated(tabWindow, bookmark);
                }
            }
        } else {
            // folder (window) bookmark
            // Is this a Tabli window folder (parent is Tabli folder?)
            if (bookmark.parentId === tabliFolderId) {
                const tabWindow = state.getSavedWindowByBookmarkId(bookmark.id);

                if (!tabWindow) {
                    // new saved window (bookmark folder) not in local state
                    const tw = tabWindowUtils.makeFolderTabWindow(bookmark);
                    nextSt = state.registerTabWindow(tw);
                }
            }
        }

        return nextSt;
    });
};
/*
 * higher-order helper that determines whether a bookmark node
 * is either a saved window folder or saved tab, and invokes
 * handles for each case
 */

type TabHandler = (
    state: TabManagerState,
    tabWindow: TabWindow,
    index: number,
    tabItem: TabItem
) => TabManagerState;
type WindowHandler = (
    state: TabManagerState,
    tabWindow: TabWindow
) => TabManagerState;
const handleBookmarkUpdate = (
    stateRef: StateRef<TabManagerState>,
    parentId: string,
    bookmark: chrome.bookmarks.BookmarkTreeNode,
    handleTab: TabHandler,
    handleTabWindow: WindowHandler
) => {
    log.debug('handleBookmarkUpdate: ', bookmark);
    update(stateRef, (state) => {
        let nextSt = state;
        /* is this bookmark a folder? */

        if (!isValidWindowFolder(bookmark)) {
            // Ordinary (non-folder) bookmark
            // Is parent a Tabli window folder?
            const tabWindow = state.getSavedWindowByBookmarkId(parentId);

            if (tabWindow) {
                // Do we already have this as a saved tab?
                const entry = tabWindow.findChromeBookmarkId(bookmark.id);

                if (entry) {
                    const [index, tabItem] = entry;
                    nextSt = handleTab(state, tabWindow, index, tabItem);
                }
            }
        } else {
            // folder (window) bookmark
            // Is this a Tabli window folder (parent is Tabli folder?)
            if (parentId === tabliFolderId) {
                const tabWindow = state.getSavedWindowByBookmarkId(bookmark.id);

                if (tabWindow) {
                    nextSt = handleTabWindow(state, tabWindow);
                }
            }
        }

        return nextSt;
    });
};

const onBookmarkRemoved = (
    stateRef: StateRef<TabManagerState>,
    id: string,
    removeInfo: chrome.bookmarks.BookmarkRemoveInfo
) => {
    chromeEventLog.debug('Chrome Event: bookmarks.onRemoved: ', id, removeInfo);
    handleBookmarkUpdate(
        stateRef,
        removeInfo.parentId,
        removeInfo.node,
        (st, tabWindow, index, tabItem) =>
            st.handleTabUnsaved(tabWindow, tabItem),
        (st, tabWindow) => st.unmanageWindow(tabWindow)
    );
};

const safeUpdateWindowTitle = (
    st: TabManagerState,
    tabWindow: TabWindow,
    title: string | null
) => {
    return title == null ? st : st.updateSavedWindowTitle(tabWindow, title);
};

const onBookmarkChanged = async (
    stateRef: StateRef<TabManagerState>,
    id: string,
    changeInfo: chrome.bookmarks.BookmarkChangeInfo
) => {
    chromeEventLog.debug('Chrome Event: bookmarks.Onchanged: ', id, changeInfo);
    const res = await chromep.bookmarks.get(id);

    if (res && res.length > 0) {
        const bookmark = res[0];
        handleBookmarkUpdate(
            stateRef,
            bookmark.parentId!,
            bookmark,
            (st, tabWindow, index, tabItem) =>
                st.handleBookmarkUpdated(tabWindow, tabItem, changeInfo),
            (st, tabWindow) =>
                safeUpdateWindowTitle(st, tabWindow, changeInfo.title)
        );
    }
};

const onBookmarkMoved = (
    stateRef: StateRef<TabManagerState>,
    id: string,
    moveInfo: chrome.bookmarks.BookmarkMoveInfo
) => {
    chromeEventLog.debug('Chrome Event: bookmarks.onMoved: ', id, moveInfo);

    if (
        moveInfo.oldParentId === tabliFolderId &&
        moveInfo.parentId === archiveFolderId
    ) {
        // looks like window was unmanaged:
        update(stateRef, (state) => {
            let nextSt = state;
            const tabWindow = state.getSavedWindowByBookmarkId(id.toString());

            if (tabWindow) {
                nextSt = state.unmanageWindow(tabWindow);
            }

            return nextSt;
        });
    }
};

function registerEventHandlers(stateRef: StateRef<TabManagerState>) {
    // window events:
    chrome.windows.onRemoved.addListener((windowId) => {
        chromeEventLog.debug('Chrome Event:: windows.onRemoved: ', windowId);
        update(stateRef, (state) => {
            let st: TabManagerState;
            if (
                windowId !== chrome.windows.WINDOW_ID_NONE &&
                windowId === state.popoutWindowId
            ) {
                log.debug(
                    'detected close of popout window id ',
                    windowId,
                    ' -- clearing'
                );
                st = state.set('popoutWindowId', chrome.windows.WINDOW_ID_NONE);
            } else {
                const tabWindow = state.getTabWindowByChromeId(windowId);
                st = tabWindow ? state.handleTabWindowClosed(tabWindow) : state;
            }
            return st;
        });
    });
    chrome.windows.onCreated.addListener((chromeWindow) => {
        chromeEventLog.debug(
            'Chrome Event:: windows.onCreated: ',
            chromeWindow
        );
        update(stateRef, (state) => {
            return state.syncChromeWindow(chromeWindow);
        });
    });
    /* TODO: The Chrome docs are pretty confusing and suggest that an extra filter parameter can be passed
     * in the call to addListener, but the TypeScript bindings suggest this is an argument to the
     * callback, which doesn't make a ton of sense...
     */
    chrome.windows.onFocusChanged.addListener((windowId) => {
        chromeEventLog.debug(
            'Chrome Event:: windows.onFocusChanged: ',
            windowId
        );

        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            return;
        }

        update(stateRef, (state) => {
            return state.setCurrentWindowId(windowId);
        });
    });
    /*      
        {
            windowTypes: ['normal']
        }
    ); 
    */

    // tab events:
    chrome.tabs.onCreated.addListener((tab) => onTabCreated(stateRef, tab));
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
        onTabUpdated(stateRef, tabId, changeInfo, tab)
    );
    chrome.tabs.onActivated.addListener((activeInfo) => {
        chromeEventLog.debug('Chrome Event: tabs.onActivated: ', activeInfo);
        update(stateRef, (state) => {
            const tabWindow = state.getTabWindowByChromeId(activeInfo.windowId);

            if (!tabWindow) {
                log.warn(
                    'tabs.onActivated: window id not found: ',
                    activeInfo.windowId,
                    activeInfo
                );
                return state;
            }

            const st = tabWindow
                ? state.handleTabActivated(tabWindow, activeInfo.tabId)
                : state;
            return st;
        });
    });
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
        chromeEventLog.debug(
            'Chrome Event: tabs.onRemoved: ',
            tabId,
            removeInfo
        );

        if (removeInfo.isWindowClosing) {
            // window closing, ignore...
            return;
        }

        onTabRemoved(stateRef, removeInfo.windowId, tabId);
    });
    chrome.tabs.onReplaced.addListener(
        (addedTabId: number, removedTabId: number) => {
            chromeEventLog.debug(
                'Chrome Event: tabs.onReplaced: added: ',
                addedTabId,
                ', removed: ',
                removedTabId
            );
            update(stateRef, (state) => {
                const tabWindow = state.getTabWindowByChromeTabId(removedTabId);

                if (!tabWindow) {
                    log.info(
                        'tabs.onReplaced: could not find window for removed tab: ',
                        removedTabId
                    );
                    return state;
                }

                const nextSt = state.handleTabClosed(tabWindow, removedTabId); // And arrange for the added tab to be added to the window:

                chrome.tabs.get(addedTabId, (tab) =>
                    onTabCreated(stateRef, tab)
                );
                return nextSt;
            });
        }
    );
    chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
        chromeEventLog.debug('Chrome Event: tabs.onMoved: ', tabId, moveInfo); // Let's just refresh the whole window:

        actions.syncChromeWindowById(moveInfo.windowId, stateRef);
    });
    chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
        chromeEventLog.debug(
            'Chrome Event: tabs.onDetached: ',
            tabId,
            detachInfo
        ); // just handle like tab closing:

        // I am a little surprised that this doesn't lose saved state when detaching a
        // saved tab, but it really doesn't seem to!
        onTabRemoved(stateRef, detachInfo.oldWindowId, tabId);
    });
    chrome.tabs.onAttached.addListener((tabId: number, attachInfo) => {
        chromeEventLog.debug(
            'Chrome Event: tabs.onAttached: ',
            tabId,
            attachInfo
        ); // handle like tab creation:

        chrome.tabs.get(tabId, (tab) => onTabCreated(stateRef, tab, true));
    });
    chrome.bookmarks.onCreated.addListener((id, bookmark) =>
        onBookmarkCreated(stateRef, id, bookmark)
    );
    chrome.bookmarks.onRemoved.addListener((index, bookmark) =>
        onBookmarkRemoved(stateRef, index, bookmark)
    );
    chrome.bookmarks.onMoved.addListener((id, moveInfo) =>
        onBookmarkMoved(stateRef, id, moveInfo)
    );
    chrome.bookmarks.onChanged.addListener((id, changeInfo) =>
        onBookmarkChanged(stateRef, id, changeInfo)
    );
}

const MATCH_THRESHOLD = 0.25; // type constructor for match info:

interface MatchInfoProps {
    windowId: number;
    matches: Immutable.Map<string, number>;
    bestMatch: string | null;
    tabCount: number;
}

const defaultMatchInfoProps: MatchInfoProps = {
    windowId: -1,
    matches: Immutable.Map(),
    bestMatch: null,
    tabCount: 0,
};
class MatchInfo extends Immutable.Record(defaultMatchInfoProps) {}

const getWindowMatchInfo = (
    bmStore: TabManagerState,
    urlIdMap: Immutable.Map<string, Immutable.Set<string>>,
    w: chrome.windows.Window
): MatchInfo => {
    const matchSets = w
        .tabs!.map((t) => urlIdMap.get(t.url!, null))
        .filter((x) => x !== null) as Immutable.Set<string>[];

    type CountMap = Immutable.Map<string, number>;

    // countMaps :: Array<Map<BookmarkId,Num>>
    const countMaps = matchSets.map((s) => s.countBy((v) => v));

    // Now let's reduce array, merging all maps into a single map, aggregating counts:
    const aggMerge = (mA: CountMap, mB: CountMap): CountMap =>
        mA.mergeWith((prev, next) => prev + next, mB);

    // matchMap :: Map<BookmarkId,Num>
    const matchMap = countMaps.reduce(aggMerge, Immutable.Map());
    /*
     * The logic here is convoluted but seems to work OK
     * in practice.
     */
    // Ensure (# matches / # saved URLs) for each bookmark > MATCH_THRESHOLD

    function aboveMatchThreshold(matchCount: number, bookmarkId: string) {
        const tabCount = w.tabs!.length;
        const savedTabWindow = bmStore.bookmarkIdMap.get(bookmarkId);
        const savedUrlCount = savedTabWindow!.tabItems.count();
        const matchRatio = matchCount / savedUrlCount; // log.debug("match threshold for '", savedTabWindow.title, "': ", matchRatio, matchCount, savedUrlCount)

        return (
            matchCount > 1 ||
            (savedUrlCount === 1 && matchCount === 1) ||
            matchCount === tabCount ||
            matchRatio >= MATCH_THRESHOLD
        );
    }

    const threshMap = matchMap.filter(aboveMatchThreshold);
    const bestMatch = utils.bestMatch(threshMap);
    return new MatchInfo({
        windowId: w.id,
        matches: matchMap,
        bestMatch,
        tabCount: w.tabs!.length,
    });
};
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

function attachWindowList(
    bmStore: TabManagerState,
    windowList: chrome.windows.Window[]
) {
    const urlIdMap = bmStore.getUrlBookmarkIdMap();
    /**
     * We could come up with better heuristics here, but for now we'll be conservative
     * and only re-attach when there is an unambiguous best match
     */
    // Only look at windows that match exactly one bookmark folder
    // (Could be improved by sorting entries on number of matches and picking best (if there is one))

    const windowMatchInfo = Immutable.Seq(windowList)
        .map((w) => getWindowMatchInfo(bmStore, urlIdMap, w))
        .filter((mi) => mi.bestMatch); // log.debug("windowMatchInfo: ", windowMatchInfo.toJS())
    // Now gather an inverse map of the form:
    // Map<BookmarkId,Map<WindowId,Num>>

    const bmMatches = windowMatchInfo.groupBy(
        (mi) => mi.bestMatch
    ) as Immutable.Seq.Keyed<string, Immutable.Seq.Indexed<MatchInfo>>; // log.debug("bmMatches: ", bmMatches.toJS())
    // bmMatchMaps: Map<BookmarkId,Map<WindowId,Num>>

    const bmMatchMaps = bmMatches.map((mis) => {
        // mis :: Seq<MatchInfo>
        // mercifully each mi will have a distinct windowId at this point:
        const entries = mis.map((mi) => {
            const matchTabCount = mi.matches.get(mi.bestMatch!);
            return [mi.windowId, matchTabCount] as [number, number];
        });
        return Immutable.Map<number, number>(entries);
    });
    // log.debug("bmMatchMaps: ", bmMatchMaps.toJS())

    // bestBMMatches :: Seq.Keyed<BookarkId,WindowId>
    const bestBMMatches = bmMatchMaps
        .map((mm) => utils.bestMatch(mm))
        .filter((ct) => ct); // log.debug("bestBMMatches: ", bestBMMatches.toJS())
    // Form a map from chrome window ids to chrome window snapshots:

    const chromeWinMap = _.fromPairs(
        windowList.map((w) => [w.id, w] as [number, chrome.windows.Window])
    ); // And build up our attached state by attaching to each window in bestBMMatches:

    const attacher = (
        st: TabManagerState,
        windowId: number | null,
        bookmarkId: string
    ) => {
        const chromeWindow = chromeWinMap[windowId!];
        const bmTabWindow = st.bookmarkIdMap.get(bookmarkId);
        const nextSt = st.attachChromeWindow(bmTabWindow!, chromeWindow);
        return nextSt;
    };

    const attachedStore = bestBMMatches.reduce(attacher, bmStore);
    return attachedStore;
}
/**
 * get all Chrome windows and attach to best match:
 */

async function reattachWindows(bmStore: TabManagerState) {
    const windowList = await chromep.windows.getAll({
        populate: true,
    });
    return attachWindowList(bmStore, windowList);
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

async function maybeAttachNewWindow(
    stRef: StateRef<TabManagerState>,
    windowId: number
) {
    // eslint-disable-line no-unused-vars
    try {
        const chromeWindow = await chromep.windows.get(windowId, {
            populate: true,
            windowTypes: ['normal'],
        });

        if (!chromeWindow) {
            log.warn('maybeAttachNewWindow: null window, ignoring....');
            return;
        }

        update(stRef, (st) => {
            return attachWindowList(st, [chromeWindow]);
        });
    } catch (e) {
        log.warn('caught error getting chrome window (ignoring...): ', e);
    }
}
/**
 * load window state for saved windows from local storage and attach to
 * any closed, saved windows
 */

async function loadSnapState(bmStore: TabManagerState) {
    const items = await chromep.storage.local.get('savedWindowState');

    if (!items) {
        return bmStore;
    }

    const savedWindowStateStr = items.savedWindowState;

    if (!savedWindowStateStr) {
        log.debug(
            'loadSnapState: no saved window state found in local storage'
        );
        return bmStore;
    }

    const savedWindowState = JSON.parse(savedWindowStateStr);
    log.debug('loadSnapState: read: ', savedWindowState);
    const closedWindowsMap = bmStore.bookmarkIdMap.filter(
        (bmWin) => !bmWin.open
    );
    const closedWindowIds = closedWindowsMap.keys();
    let savedOpenTabsMap: { [id: string]: Immutable.List<TabItem> } = {};

    for (let id of closedWindowIds) {
        const savedState = savedWindowState[id];

        if (savedState) {
            const openTabItems: any[] = savedState.tabItems.filter(
                (ti: any) => ti.open
            );

            if (openTabItems.length > 0) {
                const convTabItems = openTabItems.map((ti: any) =>
                    tabWindowUtils.tabItemFromJS(ti)
                );
                const tiList = Immutable.List(convTabItems);
                savedOpenTabsMap[id] = tiList;
            }
        }
    }

    const keyCount = Object.keys(savedOpenTabsMap).length;
    log.debug('read window snapshot state for ', keyCount, ' saved windows');
    const updBookmarkMap = bmStore.bookmarkIdMap.map((tabWindow, bmId) => {
        const snapTabs = savedOpenTabsMap[bmId];

        if (snapTabs == null) {
            return tabWindow;
        }

        const baseSavedItems = tabWindow.tabItems
            .filter((ti) => ti.saved)
            .map(tabWindowUtils.resetSavedItem);
        const mergedTabs = tabWindowUtils.mergeSavedOpenTabs(
            baseSavedItems,
            snapTabs
        );
        return tabWindow.set('tabItems', mergedTabs).set('snapshot', true);
    });
    const nextStore = bmStore.set('bookmarkIdMap', updBookmarkMap);
    log.debug('merged window state snapshot from local storage');
    return nextStore;
}

async function cleanOldPopouts(stateRef: StateRef<TabManagerState>) {
    const st = mutableGet(stateRef);
    const popupTabWindows = st
        .getTabWindowsByType('popup')
        .filter((tw: TabWindow) => tw.open && tw.title === 'Tabli');
    const closePromises = popupTabWindows
        .map((tw: TabWindow) => chromep.windows.remove(tw.openWindowId))
        .toJS();
    await Promise.all(closePromises);
}

async function main() {
    try {
        utils.setLogLevel(log);
        utils.setLogLevel(chromeEventLog);
        // Can also do:
        // chromeEventLog.setLevel('debug');

        log.info('bgHelper started, env: ', process.env.NODE_ENV);
        actions.setReloadHandler(main);
        const rawBMStore = await initWinStore();
        const attachBMStore = await reattachWindows(rawBMStore);
        const bmStore = await loadSnapState(attachBMStore);
        const stateRef = mkRef(bmStore);
        (window as any).stateRef = stateRef;
        (window as any).isExtension = true;
        await actions.loadPreferences(stateRef);
        await actions.syncChromeWindows(stateRef);
        log.debug('initial sync of chrome windows complete.');
        log.debug('before sync: stateRef: ', stateRef);
        const syncedStore = await actions.syncCurrent(stateRef); // dumpAll(syncedStore)
        // dumpChromeWindows()

        setupConnectionListener(stateRef);
        registerEventHandlers(stateRef); // In case of restart: hide any previously open popout that
        // might be hanging around...
        // log.debug('store before hiding popout: ', syncedStore.toJS())

        cleanOldPopouts(stateRef);

        const noPopStore = await actions.hidePopout(stateRef); // log.debug('noPopStore: ', noPopStore)

        log.info('main: popoutOnStart: ', noPopStore.preferences.popoutOnStart);
        if (noPopStore.preferences.popoutOnStart) {
            actions.showPopout(stateRef);
        }

        chrome.commands.onCommand.addListener((command) => {
            chromeEventLog.debug('Chrome Event: onCommand: ', command);

            if (command === 'show_popout') {
                actions.showPopout(stateRef);
            }
        });
        savedState.init(stateRef);
    } catch (e) {
        log.error('*** caught top level exception: ', e);
    }
}

main();
