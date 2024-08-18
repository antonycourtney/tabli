/**
 * application state for tab manager
 *
 * We'll instantiate and initialize this in the bgHelper and attach it to the background window,
 * and then retrieve the instance from the background window in the popup
 */
import log from 'loglevel';
import filter from 'lodash/filter';
import flatten from 'lodash/flatten';
import get from 'lodash/get';
import map from 'lodash/map';
import reduce from 'lodash/reduce';
import * as Immutable from 'immutable';
import * as prefs from './preferences';
import * as searchOps from './searchOps';
import escapeStringRegexp from 'escape-string-regexp';
import * as tabWindowUtils from './tabWindowUtils';
import { TabWindow, TabItem } from './tabWindow';
import ChromePromise from 'chrome-promise/chrome-promise';
import { string } from 'prop-types';

const _ = {
    filter,
    flatten,
    get,
    map,
    reduce,
};

function validChromeWindow(
    cw: chrome.windows.Window | null,
    normalOnly: boolean,
) {
    if (!cw) {
        return false;
    }

    const cwTabs = _.get(cw, 'tabs', []);

    const isNormal = cw.type === 'normal' && cwTabs.length > 0;
    const isPopout =
        cw.type === 'popup' && cwTabs.length > 0 && cwTabs[0].title === 'Tabli';
    return isNormal || (!normalOnly && isPopout);
}

interface TabManagerStateProps {
    windowIdMap: Immutable.Map<number, TabWindow>;
    // maps from chrome window id for open windows
    bookmarkIdMap: Immutable.Map<string, TabWindow>;
    // maps from bookmark id for saved windows
    folderId: string;
    archiveFolderId: string;
    currentWindowId: number; // current browser window (or none)
    popoutWindowId: number; // Tabli popout window, if open (or none)
    // chrome window id of window with focus
    showRelNotes: boolean;
    expandAll: boolean;
    // state of global collapse / expand toggle button
    preferences: prefs.Preferences;
}

// We should *really* be using chrome.windows.WINDOW_ID_NONE here, but unfortunately
// the chrome.windows API isn't available in Node for tests, and I couldn't
// get sinon-chrome mock to play nicely with the TS import system so here
// is my shitty workaround:
const CHROME_WINDOW_ID_NONE = -1; // same as chrome.windows.WINDOW_ID_NONE

const tabManagerStateDefaults: TabManagerStateProps = {
    windowIdMap: Immutable.Map(),
    // maps from chrome window id for open windows
    bookmarkIdMap: Immutable.Map(),
    // maps from bookmark id for saved windows
    // These ids should always be specified during state initialization:
    folderId: 'ERROR_ID',
    archiveFolderId: 'ERROR_ID',
    currentWindowId: CHROME_WINDOW_ID_NONE,
    popoutWindowId: CHROME_WINDOW_ID_NONE,
    // chrome window id of window with focus
    showRelNotes: true,
    expandAll: true,
    // state of global collapse / expand toggle button
    preferences: new prefs.Preferences(),
};

export default class TabManagerState extends Immutable.Record(
    tabManagerStateDefaults,
) {
    /**
     * Update store to include the specified window, indexed by
     * open window id or bookmark id
     *
     * Note that if an earlier snapshot of tabWindow is in the store, it will be
     * replaced
     */
    registerTabWindow(tabWindow: TabWindow) {
        const nextWindowIdMap = tabWindow.open
            ? this.windowIdMap.set(tabWindow.openWindowId, tabWindow)
            : this.windowIdMap;
        const nextBookmarkIdMap = tabWindow.saved
            ? this.bookmarkIdMap.set(tabWindow.savedFolderId, tabWindow)
            : this.bookmarkIdMap;
        return this.set('windowIdMap', nextWindowIdMap).set(
            'bookmarkIdMap',
            nextBookmarkIdMap,
        );
    }

    registerTabWindows(tabWindows: TabWindow[]) {
        return _.reduce(tabWindows, (acc, w) => acc.registerTabWindow(w), this);
    }

    handleTabWindowClosed(tabWindow: TabWindow) {
        log.debug('handleTabWindowClosed: ', tabWindow.toJS());
        /*
         * We remove window from map of open windows (windowIdMap) but then we re-register
         * closed window to ensure that a version of saved window stays in
         * bookmarkIdMap.
         */

        const closedWindowIdMap = this.windowIdMap.delete(
            tabWindow.openWindowId,
        );
        const closedWindow = tabWindowUtils.removeOpenWindowState(tabWindow);
        return this.set('windowIdMap', closedWindowIdMap).registerTabWindow(
            closedWindow,
        );
    }

    handleTabWindowExpand(tabWindow: TabWindow, expand: boolean) {
        var updWindow = tabWindow.set('expanded', expand);
        return this.registerTabWindow(updWindow);
    }

    handleTabClosed(tabWindow: TabWindow, tabId: number) {
        log.debug('handleTabClosed: closing tab id ', tabId);
        var updWindow = tabWindowUtils.closeTab(tabWindow, tabId);
        log.debug('handleTabClosed: updWindow: ', updWindow.toJS());
        return this.registerTabWindow(updWindow);
    }

    handleTabSaved(
        tabWindow: TabWindow,
        tabItem: TabItem,
        tabNode: chrome.bookmarks.BookmarkTreeNode,
    ) {
        var updWindow = tabWindowUtils.saveTab(tabWindow, tabItem, tabNode);
        return this.registerTabWindow(updWindow);
    }

    handleTabUnsaved(tabWindow: TabWindow, tabItem: TabItem) {
        var updWindow = tabWindowUtils.unsaveTab(tabWindow, tabItem);
        return this.registerTabWindow(updWindow);
    }

    handleSavedTabMoved(
        srcTabWindow: TabWindow,
        dstTabWindow: TabWindow,
        tabItem: TabItem,
        chromeTab: chrome.tabs.Tab,
        bmNode: chrome.bookmarks.BookmarkTreeNode,
    ) {
        const st1 = this.handleTabUnsaved(srcTabWindow, tabItem);
        const updWindow = tabWindowUtils.createSavedTab(
            dstTabWindow,
            chromeTab,
            bmNode,
        );
        return st1.registerTabWindow(updWindow);
    }

    handleTabActivated(tabWindow: TabWindow, tabId: number) {
        const updWindow = tabWindowUtils.setActiveTab(tabWindow, tabId);
        return this.registerTabWindow(updWindow);
    }

    handleTabCreated(
        tabWindow: TabWindow,
        tab: chrome.tabs.Tab,
        openerUrl: string | undefined,
    ) {
        const updWindow = tabWindowUtils.createTab(tabWindow, tab, openerUrl);
        return this.registerTabWindow(updWindow);
    }

    handleTabUpdated(
        tabWindow: TabWindow,
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
    ) {
        const updWindow = tabWindowUtils.updateTabItem(
            tabWindow,
            tabId,
            changeInfo,
        );
        return this.registerTabWindow(updWindow);
    }

    handleBookmarkCreated(
        tabWindow: TabWindow,
        bm: chrome.bookmarks.BookmarkTreeNode,
    ) {
        const updWindow = tabWindowUtils.createBookmark(tabWindow, bm);
        return this.registerTabWindow(updWindow);
    }

    handleBookmarkUpdated(
        tabWindow: TabWindow,
        tabItem: TabItem,
        changeInfo: chrome.bookmarks.BookmarkChangeInfo,
    ) {
        const updWindow = tabWindowUtils.updateTabBookmark(
            tabWindow,
            tabItem,
            changeInfo,
        );
        return this.registerTabWindow(updWindow);
    }

    updateSavedWindowTitle(tabWindow: TabWindow, title: string) {
        const updWindow = tabWindow.updateSavedTitle(title);
        return this.registerTabWindow(updWindow);
    }
    /**
     * attach a Chrome window to a specific tab window (after opening a saved window)
     */

    attachChromeWindow(
        tabWindow: TabWindow,
        chromeWindow: chrome.windows.Window,
    ) {
        // log.debug('attachChromeWindow: ', tabWindow.toJS(), chromeWindow)
        // Was this Chrome window id previously associated with some other tab window?
        const oldTabWindow = this.windowIdMap.get(chromeWindow.id!); // A store without oldTabWindow

        const rmStore = oldTabWindow
            ? this.handleTabWindowClosed(oldTabWindow)
            : this;
        const attachedTabWindow = tabWindowUtils
            .updateWindow(tabWindow, chromeWindow)
            .remove('expanded'); // log.debug('attachChromeWindow: attachedTabWindow: ', attachedtabWindowUtils.toJS())

        return rmStore.registerTabWindow(attachedTabWindow);
    }
    /**
     * Synchronize internal state of our store with snapshot
     * of current Chrome window state
     *
     * @param chromeWindow window to synchronize
     */

    syncChromeWindow(chromeWindow: chrome.windows.Window) {
        const prevTabWindow = this.windowIdMap.get(chromeWindow.id!);
        /*
          if (!prevTabWindow) {
            log.debug("syncChromeWindow: detected new chromeWindow: ", chromeWindow)
          }
        */

        const tabWindow = prevTabWindow
            ? tabWindowUtils.updateWindow(prevTabWindow, chromeWindow)
            : tabWindowUtils.makeChromeTabWindow(chromeWindow);
        const stReg = this.registerTabWindow(tabWindow); // if window has focus and is a 'normal' window, update current window id:

        const updCurrent =
            chromeWindow.focused && validChromeWindow(chromeWindow, true);
        const st = updCurrent
            ? stReg.set('currentWindowId', chromeWindow.id!)
            : stReg;

        if (updCurrent) {
            log.debug(
                'syncChromeWindow: updated current window to: ',
                chromeWindow.id,
            );
        }

        return st;
    }
    /**
     * synchronize the currently open windows from chrome.windows.getAll with
     * internal map of open windows
     */

    syncWindowList(rawChromeWindowList: chrome.windows.Window[]) {
        // restrict our management to normal chrome windows that have at least 1 tab:
        const chromeWindowList = _.filter(rawChromeWindowList, (cw) =>
            validChromeWindow(cw, false),
        );

        var tabWindows = this.getOpen(); // Iterate through tab windows (our current list of open windows)
        // closing any not in chromeWindowList:

        var chromeIds = _.map(chromeWindowList, 'id');

        var chromeIdSet = new Set(chromeIds);
        var closedWindows = tabWindows.filter(
            (tw) => !chromeIdSet.has(tw.openWindowId),
        );
        var closedWinStore = closedWindows.reduce(
            (acc, tw) => acc.handleTabWindowClosed(tw),
            this,
        ); // Now update all open windows:

        let nextSt = _.reduce(
            chromeWindowList,
            (acc, cw) => acc.syncChromeWindow(cw),
            closedWinStore,
        );

        // validate popoutWindowId using rawChromeWindowList:
        if (nextSt.popoutWindowId !== CHROME_WINDOW_ID_NONE) {
            const popoutWindow = rawChromeWindowList.find(
                (cw) => cw.id === nextSt.popoutWindowId,
            );
            if (popoutWindow === undefined) {
                log.debug(
                    'syncWindowList: popout window id not found in chrome window list, clearing....',
                );
                nextSt = nextSt.set('popoutWindowId', CHROME_WINDOW_ID_NONE);
            }
        }
        return nextSt;
    }

    setCurrentWindowId(windowId: number) {
        const tabWindow = this.getTabWindowByChromeId(windowId);
        if (!tabWindow || tabWindow.windowType === 'popup') {
            return this;
        }
        return this.set('currentWindowId', windowId);
    }

    setCurrentWindow(chromeWindow: chrome.windows.Window) {
        const nextSt = validChromeWindow(chromeWindow, true)
            ? this.setCurrentWindowId(chromeWindow.id!)
            : this;
        return nextSt;
    }

    getCurrentWindow(): TabWindow | null {
        return this.getTabWindowByChromeId(this.currentWindowId);
    }

    getActiveTabId(): number | null {
        const cw = this.getCurrentWindow();
        const tabId = cw ? cw.getActiveTabId() : null;
        return tabId;
    }

    removeBookmarkIdMapEntry(tabWindow: TabWindow) {
        return this.set(
            'bookmarkIdMap',
            this.bookmarkIdMap.delete(tabWindow.savedFolderId),
        );
    }

    unmanageWindow(tabWindow: TabWindow) {
        // Get a view of this store with tabWindow removed from bookmarkIdMap:
        const rmStore = this.removeBookmarkIdMapEntry(tabWindow); // disconnect from the previously associated bookmark folder and re-register

        const umWindow = tabWindowUtils.removeSavedWindowState(tabWindow);
        return rmStore.registerTabWindow(umWindow);
    }
    /**
     * attach a bookmark folder to a specific chrome window
     */

    attachBookmarkFolder(
        bookmarkFolder: chrome.bookmarks.BookmarkTreeNode,
        chromeWindow: chrome.windows.Window,
    ) {
        const folderTabWindow =
            tabWindowUtils.makeFolderTabWindow(bookmarkFolder);
        const mergedTabWindow = tabWindowUtils.updateWindow(
            folderTabWindow,
            chromeWindow,
        ); // And re-register in store maps:

        return this.registerTabWindow(mergedTabWindow);
    }
    /**
     * get the currently open tab windows
     */

    getOpen(): Immutable.Seq.Indexed<TabWindow> {
        const openWindows = this.windowIdMap.toIndexedSeq();
        return openWindows;
    }
    /**
     * N.B. returns a JavaScript Array, not an Immutable Seq
     */

    getAll(): TabWindow[] {
        const openWindows = this.getOpen().toArray();
        const closedSavedWindows = this.bookmarkIdMap
            .toIndexedSeq()
            .filter((w) => !w.open)
            .toArray();
        /*
        console.log(
            '*** getAll: openWindows: ',
            openWindows.length,
            openWindows,
        );
        console.log(
            '*** getAll: closedSavedWindows: ',
            closedSavedWindows.length,
            closedSavedWindows,
        );
        */
        return openWindows.concat(closedSavedWindows);
    }

    findTabWindowByKey(targetKey: string): TabWindow | undefined {
        const allWindows = this.getAll();
        return allWindows.find((w) => w.key === targetKey);
    }

    getTabWindowsByType(windowType: string): Immutable.Seq.Indexed<TabWindow> {
        const openWindows = this.getOpen();
        return openWindows.filter((w) => w.windowType === windowType);
    }

    getTabWindowByChromeId(windowId: number): TabWindow | null {
        const ret = this.windowIdMap.get(windowId);
        return ret ? ret : null;
    }

    /**
     * Find a tabWindow containing the given tab id (or null)
     * Not terribly efficient!
     */
    getTabWindowByChromeTabId(tabId: number): TabWindow | null {
        const tw = this.windowIdMap.find(
            (w) => w.findChromeTabId(tabId) !== null,
        );
        return tw ? tw : null;
    }

    getTabItemByChromeTabId(tabId: number): TabItem | null {
        const tw = this.getTabWindowByChromeTabId(tabId);
        if (tw) {
            const entry = tw.findChromeTabId(tabId);
            if (entry) {
                const [_, tabItem] = entry;
                return tabItem;
            }
        }
        return null;
    }

    // Note: this is the bookmark id of the folder, not saved tab

    getSavedWindowByBookmarkId(bookmarkId: string): TabWindow | null {
        const ret = this.bookmarkIdMap.get(bookmarkId);
        return ret ? ret : null;
    }

    getSavedWindowByTabBookmarkId(bookmarkId: string): TabWindow | null {
        const ret = this.bookmarkIdMap.find(
            (w) => w.findChromeBookmarkId(bookmarkId) !== undefined,
        );
        return ret ? ret : null;
    }

    countOpenWindows() {
        return this.getTabWindowsByType('normal').count();
    }

    countSavedWindows() {
        return this.bookmarkIdMap.count();
    }

    countOpenTabs() {
        return this.getTabWindowsByType('normal').reduce(
            (count, w) => count + w.openTabCount,
            0,
        );
    }
    /*
     * obtain a map from URL to Set<bookmark id> of saved windows, for use on initial
     * attach.
     *
     * returns: Map<URL,Set<BookmarkId>>
     */

    getUrlBookmarkIdMap() {
        const bmEnts = this.bookmarkIdMap.entrySeq(); // bmEnts ::  Iterator<[BookmarkId,TabWindow]>

        const getSavedUrls = (tw: TabWindow) => tw.tabItems.map((ti) => ti.url);

        const bmUrls = bmEnts
            .map(([bmid, tw]) => getSavedUrls(tw).map((url) => [url, bmid]))
            .flatten(true) as Immutable.Seq.Indexed<[string, string]>;

        const groupedUrls = bmUrls.groupBy(
            ([url, bmid]) => url,
        ) as unknown as Immutable.Seq.Keyed<
            string,
            Immutable.Seq.Indexed<[string, string]>
        >;
        const groupedIds = groupedUrls.map((vs) =>
            Immutable.Set(vs.map(([url, bmid]) => bmid)),
        );
        return Immutable.Map(groupedIds);
    }

    /**
     * find tabs matching a given URL
     *
     * returns: Array<[TabWindow, TabItem]>
     */

    findURL(url: string): [TabWindow, TabItem][] {
        // TODO: && !url.startsWith('chrome-extension://')
        if (url !== 'chrome://newtab/') {
            const urlRE = new RegExp('^' + escapeStringRegexp(url) + '$');
            const openWindows = this.getOpen().toArray();
            const filteredWindows = searchOps.filterTabWindows(
                openWindows,
                urlRE,
                {
                    matchUrl: true,
                    matchTitle: false,
                    openOnly: true,
                },
            ); // expand to a simple array of [TabWindow,TabItem] pairs:

            const rawMatches = filteredWindows.map((ftw) => {
                const { tabWindow: targetTabWindow, itemMatches } = ftw;
                const rawMatchPairs = itemMatches.map(
                    (match) =>
                        [targetTabWindow, match.tabItem] as [
                            TabWindow,
                            TabItem,
                        ],
                );
                return rawMatchPairs.toArray();
            });
            const matchPairs = _.flatten<[TabWindow, TabItem]>(rawMatches);

            return matchPairs;
        } else {
            return [];
        }
    }

    static deserialize(snapshot: any): TabManagerState {
        const openWindows = Object.values(snapshot.windowIdMap).map(
            TabWindow.fromJS,
        );
        const bookmarkWindows = Object.values(snapshot.bookmarkIdMap).map(
            TabWindow.fromJS,
        );
        const preferences = prefs.Preferences.deserializeJS(
            snapshot.preferences,
        );

        const {
            folderId,
            archiveFolderId,
            currentWindowId,
            popoutWindowId,
            showRelNotes,
            expandAll,
        } = snapshot;

        const st0 = new TabManagerState({
            preferences,
            folderId,
            archiveFolderId,
            currentWindowId,
            popoutWindowId,
            showRelNotes,
            expandAll,
        });
        const st1 = st0.registerTabWindows(openWindows);
        const st2 = st1.registerTabWindows(bookmarkWindows);

        return st2;
    }
}
