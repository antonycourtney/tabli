import { log } from './globals';
import prefix from 'loglevel-plugin-prefix';
import * as utils from './utils';
import * as prefs from './preferences';
import * as Constants from './components/constants';
import { TabItem, TabWindow } from './tabWindow'; // eslint-disable-line
import {
    StateRef,
    utils as oneRefUtils,
    update,
    awaitableUpdate_,
    mutableGet,
    awaitableUpdate,
} from 'oneref';
import TabManagerState from './tabManagerState';
import ChromePromise from 'chrome-promise';
import { getTabIndices, getOpenTabIndex, getSavedTabIndex } from './utils';
import { saveSnapshot } from './savedState';
const chromep = ChromePromise;

type TabId = number;

const TABLI_ABOUT_URL = 'http://www.gettabli.com/contact.html';
const TABLI_TUTORIAL_URL =
    'https://medium.com/@antonycourtney/taming-tab-hell-with-tabli-83f080e32d17?source=friends_link&sk=d121d5ba0114d9eea9cd29a23e202d37';
const TABLI_HELP_URL = 'http://www.gettabli.com/tabli-usage.html';
const TABLI_REVIEW_URL =
    'https://chrome.google.com/webstore/detail/tabli/igeehkedfibbnhbfponhjjplpkeomghi/reviews';
const TABLI_FEEDBACK_URL = 'mailto:tabli-feedback@gettabli.com';

type WindowId = number;
type TMSRef = StateRef<TabManagerState>;

/**
 * sync a single Chrome window by its Chrome window id
 *
 */
export function syncChromeWindowById(windowId: WindowId, storeRef: TMSRef) {
    chrome.windows.get(windowId, { populate: true }, (chromeWindow) => {
        update(storeRef, (state) => state.syncChromeWindow(chromeWindow));
    });
}

// awaitable variant on above:
export async function awaitableSyncChromeWindowById(
    windowId: WindowId,
    storeRef: TMSRef,
) {
    const chromeWindow = await chromep.windows.get(windowId, {
        populate: true,
    });
    log.debug('awaitableSyncChromeWindowById: got: ', chromeWindow);
    await awaitableUpdate_(storeRef, (state) =>
        state.syncChromeWindow(chromeWindow),
    );
}

/**
 * get all open Chrome windows and synchronize state with our tab window store
 *
 */
export const syncChromeWindows = async (
    storeRef: TMSRef,
): Promise<TabManagerState> => {
    var tPreGet = performance.now();
    const windowList = await chromep.windows.getAll({ populate: true });
    var tPostGet = performance.now();
    log.info(
        'syncChromeWindows: chrome.windows.getAll took ',
        tPostGet - tPreGet,
        ' ms',
    );
    var tPreSync = performance.now();
    const nextSt = await awaitableUpdate_(storeRef, (state) =>
        state.syncWindowList(windowList),
    );
    var tPostSync = performance.now();
    log.info(
        'syncChromeWindows: syncWindowList took ',
        tPostSync - tPreSync,
        ' ms',
    );
    return nextSt;
};

/**
 * get current chrome window and mark it as current window in store
 */
export const syncCurrent = async (
    storeRef: TMSRef,
): Promise<TabManagerState> => {
    try {
        const currentChromeWindow = await chromep.windows.getCurrent({
            populate: true,
        });
        const nextSt = await awaitableUpdate_(storeRef, (st) =>
            st.setCurrentWindow(currentChromeWindow),
        );
        return nextSt;
    } catch (e) {
        log.error('syncCurrent: ', e);
        log.warn('(ignoring exception)');
        return awaitableUpdate_(storeRef, (st) => st);
    }
};
/**
 * restoreFromAppState
 *
 * Restore a saved window using only App state.
 * Fallback for when no session id available or session restore fails
 */
const restoreFromAppState = (
    lastFocusedTabWindow: TabWindow | null,
    tabWindow: TabWindow,
    revertOnOpen: boolean,
    mbTab: TabItem | null,
    storeRef: TMSRef,
) => {
    log.debug(
        'restoreFromAppState: restoring saved TabWindow: ',
        tabWindow.toJS(),
    );
    /*
    const tabItemRawKeys = tabWindow.tabItems.map(ti => ti.rawKey).toArray();
    log.debug(
        'restoreFromAppState: tabWindow tabItem _key vals:',
        tabItemRawKeys
    );
    const tabItemKeys = tabWindow.tabItems.map(ti => ti.key).toArray();
    log.debug('restoreFromAppState: tabWindow keys: ', tabItemKeys);
    */
    const attachWindow = (chromeWindow?: chrome.windows.Window) => {
        if (chromeWindow) {
            update(storeRef, (state) =>
                state.attachChromeWindow(tabWindow, chromeWindow),
            );
        }
    };

    /*
     * special case handling of replacing the contents of a fresh window
     */
    chrome.windows.getLastFocused({ populate: true }, (currentChromeWindow) => {
        let urls;
        if (mbTab) {
            log.debug(
                'restore saved window: restoring single tab: ',
                mbTab.toJS(),
            );
            urls = [mbTab.url];
        } else {
            const tabItems = tabWindow.tabItems;
            // If a snapshot, only use tabItems that were previously open:
            let targetItems = tabWindow.snapshot
                ? tabItems.filter((ti) => ti.open)
                : tabItems;

            if (revertOnOpen) {
                // So revertOnOpen something of a misnomer. If a snapshot available,
                // limits what's opened to what was previously open and
                // explicitly saved, to minimize the number of tabs we load.
                targetItems = targetItems.filter((ti) => ti.saved);
                if (targetItems.length === 0) {
                    // No saved items open, full revert:
                    targetItems = tabItems.filter((ti) => ti.saved);
                }
            }
            urls = targetItems.map((ti) => ti.url);
        }
        if (
            currentChromeWindow.tabs &&
            currentChromeWindow.tabs.length === 1 &&
            currentChromeWindow.tabs[0].url === 'chrome://newtab/' &&
            currentChromeWindow.id != null &&
            currentChromeWindow.tabs[0].id != null
        ) {
            // log.debug("found new window -- replacing contents")
            var origTabId = currentChromeWindow.tabs[0].id;

            // new window -- replace contents with urls:
            // TODO: replace this loop with call to utils.seqActions
            for (var i = 0; i < urls.length; i++) {
                // First use our existing tab:
                if (i === 0) {
                    chrome.tabs.update(origTabId, { url: urls[i] });
                } else {
                    const tabInfo = {
                        windowId: currentChromeWindow.id,
                        url: urls[i],
                    };
                    chrome.tabs.create(tabInfo);
                }
            }

            chrome.windows.get(
                currentChromeWindow.id,
                { populate: true },
                attachWindow,
            );
        } else {
            // normal case -- create a new window for these urls:
            var createData: chrome.windows.CreateData = {
                url: urls,
                focused: true,
                type: 'normal',
                width: Constants.BROWSER_DEFAULT_WIDTH,
                height: Constants.BROWSER_DEFAULT_HEIGHT,
            };
            if (lastFocusedTabWindow) {
                createData.width = lastFocusedTabWindow.width;
                createData.height = lastFocusedTabWindow.height;
            }
            log.debug('restoreFromAppState: creating windows: ', createData);
            chrome.windows.create(createData, attachWindow);
        }
    });
};

/**
 * restore a bookmark window.
 *
 * N.B.: NOT exported; called from openWindow
 */
async function restoreBookmarkWindow(
    tabWindow: TabWindow,
    mbTab: TabItem | null,
    storeRef: TMSRef,
) {
    log.debug('restoreBookmarkWindow: restoring "' + tabWindow.title + '"');
    const st = mutableGet(storeRef);
    restoreFromAppState(
        st.getCurrentWindow(),
        tabWindow,
        st.preferences.revertOnOpen,
        mbTab,
        storeRef,
    );
}

export async function openWindow(targetTabWindow: TabWindow, storeRef: TMSRef) {
    if (targetTabWindow.open) {
        // existing, open window -- just transfer focus
        chromep.windows.update(targetTabWindow.openWindowId, {
            focused: true,
        });
        // No need to update focus in state; should happen via event listeners
    } else {
        // bookmarked window -- need to open it!
        restoreBookmarkWindow(targetTabWindow, null, storeRef);
    }
}

export function tabSetMute(
    tabWindow: TabWindow,
    tabId: TabId,
    muted: boolean,
    storeRef: TMSRef,
) {
    chromep.tabs.update(tabId, { muted });
}

export const closeTab = async (
    origTabWindow: TabWindow,
    tabId: TabId,
    storeRef: TMSRef,
): Promise<TabManagerState> => {
    const origTabCount = origTabWindow.openTabCount;
    const chromeWindowId = origTabWindow.openWindowId;
    await chromep.tabs.remove(tabId);
    if (origTabCount === 1) {
        return awaitableUpdate_(storeRef, (state) => {
            const tabWindow = state.getTabWindowByChromeId(chromeWindowId);
            const nextSt = tabWindow
                ? state.handleTabWindowClosed(tabWindow)
                : state;
            return nextSt;
        });
    } else {
        /*
     * We'd like to do a full chrome.windows.get here so that we get the currently active tab
     * but amazingly we still see the closed tab when we do that!
    chrome.windows.get( tabWindow.openWindowId, { populate: true }, function ( chromeWindow ) {
      log.debug("closeTab: got window state: ", chromeWindow)
      winStore.syncChromeWindow(chromeWindow)
    })
    */
        return awaitableUpdate_(storeRef, (state) => {
            const tabWindow = state.getTabWindowByChromeId(chromeWindowId);
            const nextSt = tabWindow
                ? state.handleTabClosed(tabWindow, tabId)
                : state;
            return nextSt;
        });
    }
};

export function saveTab(
    tabWindow: TabWindow,
    tabItem: TabItem,
    storeRef: TMSRef,
) {
    const tabMark = {
        parentId: tabWindow.savedFolderId,
        title: tabItem.title,
        url: tabItem.url,
    };
    chrome.bookmarks.create(tabMark, (tabNode) => {
        update(storeRef, (state) =>
            state.handleTabSaved(tabWindow, tabItem, tabNode),
        );
    });
}

export async function unsaveTab(
    tabWindow: TabWindow,
    tabItem: TabItem,
    storeRef: TMSRef,
): Promise<void> {
    const bookmarkId = tabItem.safeSavedState.bookmarkId;
    log.debug('actions.unsaveTab: removing bookmark id ', bookmarkId);
    try {
        await chromep.bookmarks.remove(bookmarkId);
    } catch (err) {
        log.info(
            'Error removing bookmark (ignoring): ',
            (err as Error).message,
        );
    }
    // Let's still update local state, just in case this was a bookmark
    // from saved state:
    update(storeRef, (state) => state.handleTabUnsaved(tabWindow, tabItem));
}

export const closeWindow = async (
    tabWindow: TabWindow,
    storeRef: TMSRef,
): Promise<TabManagerState> => {
    const st = mutableGet(storeRef);
    if (!tabWindow.open) {
        log.debug('closeWindow: request to close non-open window, ignoring...');
    } else {
        await chromep.windows.remove(tabWindow.openWindowId);
        return awaitableUpdate_(storeRef, (state) =>
            state.handleTabWindowClosed(tabWindow),
        );
    }
    return st;
};

export function expandWindow(
    tabWindow: TabWindow,
    expand: boolean | null,
    storeRef: TMSRef,
) {
    update(storeRef, (state) =>
        state.handleTabWindowExpand(tabWindow, expand === true),
    );
}

export async function setActiveTab(tab: TabItem) {
    if (tab.open) {
        await chromep.tabs.update(tab.openState!.openTabId, { active: true });
    }
}

export async function setFocusedWindow(tabWindow: TabWindow) {
    if (tabWindow.open) {
        await chromep.windows.update(tabWindow.openWindowId, { focused: true });
    }
}

// activate a specific tab:
export async function activateOrRestoreTab(
    targetTabWindow: TabWindow,
    tab: TabItem,
    tabIndex: number,
    storeRef: TMSRef,
) {
    log.debug('activateTab: ', targetTabWindow.toJS(), tab.toJS());

    const st = mutableGet(storeRef);
    const lastFocusedTabWindow = st.getCurrentWindow();

    if (targetTabWindow.open) {
        // OK, so we know this window is open.  What about the specific tab?
        if (tab.open) {
            // Tab is already open, just make it active:
            await setActiveTab(tab);
            await setFocusedWindow(targetTabWindow);
        } else {
            // restore this bookmarked tab:
            var createOpts = {
                windowId: targetTabWindow.openWindowId,
                url: tab.url,
                index: tabIndex,
                active: true,
            };

            log.debug('restoring saved tab');
            await chromep.tabs.create(createOpts);
            await setFocusedWindow(targetTabWindow);
        }
    } else {
        log.debug('activateTab: opening single tab of saved window');

        // TODO: insert our own callback so we can activate chosen tab after opening window!
        restoreBookmarkWindow(targetTabWindow, tab, storeRef);
    }
}

export function revertWindow(tabWindow: TabWindow, storeRef: TMSRef) {
    /*
     * We used to reload saved tabs, but this is slow, could lose tab state, and doesn't deal gracefully with
     * pinned tabs.
     * Instead we'll try just removing the unsaved tabs and re-opening any saved, closed tabs.
     * This has the downside of not removing duplicates of any saved tabs.
     */
    const unsavedOpenTabIds = tabWindow.tabItems
        .filter((ti) => ti.open && !ti.saved)
        .map((ti) => ti.safeOpenState.openTabId);
    const savedClosedUrls = tabWindow.tabItems
        .filter((ti) => !ti.open && ti.saved)
        .map((ti) => ti.safeSavedState.url);

    // re-open saved URLs:
    // We need to do this before removing tab ids or window could close if all unsaved
    for (var i = 0; i < savedClosedUrls.length; i++) {
        // need to open it:
        var tabInfo = {
            windowId: tabWindow.openWindowId,
            url: savedClosedUrls[i],
        };
        chrome.tabs.create(tabInfo);
    }

    // blow away all the unsaved open tabs:
    chrome.tabs.remove(unsavedOpenTabIds, () => {
        syncChromeWindowById(tabWindow.openWindowId, storeRef);
    });
}

/*
 * save the specified tab window and make it a managed window
 */
export function manageWindow(
    tabWindow: TabWindow,
    title: string,
    storeRef: TMSRef,
) {
    const st = mutableGet(storeRef);
    const tabliFolderId = st.folderId;
    const currentWindowId = st.currentWindowId;

    // and write out a Bookmarks folder for this newly managed window:
    if (!tabliFolderId) {
        alert('Could not save bookmarks -- no tab manager folder');
    }

    var windowFolder = { parentId: tabliFolderId, title };
    chrome.bookmarks.create(windowFolder, (windowFolderNode) => {
        // log.debug( "succesfully created bookmarks folder ", windowFolderNode )
        // log.debug( "for window: ", tabWindow )

        const uniqTabItems = Array.from(
            tabWindow.tabItems
                .reduce((map, item) => {
                    if (!map.has(item.url)) {
                        map.set(item.url, item);
                    }
                    return map;
                }, new Map<string, TabItem>())
                .values(),
        );

        var bookmarkActions = uniqTabItems.map((tabItem) => {
            function makeBookmarkAction(
                v: any,
                cf: (bm: chrome.bookmarks.BookmarkTreeNode) => void,
            ) {
                const tabMark = {
                    parentId: windowFolderNode.id,
                    title: tabItem.title,
                    url: tabItem.url,
                };
                chrome.bookmarks.create(tabMark, cf);
            }

            return makeBookmarkAction;
        });

        utils.seqActions(bookmarkActions, null, () => {
            // Now do an explicit get of subtree to get node populated with children
            chrome.bookmarks.getSubTree(windowFolderNode.id, (folderNodes) => {
                var fullFolderNode = folderNodes[0];

                // We'll retrieve the latest chrome Window state and attach that:
                chrome.windows.get(
                    tabWindow.openWindowId,
                    { populate: true },
                    (chromeWindow) => {
                        update(storeRef, (state) =>
                            state.attachBookmarkFolder(
                                fullFolderNode,
                                chromeWindow,
                            ),
                        );
                    },
                );
            });
        });
    });
}

/* stop managing the specified window...move all bookmarks for this managed window to Recycle Bin */
export function unmanageWindow(tabWindow: TabWindow, storeRef: TMSRef) {
    const archiveFolderId = mutableGet(storeRef).archiveFolderId;
    // log.debug("unmanageWindow: ", tabWindow.toJS())
    if (!archiveFolderId) {
        alert(
            'could not move managed window folder to archive -- no archive folder',
        );
        return;
    }

    // Could potentially disambiguate names in archive folder...
    chrome.bookmarks.move(
        tabWindow.savedFolderId,
        { parentId: archiveFolderId },
        () => {
            // log.debug("unmanageWindow: bookmark folder moved to archive folder")
            update(storeRef, (state) => state.unmanageWindow(tabWindow));
        },
    );
}

export async function setWindowTitle(
    title: string,
    tabWindow: TabWindow,
    storeRef: TMSRef,
) {
    if (!tabWindow.saved) {
        log.error(
            'attempt to set window title on unsaved window: ',
            tabWindow.toJS(),
        );
    }
    try {
        await chromep.bookmarks.update(tabWindow.savedFolderId, { title });
        log.debug('setWindowTitle: updated window title');
    } catch (err) {
        log.error('error updating window title: ', err);
    }
}

export function showHelp() {
    chrome.tabs.create({ url: TABLI_HELP_URL });
}

export function showTutorial() {
    chrome.tabs.create({ url: TABLI_TUTORIAL_URL });
}

export function showAbout() {
    chrome.tabs.create({ url: TABLI_ABOUT_URL });
}
export function showReview() {
    chrome.tabs.create({ url: TABLI_REVIEW_URL });
}
export function sendFeedback() {
    chrome.tabs.create({ url: TABLI_FEEDBACK_URL });
}

export async function showPreferences() {
    const prefsURL = chrome.runtime.getURL('preferences.html');
    log.debug({ prefsURL });
    const tab = await chromep.tabs.create({ url: prefsURL });
    chromep.windows.update(tab.windowId, { focused: true });
}

export const showPopout = async (stateRef: StateRef<TabManagerState>) => {
    const st = mutableGet(stateRef);
    const oldPopoutId = st.popoutWindowId;
    let oldState = null;

    // Try to capture state of the old window
    if (oldPopoutId !== chrome.windows.WINDOW_ID_NONE) {
        try {
            const oldWindow = await chromep.windows.get(oldPopoutId);
            oldState = {
                left: oldWindow.left,
                top: oldWindow.top,
                width: oldWindow.width,
                height: oldWindow.height,
            };
        } catch (e) {
            // Old window doesn't exist, ignore
        }
    }

    // Create a new popout window
    const createData: chrome.windows.CreateData = {
        url: 'popout.html',
        type: 'popup',
        left: oldState ? oldState.left : 0,
        top: oldState ? oldState.top : 0,
        width: oldState ? oldState.width : Constants.POPOUT_DEFAULT_WIDTH,
        height: oldState ? oldState.height : Constants.POPOUT_DEFAULT_HEIGHT,
    };

    const newPopoutWindow = await chromep.windows.create(createData);

    if (newPopoutWindow.id) {
        update(stateRef, (st) => st.set('popoutWindowId', newPopoutWindow.id!));

        // Close the old window after a short delay
        if (oldPopoutId !== chrome.windows.WINDOW_ID_NONE) {
            setTimeout(() => {
                chromep.windows.remove(oldPopoutId).catch(() => {
                    // Ignore errors if window doesn't exist
                });
            }, 500); // 500ms delay
        }
    }
};

export const hidePopout = async (
    storeRef: TMSRef,
): Promise<TabManagerState> => {
    const winStore = mutableGet(storeRef);
    const popoutId = winStore.popoutWindowId;
    if (popoutId !== chrome.windows.WINDOW_ID_NONE) {
        log.debug('hidePopout: Found existing popout window, closing...');
        try {
            await chromep.windows.remove(popoutId);
        } catch (e) {
            log.warn('hidePopout: Error closing popout window:', e);
        }
        log.debug('hidePopout: old popout window closed.');
    }
    return awaitableUpdate_(storeRef, (state) =>
        state.set('popoutWindowId', chrome.windows.WINDOW_ID_NONE),
    );
};

export function toggleExpandAll(storeRef: TMSRef) {
    update(storeRef, (st) => {
        const allWindows = st.getAll();
        const updWindows = allWindows.map((w) => w.clearExpanded());
        const nextSt = st
            .registerTabWindows(updWindows)
            .set('expandAll', !st.expandAll);
        return nextSt;
    });
}

// The dreaded routine copied from SO
// http://stackoverflow.com/a/18455088/3272482
function copyTextToClipboard(text: string) {
    var copyFrom = document.createElement('textarea');
    copyFrom.textContent = text;
    var body = document.getElementsByTagName('body')[0];
    body.appendChild(copyFrom);
    copyFrom.select();
    document.execCommand('copy');
    body.removeChild(copyFrom);
}

export function copyWindowsToClipboard(stateRef: TMSRef) {
    const appState = mutableGet(stateRef);
    const openWindows = appState.getTabWindowsByType('normal');

    var cmpFn = utils.windowCmp(
        appState.preferences.sortOrder,
        appState.currentWindowId,
    );
    var sortedWindows = openWindows.sort(cmpFn);

    const s = sortedWindows.reduce(
        (rs, tw) => rs + '\n\n' + tw.exportStr(),
        '',
    );

    copyTextToClipboard(s);
}

// optimistic state update to reorder tab within a window:
const optimisticReorderTab = (
    st: TabManagerState,
    tabWindow: TabWindow,
    tabItem: TabItem,
    sourceIndex: number,
    targetIndex: number,
): TabManagerState => {
    log.debug('optimisticReorderTab: ', { tabItem, sourceIndex, targetIndex });
    // reorder tab items within this single window:
    const tabItems = [...tabWindow.tabItems];
    const nextTabItems = tabItems
        .splice(sourceIndex, 1)
        .splice(targetIndex, 0, tabItem);
    const nextTabWindow = tabWindow.setTabItems(nextTabItems);
    const nextSt = st.registerTabWindow(nextTabWindow);
    return nextSt;
};

// optimistic state update to move tab between two windows:
const optimisticMoveTab = (
    st: TabManagerState,
    sourceTabWindow: TabWindow,
    targetTabWindow: TabWindow,
    tabItem: TabItem,
    sourceIndex: number,
    targetIndex: number,
): TabManagerState => {
    const sourceTabItems = [...sourceTabWindow.tabItems];
    const nextSourceTabItems = sourceTabItems.splice(sourceIndex, 1);
    const nextSourceTabWindow = sourceTabWindow.setTabItems(nextSourceTabItems);

    const targetTabItems = [...targetTabWindow.tabItems];
    const nextTargetTabItems = targetTabItems.splice(targetIndex, 0, tabItem);
    const nextTargetTabWindow = targetTabWindow.setTabItems(nextTargetTabItems);

    const nextSt = st.registerTabWindows([
        nextSourceTabWindow,
        nextTargetTabWindow,
    ]);
    return nextSt;
};

// Test of dnd animation by moving tab immediately:
export const moveTabItem = async (
    sourceTabWindow: TabWindow,
    targetTabWindow: TabWindow,
    sourceIndex: number,
    dropIndex: number,
    movedTabItem: TabItem,
    storeRef: TMSRef,
) => {
    log.debug(
        'stubMoveTabItem: targetTabWindow: ',
        targetTabWindow.toJS(),
        'dropIndex: ',
        dropIndex,
    );
    log.debug('moveTabItem: movedTabItem: ', movedTabItem.toJS());

    // optimistic visual update, essential to get desired
    // DnD drop animation behavior without flashing:

    update(storeRef, (st: TabManagerState): TabManagerState => {
        let nextSt = st;
        if (sourceTabWindow === targetTabWindow) {
            nextSt = optimisticReorderTab(
                st,
                sourceTabWindow,
                movedTabItem,
                sourceIndex,
                dropIndex,
            );
        } else {
            nextSt = optimisticMoveTab(
                st,
                sourceTabWindow,
                targetTabWindow,
                movedTabItem,
                sourceIndex,
                dropIndex,
            );
        }
        return nextSt;
    });

    const targetIndices = getTabIndices(targetTabWindow);
    log.debug('moveItem target window tab indices: ', targetIndices);
    log.debug('movedItem dropIndex: ', dropIndex);
    if (movedTabItem.open) {
        const openTabId = movedTabItem.openState!.openTabId;

        if (sourceTabWindow.open && targetTabWindow.open) {
            // common case: moving an open tab between open widows

            // Perform the move of the live tab in Chrome:
            const sourceWindowId = sourceTabWindow.openWindowId;
            const targetWindowId = targetTabWindow.openWindowId;

            const openIndex = getOpenTabIndex(targetIndices, dropIndex);
            log.debug('target open tab index: ', openIndex);
            let moveProps = { windowId: targetWindowId, index: openIndex };
            await chromep.tabs.move(openTabId, moveProps);
            log.debug('chrome tab move complete');

            // Let's just refresh the both windows:
            syncChromeWindowById(sourceWindowId, storeRef);
            if (sourceWindowId !== targetWindowId) {
                syncChromeWindowById(targetWindowId, storeRef);
            }
        }
    }

    if (movedTabItem.saved && targetTabWindow.saved) {
        const bookmarkId = movedTabItem.savedState!.bookmarkId;
        const folderId = targetTabWindow.savedFolderId;
        log.debug(
            'moving saved tab to saved window -- moving bookmark: ',
            bookmarkId,
        );
        const savedIndex = getSavedTabIndex(targetIndices, dropIndex);
        log.debug('target saved tab index: ', savedIndex);
        const bmNode = await chromep.bookmarks.move(bookmarkId, {
            parentId: folderId,
            index: savedIndex,
        });
        log.debug('bookmark move complete');
    }

    // *sigh* We tried to activate movedTabItem explicitly here, but that often results in changing the
    // window title, which affects the sort order, which leads to annoying shuffling of windows after
    // a drag operation....
};

/*
 * move an open tab (in response to a drag event):
 */
export const oldMoveTabItem = async (
    targetTabWindow: TabWindow,
    targetIndex: number,
    movedTabItem: TabItem,
    storeRef: TMSRef,
) => {
    log.debug(
        'moveTabItem: targetTabWindow: ',
        targetTabWindow.toJS(),
        'targetIndex: ',
        targetIndex,
    );
    log.debug('moveTabItem: movedTabItem: ', movedTabItem.toJS());
    const st = mutableGet(storeRef);
    /* The tab being moved can be in 4 possible states based
     * on open and saved flags, same for target window...
     */
    let chromeTab: chrome.tabs.Tab | null = null;
    // Let's first handle whether tab being moved is open,
    // and if so either move or close it:
    if (movedTabItem.open) {
        log.debug('moveTabItem: moving an open tab');
        const openTabId = movedTabItem.safeOpenState.openTabId;
        if (targetTabWindow.open) {
            log.debug('moveTabItem: ...to an open window');
            const targetWindowId = targetTabWindow.openWindowId;
            const moveProps = { windowId: targetWindowId, index: targetIndex };
            chromeTab = await chromep.tabs.move(openTabId, moveProps);
            // Let's just refresh the whole window:
            await awaitableSyncChromeWindowById(targetWindowId, storeRef);
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
                const bookmarkId = movedTabItem.savedState!.bookmarkId;
                const srcTabWindow =
                    st.getSavedWindowByTabBookmarkId(bookmarkId);
                if (srcTabWindow && srcTabWindow.open) {
                    await chromep.tabs.remove(openTabId);
                }
            }
        }
    }
    if (movedTabItem.saved && targetTabWindow.saved) {
        const bookmarkId = movedTabItem.savedState!.bookmarkId;
        const folderId = targetTabWindow.savedFolderId;
        const bmNode = await chromep.bookmarks.move(bookmarkId, {
            parentId: folderId,
        });
        update(storeRef, (st) => {
            const srcTabWindow = st.getSavedWindowByTabBookmarkId(bookmarkId);
            const updSt = srcTabWindow
                ? st.handleSavedTabMoved(
                      srcTabWindow,
                      targetTabWindow,
                      movedTabItem,
                      chromeTab!,
                      bmNode,
                  )
                : st;
            return updSt;
        });
        // TODO: should probably change above to an awaitableUpdate,
        // and then resynch the target window if it is open.
    }
};

export function hideRelNotes(storeRef: TMSRef) {
    const manifest = chrome.runtime.getManifest();
    chrome.storage.local.set({ readRelNotesVersion: manifest.version }, () => {
        update(storeRef, (st) => st.set('showRelNotes', false));
    });
}

export function showRelNotes(storeRef: TMSRef) {
    update(storeRef, (st) => st.set('showRelNotes', true));
}

export async function readPreferences(): Promise<prefs.Preferences> {
    const items = await chromep.storage.local.get(prefs.USER_PREFS_KEY);
    log.debug('readPreferences: read: ', items);
    const prefsStr = items[prefs.USER_PREFS_KEY];
    return prefs.Preferences.deserialize(prefsStr);
}

export const loadPreferences = async (
    storeRef: TMSRef,
): Promise<TabManagerState> => {
    const userPrefs = await readPreferences();
    log.debug('loadPreferences: userPrefs: ', userPrefs);
    return awaitableUpdate_(storeRef, (st) => st.set('preferences', userPrefs));
};

export const savePreferences = async (
    userPrefs: prefs.Preferences,
    storeRef: TMSRef,
): Promise<TabManagerState> => {
    let saveObj: any = {};
    saveObj[prefs.USER_PREFS_KEY] = userPrefs.serialize();
    await chromep.storage.local.set(saveObj);
    log.debug('wrote preferences to local storage: ', userPrefs, saveObj);

    // update application state:
    const st = await awaitableUpdate_(storeRef, (st) =>
        st.set('preferences', userPrefs),
    );

    // and update saved state snapshot:
    saveSnapshot(storeRef);
    return st;
};

export const updatePreferences = async (
    stRef: TMSRef,
    updates: Partial<prefs.PreferencesProps>,
): Promise<TabManagerState> => {
    const st = mutableGet(stRef);
    const userPrefs = st.preferences;
    const newPrefs = prefs.Preferences.update(userPrefs, updates);
    log.debug(
        'updatePreferences: new prefs: ',
        newPrefs,
        ' original: ',
        userPrefs,
    );
    return await savePreferences(newPrefs, stRef);
};

let reloadHandler: (() => void) | null = null;

export const setReloadHandler = (reloadFn: () => void) => {
    reloadHandler = reloadFn;
    // TODO: register an onMessage handler to handle an 'onReload' message
};

export const reload = async () => {
    // TODO: send a 'reload' message to background service worker
};

export const tidyWindows = async (stateRef: TMSRef) => {
    const st = mutableGet(stateRef);
    const openWindows = st.getOpen();
    openWindows.forEach((tw) => {
        const windowId = tw.openWindowId;
        if (tw.windowType === 'normal' && windowId !== st.currentWindowId) {
            const windowId = tw.openWindowId;
            chrome.windows.update(windowId, { state: 'minimized' });
        }
    });
};

export const untidyWindows = async (stateRef: TMSRef) => {
    const st = mutableGet(stateRef);
    const lastFocusedTabWindow = st.getCurrentWindow();
    const openWindows = st.getOpen();
    for (let tw of openWindows) {
        const windowId = tw.openWindowId;
        if (tw.windowType === 'normal') {
            const windowId = tw.openWindowId;
            await chrome.windows.update(windowId, { state: 'normal' });
        }
    }
    if (lastFocusedTabWindow !== null) {
        setFocusedWindow(lastFocusedTabWindow);
    }
};
