import log from 'loglevel';
import * as Immutable from 'immutable';
import {
    SavedTabState,
    OpenTabStateProps,
    OpenTabState,
    TabItem,
    TabWindow,
    SavedTabStateProps
} from './tabWindow';
import * as suspender from './suspender';
import get from 'lodash/get';
import has from 'lodash/has';
import keys from 'lodash/keys';
import intersection from 'lodash/intersection';
import reduce from 'lodash/reduce';
const _ = { get, has, keys, intersection, reduce };

function tabItemReviver(k: string | number, v: any) {
    if (k === 'savedState') {
        return new SavedTabState(v);
    } else if (k === 'openState') {
        return new OpenTabState(v);
    } else if (k === 'tabItems') {
        const elems = v.map((elem: any) => new TabItem(elem));
        return Immutable.List<TabItem>(elems);
    }
    return v;
}

/*
 * convert a JS object to a TabItem
 */
export function tabItemFromJS(js: Object) {
    const tiMap = Immutable.fromJS(js, tabItemReviver);
    return new TabItem(tiMap);
}

export function tabWindowFromJS(js: Object) {
    const tiMap = Immutable.fromJS(js, tabItemReviver);
    return new TabWindow(tiMap);
}

/*
 * comparator for sorting tab items
 *
 * NOTE (!!): Only used during initial construction of a saved or open window, because
 * open tab items don't maintain openTabIndex in response to tab events.
 */
export function tabItemCompare(tiA: TabItem, tiB: TabItem): number {
    // open items before non-open items:
    if (tiA.open !== tiB.open) {
        if (tiA.open) {
            return -1;
        }
        return 1;
    }
    if (tiA.open && tiA.openState && tiB.openState) {
        // both open, use openTabIndex for comparison:
        const ret = tiA.openState.openTabIndex - tiB.openState.openTabIndex;
        if (ret === 0) {
            log.warn(
                'unexpected equal openTabIndex vals: ',
                tiA.toJS(),
                tiB.toJS()
            );
        }
        return ret;
    }
    // both closed and saved, use bookmark index:
    let sret = 0;
    if (tiA.savedState && tiB.savedState) {
        sret = tiA.savedState.bookmarkIndex - tiB.savedState.bookmarkIndex;
        if (sret === 0) {
            log.warn(
                'unexpected equal bookmarkIndex vals:',
                tiA.savedState.bookmarkIndex,
                tiB.savedState.bookmarkIndex
            );
        }
    } else {
        log.warn(
            'unexpected null saved states: ',
            tiA.savedState,
            tiB.savedState
        );
    }
    if (sret === 0) {
        log.warn(
            'unexpected equal bookmarkIndex vals:',
            tiA.savedState!.bookmarkIndex,
            tiB.savedState!.bookmarkIndex,
            tiA.toJS(),
            tiB.toJS()
        );
    }
    return sret;
}

/*
 * Initialize saved tab state from a bookmark
 */
function makeSavedTabState(bm: chrome.bookmarks.BookmarkTreeNode) {
    const url = _.get(bm, 'url', '');
    if (url.length === 0) {
        log.warn('makeSavedTabState: malformed bookmark: missing URL!: ', bm);
    }
    const ts = new SavedTabState({
        url,
        title: _.get(bm, 'title', url),
        bookmarkId: bm.id,
        bookmarkIndex: bm.index
    });
    return ts;
}

/*
 * Initialize a TabItem from a bookmark
 *
 * Returned TabItem is closed (not associated with an open tab)
 */
function makeBookmarkedTabItem(bm: chrome.bookmarks.BookmarkTreeNode) {
    const savedState = makeSavedTabState(bm);

    const tabItem = new TabItem({
        saved: true,
        savedState
    });
    return tabItem;
}

/*
 * initialize OpenTabState from a browser tab
 */
function makeOpenTabState(tab: chrome.tabs.Tab) {
    const rawURL = _.get(tab, 'url', '');

    const [url, isSuspended] = suspender.getURI(rawURL);

    const muted = _.get(tab, 'mutedInfo.muted', false);

    const ts = new OpenTabState({
        url,
        audible: tab.audible,
        favIconUrl: tab.favIconUrl,
        title: _.get(tab, 'title', url),
        openTabId: tab.id,
        active: tab.active,
        openTabIndex: tab.index,
        pinned: tab.pinned,
        isSuspended,
        muted
    });
    return ts;
}

/*
 * Initialize a TabItem from an open Chrome tab
 */
export function makeOpenTabItem(tab: chrome.tabs.Tab) {
    const openState = makeOpenTabState(tab);

    const tabItem = new TabItem({
        open: true,
        openState
    });
    return tabItem;
}

/*
 * Returns the base saved state of a tab item (no open tab info)
 */
export function resetSavedItem(ti: TabItem): TabItem {
    return ti.remove('open').remove('openState');
}

/*
 * Remove components of OpenState that are only relevant while tab
 * is actually open.
 * Used when creating snapshot state for later session restore.
 */
function cleanOpenState(ti: TabItem): TabItem {
    if (!ti.open) {
        return ti;
    }
    return ti.update('openState', os => os!.remove('openTabId'));
}

/*
 * Return the base state of an open tab (no saved tab info)
 */
function resetOpenItem(ti: TabItem, clearActive: boolean = false): TabItem {
    const noSaved = ti.remove('saved').remove('savedState');
    const noActive = clearActive
        ? noSaved.set('openState', noSaved.safeOpenState.remove('active'))
        : noSaved;
    return noActive;
}

/*
 * Mark window as closed and remove any state (such as openWindowId) only
 * relevant to open windows.
 *
 */
export function removeOpenWindowState(
    tabWindow: TabWindow,
    snapshot: boolean = true
): TabWindow {
    // update tabItems by removing openTabId from any open items:
    const tabItems = tabWindow.tabItems;
    let updTabItems;
    if (!snapshot) {
        // Not snapshotting, so revert -- only keep saved items,
        // and discard their open state.
        const savedTabItems = tabItems.filter(ti => ti.saved);
        updTabItems = savedTabItems.map(resetSavedItem);
    } else {
        // Snapshot -- leave the tab items untouched and
        // set snapshot to true so that we can restore
        // the window to its previous state when it is re-opened.
        updTabItems = tabItems.map(cleanOpenState);
    }

    return tabWindow
        .remove('open')
        .remove('openWindowId')
        .remove('windowType')
        .remove('width')
        .remove('height')
        .set('tabItems', updTabItems)
        .set('snapshot', true);
}

/*
 * remove any saved state, keeping only open tab and window state
 *
 * Used when unsave'ing a saved window
 */
export function removeSavedWindowState(tabWindow: TabWindow): TabWindow {
    return tabWindow
        .remove('saved')
        .remove('savedFolderId')
        .remove('savedTitle');
}

/*
 * Initialize an unopened TabWindow from a bookmarks folder
 */
export function makeFolderTabWindow(
    bookmarkFolder: chrome.bookmarks.BookmarkTreeNode,
    logErrors: boolean = true
): TabWindow {
    const bmChildren = bookmarkFolder.children;
    const itemChildren = bmChildren
        ? bmChildren.filter(node => 'url' in node)
        : [];
    const tabItems = Immutable.List(itemChildren.map(makeBookmarkedTabItem));
    var fallbackTitle = '';
    if (bookmarkFolder.title === undefined) {
        if (logErrors) {
            log.error(
                'makeFolderTabWindow: malformed bookmarkFolder -- missing title: ',
                bookmarkFolder
            );
        }
        if (tabItems.count() > 0) {
            fallbackTitle = tabItems.get(0)!.title;
        }
    }

    const tabWindow = new TabWindow({
        saved: true,
        savedTitle: _.get(bookmarkFolder, 'title', fallbackTitle),
        savedFolderId: bookmarkFolder.id,
        tabItems: tabItems.sort(tabItemCompare)
    });

    return tabWindow;
}

/*
 * Initialize a TabWindow from an open Chrome window
 */
export function makeChromeTabWindow(
    chromeWindow: chrome.windows.Window
): TabWindow {
    const chromeTabs = chromeWindow.tabs ? chromeWindow.tabs : [];
    const tabItems = chromeTabs.map(makeOpenTabItem);
    const tabWindow = new TabWindow({
        open: true,
        openWindowId: chromeWindow.id,
        windowType: chromeWindow.type,
        width: chromeWindow.width,
        height: chromeWindow.height,
        tabItems: Immutable.List(tabItems).sort(tabItemCompare)
    });
    return tabWindow;
}

/*
 * merge saved and currently open tab states into tab items by joining on URL
 *
 * @param {List<TabItem>} savedItems
 * @param {List<TabItem>} openItems
 *
 * @return {List<TabItem>}
 */
export function mergeSavedOpenTabs(
    savedItems: Immutable.List<TabItem>,
    openItems: Immutable.List<TabItem>
): Immutable.List<TabItem> {
    const openUrlSet = Immutable.Set(openItems.map(ti => ti.url));
    const savedItemPairs = savedItems.map<[string, TabItem]>(ti => [
        ti.safeSavedState.url,
        ti
    ]);
    const savedUrlMap: Immutable.Map<string, TabItem> = Immutable.Map(
        savedItemPairs
    );

    /*
     * openTabItems for result -- just map over openItems, enriching with saved state if
     * url present in savedUrlMap.
     * Note that we by doing a map on openItems sequence, we preserve the ordering of openItems; this
     * is crucial since openTabIndex isn't maintained in tab update events.
     */
    const openTabItems = openItems.map(openItem => {
        const savedItem = openItem.openState
            ? savedUrlMap.get(openItem.openState.url, null)
            : null;
        const mergedItem = savedItem
            ? openItem
                  .set('saved', true)
                  .set('savedState', savedItem.savedState)
            : openItem;
        return mergedItem;
    });

    // now grab those saved items that aren't currently open:
    const closedTabItems = savedItems.filter(
        savedItem =>
            savedItem.savedState && !openUrlSet.has(savedItem.savedState.url)
    );

    const mergedTabItems = openTabItems.concat(closedTabItems);

    return mergedTabItems;
}

/*
 * Merge currently open tabs from an open Chrome window with tabItem state of a saved
 * tabWindow
 *
 * @param {List<TabItem>} tabItems -- previous TabItem state
 * @param {[Tab]} openTabs -- currently open tabs from Chrome window
 *
 * @returns {List<TabItem>} TabItems reflecting current window state
 */
function mergeOpenTabs(
    tabItems: Immutable.List<TabItem>,
    openTabs: chrome.tabs.Tab[]
): Immutable.List<TabItem> {
    const baseSavedItems = tabItems.filter(ti => ti.saved).map(resetSavedItem);
    const chromeOpenTabItems = Immutable.List(openTabs.map(makeOpenTabItem));

    const mergedTabItems = mergeSavedOpenTabs(
        baseSavedItems,
        chromeOpenTabItems
    );

    return mergedTabItems;
}

/*
 * re-merge saved and open tab items for a window.
 *
 * Called both after a new tab has been added or URL has changed in an existing tab.
 *
 * @param {TabWindow} tabWindow - TabWindow to be updated
 * @param {Tab|Null} optChromeTab - optional newly created Chrome tab
 * @param {BookmarkTreeNode|Null} optBookmark - optional newly created Chrome bookmark
 */
function mergeTabWindowTabItems(
    tabWindow: TabWindow,
    optChromeTab?: chrome.tabs.Tab,
    optBookmark?: chrome.bookmarks.BookmarkTreeNode
) {
    const tabItems = tabWindow.tabItems;

    // If this tab is active, clear active from all other tabs:
    const clearActive = optChromeTab && optChromeTab.active;

    const baseSavedItems = tabItems.filter(ti => ti.saved).map(resetSavedItem);
    const baseOpenItems = tabItems
        .filter(ti => ti.open)
        .map(ti => resetOpenItem(ti, clearActive));

    const updOpenItems = optChromeTab
        ? baseOpenItems
              .toList()
              .insert(optChromeTab.index, makeOpenTabItem(optChromeTab))
        : baseOpenItems;

    const updSavedItems = optBookmark
        ? baseSavedItems.toList().push(makeBookmarkedTabItem(optBookmark))
        : baseSavedItems;

    const mergedItems = mergeSavedOpenTabs(updSavedItems, updOpenItems);
    const updWindow = tabWindow.setTabItems(mergedItems);
    return updWindow;
}

/*
 * Update a TabWindow by adding a newly created tab
 *
 * @param {TabWindow} tabWindow - TabWindow to be updated
 * @param {Tab} tab - newly created Chrome tab
 */
export function createTab(
    tabWindow: TabWindow,
    tab: chrome.tabs.Tab
): TabWindow {
    return mergeTabWindowTabItems(tabWindow, tab);
}

/*
 * Update a TabWindow by adding a saved tab
 * (called when moving saved tabs between windows)
 *
 * @param {TabWindow} tabWindow - TabWindow to be updated
 * @param {Tab} tab - newly created Chrome tab
 */
export function createSavedTab(
    tabWindow: TabWindow,
    tab: any,
    bmNode: any
): TabWindow {
    return mergeTabWindowTabItems(tabWindow, tab, bmNode);
}

/*
 * Update a TabWindow by adding a newly created bookmark
 *
 * @param {TabWindow} tabWindow - TabWindow to be updated
 * @param {BookmarkTreeNode} bm - newly created Chrome bookmark
 */
export function createBookmark(
    tabWindow: TabWindow,
    bm: chrome.bookmarks.BookmarkTreeNode
): TabWindow {
    return mergeTabWindowTabItems(tabWindow, undefined, bm);
}

/*
 * update a TabWindow from a current snapshot of the Chrome Window
 *
 * @param {TabWindow} tabWindow - TabWindow to be updated
 * @param {ChromeWindow} chromeWindow - current snapshot of Chrome window state
 *
 * @return {TabWindow} Updated TabWindow
 */
export function updateWindow(
    tabWindow: TabWindow,
    chromeWindow: chrome.windows.Window
): TabWindow {
    log.debug('updateWindow: ', tabWindow.toJS(), chromeWindow);
    const mergedTabItems = mergeOpenTabs(
        tabWindow.tabItems,
        chromeWindow.tabs!
    );
    const updWindow = tabWindow
        .setTabItems(mergedTabItems)
        .set('windowType', chromeWindow.type)
        .set('open', true)
        .set('openWindowId', chromeWindow.id)
        .remove('snapshot')
        .remove('chromeSessionId');
    log.debug('updateWindow: updated Window: ', updWindow.toJS());
    return updWindow;
}

/*
 * handle a tab that's been closed
 *
 * @param {TabWindow} tabWindow - tab window with tab that's been closed
 * @param {Number} tabId -- Chrome id of closed tab
 *
 * @return {TabWindow} tabWindow with tabItems updated to reflect tab closure
 */
export function closeTab(tabWindow: TabWindow, tabId: number): TabWindow {
    log.debug('TabWindow.closeTab: ', tabWindow.toJS(), tabId);
    const entry = tabWindow.findChromeTabId(tabId);

    if (!entry) {
        log.info('TabWindow.closeTab: could not find closed tab id ', tabId);
        return tabWindow;
    }
    const [index, tabItem] = entry;

    var updItems;

    if (tabItem.saved) {
        var updTabItem = resetSavedItem(tabItem);
        updItems = tabWindow.tabItems.splice(index, 1, updTabItem);
    } else {
        updItems = tabWindow.tabItems.splice(index, 1);
    }

    return tabWindow.setTabItems(updItems);
}

/*
 * Update a tab's saved state
 *
 * @param {TabWindow} tabWindow - tab window with tab that's been closed
 * @param {TabItem} tabItem -- open tab that has been saved
 * @param {BookmarkTreeNode} tabNode -- bookmark node for saved bookmark
 *
 * @return {TabWindow} tabWindow with tabItems updated to reflect saved state
 */
export function saveTab(
    tabWindow: TabWindow,
    tabItem: TabItem,
    tabNode: chrome.bookmarks.BookmarkTreeNode
): TabWindow {
    const entry = tabWindow.findChromeTabId(tabItem.safeOpenState.openTabId);
    if (!entry) {
        log.error(
            'saveTab: could not find tab id for ',
            tabItem.toJS(),
            ' in tabWindow ',
            tabWindow.toJS()
        );
        return tabWindow;
    }
    const [index] = entry;

    const savedState = new SavedTabState(tabNode);

    const updTabItem = tabItem.set('saved', true).set('savedState', savedState);

    const updItems = tabWindow.tabItems.splice(index, 1, updTabItem);

    return tabWindow.setTabItems(updItems);
}

/*
 * Update a tab's saved state when tab has been 'unsaved' (i.e. bookmark removed)
 *
 * @param {TabWindow} tabWindow - tab window with tab that's been unsaved
 * @param {TabItem} tabItem -- open tab that has been saved
 *
 * @return {TabWindow} tabWindow with tabItems updated to reflect saved state
 */
export function unsaveTab(tabWindow: TabWindow, tabItem: TabItem) {
    log.debug('unsaveTab: ', tabWindow.toJS(), tabItem.toJS());
    const entry = tabWindow.tabItems.findEntry(
        ti =>
            ti.saved &&
            ti.safeSavedState.bookmarkId === tabItem.safeSavedState.bookmarkId
    );
    if (!entry) {
        log.error(
            'unsaveTab: could not find tab id for ',
            tabItem.toJS(),
            ' in tabWindow ',
            tabWindow.toJS()
        );
        return tabWindow;
    }
    // Note: We extract sourceTabItem from entry to
    // correctly handle the case of a moved tabItem,
    // where tabItem passed in has already been moved
    var [index, sourceTabItem] = entry;
    log.debug('unsavedTab: sourceTabItem: ', sourceTabItem.toJS());
    const updTabItem = resetOpenItem(sourceTabItem);
    log.debug('unsavedTab: sourceTabItem after reset: ', updTabItem.toJS());

    var updItems;
    if (updTabItem.open) {
        updItems = tabWindow.tabItems.splice(index, 1, updTabItem);
    } else {
        // It's neither open nor saved, so just get rid of it...
        updItems = tabWindow.tabItems.splice(index, 1);
    }

    const updWindow = tabWindow.setTabItems(updItems);
    log.debug('unsaveTab: updated window: ', updWindow.toJS());
    return updWindow;
}

/*
 * Set the active tab in a window to the tab with specified tabId
 *
 * @param {TabWindow} tabWindow -- tab window to be updated
 * @param {tabId} activeTabId - chrome tab id of active tab
 *
 * @return {TabWindow} tabWindow updated with specified tab as active tab.
 */
export function setActiveTab(tabWindow: TabWindow, tabId: number) {
    const tabPos = tabWindow.findChromeTabId(tabId);

    if (!tabPos) {
        log.debug('setActiveTab -- tab id not found: ', tabId);
        return tabWindow;
    }

    const [index, tabItem] = tabPos;
    if (tabItem.active) {
        log.debug('setActiveTab: tab was already active, igoring');
        return tabWindow;
    }

    // mark all other tabs as not active:
    const tabItemRemoveActive = (ti: TabItem) => {
        return ti.open
            ? ti.set('openState', ti.safeOpenState.remove('active'))
            : ti;
    };

    const nonActiveItems = tabWindow.tabItems.map(tabItemRemoveActive);

    const updOpenState = tabItem.safeOpenState.set('active', true);
    const updActiveTab = tabItem.set('openState', updOpenState);
    const updItems = nonActiveItems.splice(index, 1, updActiveTab);

    return tabWindow.setTabItems(updItems);
}

/*
 * update a tabItem in a TabWindow to latest chrome tab state
 *
 * May be called with a new or an existing tab
 *
 * @param {TabWindow} tabWindow -- tab window to be updated
 * @param {TabId} tab - chrome tab id
 * @param {changeInfo} object -- fields that have changed in ChromeWindow
 *
 * @return {TabWindow} tabWindow with updated tab state
 */
export function updateTabItem(
    tabWindow: TabWindow,
    tabId: number,
    chromeChangeInfo: chrome.tabs.TabChangeInfo
) {
    const tabPos = tabWindow.findChromeTabId(tabId);

    if (!tabPos) {
        // log.warn("updateTabItem: Got update for unknown tab id ", tabId)
        // log.debug("updateTabItem: changeInfo: ", changeInfo)
        return tabWindow;
    }
    const [index, prevTabItem] = tabPos;
    const prevOpenState = prevTabItem.openState;
    if (prevOpenState == null) {
        log.error('updateTabItem: unexpected null open state: ', prevTabItem);
        return tabWindow;
    }
    let changeInfo = {};
    let urlInfo = {};
    let rawURL = chromeChangeInfo.url;
    if (rawURL) {
        const [url, isSuspended] = suspender.getURI(rawURL);
        urlInfo = { url, isSuspended };
    }

    let mutedInfo = {};
    if (_.has(chromeChangeInfo, 'mutedInfo.muted')) {
        mutedInfo = { muted: chromeChangeInfo.mutedInfo!.muted };
    }
    Object.assign(changeInfo, chromeChangeInfo, urlInfo, mutedInfo);

    const updKeys = _.intersection(
        _.keys(prevOpenState.toJS()),
        _.keys(changeInfo)
    );

    if (updKeys.length === 0) {
        return tabWindow;
    }
    const updOpenState = _.reduce(
        updKeys,
        (acc, k) => {
            return acc.set(
                k as keyof OpenTabStateProps,
                (changeInfo as any)[k]
            );
        },
        prevOpenState
    );

    const updTabItem =
        updKeys.length > 0
            ? prevTabItem.set('openState', updOpenState)
            : prevTabItem;

    // log.debug("updateTabItem: ", index, updTabItem.toJS())
    const updItems = tabWindow.tabItems.splice(index, 1, updTabItem);
    const updWindow = tabWindow.setTabItems(updItems);

    if (_.has(changeInfo, 'url')) {
        // May have to split or the updated tabItems -- just re-merge all tabs:
        return mergeTabWindowTabItems(updWindow);
    }
    return updWindow;
}

/*
 * update SavedTabState of a tab item in response to a change
 * notification indicating an update to the corresponding bookmark's
 * title or url
 *
 * @param {TabWindow} tabWindow -- tab window to be updated
 * @param {TabItem} tabItem - tab item corresponding to tab
 * @param {changeInfo} object -- fields that have changed in bookmark (title and/or url)
 *
 * @return {TabWindow} tabWindow with updated tab state
 */
export function updateTabBookmark(
    tabWindow: TabWindow,
    tabItem: TabItem,
    changeInfo: chrome.bookmarks.BookmarkChangeInfo
) {
    const index = tabWindow.indexOf(tabItem);
    if (!index) {
        log.error(
            'tabItem not found in TabWindow: ',
            tabWindow.toJS(),
            tabItem.toJS()
        );
        return tabWindow;
    }
    const prevTabItem = tabItem;
    const prevSavedState = tabItem.savedState;
    if (prevSavedState == null) {
        return tabWindow;
    }
    const updKeys = _.intersection(
        _.keys(prevSavedState.toJS()),
        _.keys(changeInfo)
    );

    if (updKeys.length === 0) {
        return tabWindow;
    }
    const updSavedState = _.reduce(
        updKeys,
        (acc, k) =>
            acc.set(k as keyof SavedTabStateProps, (changeInfo as any)[k]),
        prevSavedState
    );

    const updTabItem =
        updKeys.length > 0
            ? prevTabItem.set('savedState', updSavedState)
            : prevTabItem;

    // log.debug("updateTabItem: ", index, updTabItem.toJS())
    const updItems = tabWindow.tabItems.splice(index, 1, updTabItem);

    const updWindow = tabWindow.setTabItems(updItems);

    if (_.has(changeInfo, 'url')) {
        // May have to split or the updated tabItems -- just re-merge all tabs:
        return mergeTabWindowTabItems(updWindow);
    }
    return updWindow;
}
