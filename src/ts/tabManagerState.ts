import { produce, immerable } from 'immer';
import * as prefs from './preferences';
import * as tabWindowUtils from './tabWindowUtils';
import { TabWindow, TabItem } from './tabWindow';
import * as utils from './utils';

export interface TabManagerStateProps {
    windowIdMap: { [id: number]: TabWindow };
    bookmarkIdMap: { [id: string]: TabWindow };
    folderId: string;
    archiveFolderId: string;
    currentWindowId: number;
    popoutWindowId: number;
    showRelNotes: boolean;
    expandAll: boolean;
    preferences: prefs.Preferences;
}

const initialState: TabManagerStateProps = {
    windowIdMap: {},
    bookmarkIdMap: {},
    folderId: 'ERROR_ID',
    archiveFolderId: 'ERROR_ID',
    currentWindowId: -1,
    popoutWindowId: -1,
    showRelNotes: true,
    expandAll: true,
    preferences: prefs.Preferences.create(),
};

export default class TabManagerState {
    [immerable] = true;

    windowIdMap: { [id: number]: TabWindow };
    bookmarkIdMap: { [id: string]: TabWindow };
    folderId: string;
    archiveFolderId: string;
    currentWindowId: number;
    popoutWindowId: number;
    showRelNotes: boolean;
    expandAll: boolean;
    preferences: prefs.Preferences;

    private constructor() {
        this.windowIdMap = {};
        this.bookmarkIdMap = {};
        this.folderId = 'ERROR_ID';
        this.archiveFolderId = 'ERROR_ID';
        this.currentWindowId = -1;
        this.popoutWindowId = -1;
        this.showRelNotes = true;
        this.expandAll = true;
        this.preferences = prefs.Preferences.create();
    }

    static create(props: Partial<TabManagerStateProps> = {}): TabManagerState {
        return produce(new TabManagerState(), (draft) => {
            Object.assign(draft, initialState, props);
        });
    }

    static update(
        state: TabManagerState,
        updater: (draft: TabManagerState) => void,
    ): TabManagerState {
        return produce(state, updater);
    }

    registerTabWindow(tabWindow: TabWindow): TabManagerState {
        return TabManagerState.update(this, (draft) => {
            if (tabWindow.open) {
                draft.windowIdMap[tabWindow.openWindowId] = tabWindow;
            }
            if (tabWindow.saved) {
                draft.bookmarkIdMap[tabWindow.savedFolderId] = tabWindow;
            }
        });
    }

    registerTabWindows(tabWindows: TabWindow[]): TabManagerState {
        return tabWindows.reduce(
            (acc: TabManagerState, w) => acc.registerTabWindow(w),
            this,
        );
    }

    handleTabWindowClosed(tabWindow: TabWindow): TabManagerState {
        return TabManagerState.update(this, (draft) => {
            delete draft.windowIdMap[tabWindow.openWindowId];
            const closedWindow =
                tabWindowUtils.removeOpenWindowState(tabWindow);
            if (closedWindow.saved) {
                draft.bookmarkIdMap[closedWindow.savedFolderId] = closedWindow;
            }
        });
    }

    handleTabWindowExpand(
        tabWindow: TabWindow,
        expand: boolean,
    ): TabManagerState {
        return this.registerTabWindow(
            TabWindow.update(tabWindow, { expanded: expand }),
        );
    }

    handleTabClosed(tabWindow: TabWindow, tabId: number): TabManagerState {
        const updWindow = tabWindowUtils.closeTab(tabWindow, tabId);
        return this.registerTabWindow(updWindow);
    }

    handleTabSaved(
        tabWindow: TabWindow,
        tabItem: TabItem,
        tabNode: chrome.bookmarks.BookmarkTreeNode,
    ): TabManagerState {
        const updWindow = tabWindowUtils.saveTab(tabWindow, tabItem, tabNode);
        return this.registerTabWindow(updWindow);
    }

    handleTabUnsaved(tabWindow: TabWindow, tabItem: TabItem): TabManagerState {
        const updWindow = tabWindowUtils.unsaveTab(tabWindow, tabItem);
        return this.registerTabWindow(updWindow);
    }

    handleSavedTabMoved(
        srcTabWindow: TabWindow,
        dstTabWindow: TabWindow,
        tabItem: TabItem,
        chromeTab: chrome.tabs.Tab,
        bmNode: chrome.bookmarks.BookmarkTreeNode,
    ): TabManagerState {
        const st1 = this.handleTabUnsaved(srcTabWindow, tabItem);
        const updWindow = tabWindowUtils.createSavedTab(
            dstTabWindow,
            chromeTab,
            bmNode,
        );
        return st1.registerTabWindow(updWindow);
    }

    handleTabActivated(tabWindow: TabWindow, tabId: number): TabManagerState {
        const updWindow = tabWindowUtils.setActiveTab(tabWindow, tabId);
        return this.registerTabWindow(updWindow);
    }

    handleTabCreated(
        tabWindow: TabWindow,
        tab: chrome.tabs.Tab,
        openerUrl: string | undefined,
    ): TabManagerState {
        const updWindow = tabWindowUtils.createTab(tabWindow, tab, openerUrl);
        return this.registerTabWindow(updWindow);
    }

    handleTabUpdated(
        tabWindow: TabWindow,
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
    ): TabManagerState {
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
    ): TabManagerState {
        const updWindow = tabWindowUtils.createBookmark(tabWindow, bm);
        return this.registerTabWindow(updWindow);
    }

    handleBookmarkUpdated(
        tabWindow: TabWindow,
        tabItem: TabItem,
        changeInfo: chrome.bookmarks.BookmarkChangeInfo,
    ): TabManagerState {
        const updWindow = tabWindowUtils.updateTabBookmark(
            tabWindow,
            tabItem,
            changeInfo,
        );
        return this.registerTabWindow(updWindow);
    }

    updateSavedWindowTitle(
        tabWindow: TabWindow,
        title: string,
    ): TabManagerState {
        const updWindow = tabWindow.updateSavedTitle(title);
        return this.registerTabWindow(updWindow);
    }

    attachChromeWindow(
        tabWindow: TabWindow,
        chromeWindow: chrome.windows.Window,
    ): TabManagerState {
        return TabManagerState.update(this, (draft) => {
            if (chromeWindow.id && draft.windowIdMap[chromeWindow.id]) {
                delete draft.windowIdMap[chromeWindow.id];
            }
            const attachedTabWindow = tabWindowUtils.updateWindow(
                tabWindow,
                chromeWindow,
            );
            draft.windowIdMap[attachedTabWindow.openWindowId] =
                attachedTabWindow;
            if (attachedTabWindow.saved) {
                draft.bookmarkIdMap[attachedTabWindow.savedFolderId] =
                    attachedTabWindow;
            }
        });
    }

    syncChromeWindow(chromeWindow: chrome.windows.Window): TabManagerState {
        return TabManagerState.update(this, (draft) => {
            const prevTabWindow = chromeWindow.id
                ? draft.windowIdMap[chromeWindow.id]
                : undefined;
            const tabWindow = prevTabWindow
                ? tabWindowUtils.updateWindow(prevTabWindow, chromeWindow)
                : tabWindowUtils.makeChromeTabWindow(chromeWindow);

            if (tabWindow.open && chromeWindow.id) {
                draft.windowIdMap[chromeWindow.id] = tabWindow;
            }
            if (tabWindow.saved) {
                draft.bookmarkIdMap[tabWindow.savedFolderId] = tabWindow;
            }

            if (
                chromeWindow.focused &&
                utils.validChromeWindow(chromeWindow, true)
            ) {
                draft.currentWindowId = chromeWindow.id!;
            }
        });
    }

    syncWindowList(chromeWindowList: chrome.windows.Window[]): TabManagerState {
        return TabManagerState.update(this, (draft) => {
            const validWindows = chromeWindowList.filter((cw) =>
                utils.validChromeWindow(cw, false),
            );
            const chromeIds = new Set(validWindows.map((w) => w.id!));

            // Close windows not in the list
            Object.keys(draft.windowIdMap).forEach((id) => {
                if (!chromeIds.has(Number(id))) {
                    const closedWindow = tabWindowUtils.removeOpenWindowState(
                        draft.windowIdMap[Number(id)],
                    );
                    delete draft.windowIdMap[Number(id)];
                    if (closedWindow.saved) {
                        draft.bookmarkIdMap[closedWindow.savedFolderId] =
                            closedWindow;
                    }
                }
            });

            // Update all open windows
            validWindows.forEach((cw) => {
                const updatedWindow =
                    this.syncChromeWindow(cw).windowIdMap[cw.id!];
                draft.windowIdMap[cw.id!] = updatedWindow;
            });

            // Validate popoutWindowId
            if (draft.popoutWindowId !== -1) {
                const popoutWindow = validWindows.find(
                    (cw) => cw.id === draft.popoutWindowId,
                );
                if (!popoutWindow) {
                    draft.popoutWindowId = -1;
                }
            }
        });
    }

    setCurrentWindowId(windowId: number): TabManagerState {
        return TabManagerState.update(this, (draft) => {
            const tabWindow = this.getTabWindowByChromeId(windowId);
            if (tabWindow && tabWindow.windowType !== 'popup') {
                draft.currentWindowId = windowId;
            }
        });
    }

    setCurrentWindow(chromeWindow: chrome.windows.Window): TabManagerState {
        return utils.validChromeWindow(chromeWindow, true)
            ? this.setCurrentWindowId(chromeWindow.id!)
            : this;
    }

    getCurrentWindow(): TabWindow | null {
        return this.getTabWindowByChromeId(this.currentWindowId);
    }

    getActiveTabId(): number | null {
        const cw = this.getCurrentWindow();
        return cw ? cw.getActiveTabId() : null;
    }

    unmanageWindow(tabWindow: TabWindow): TabManagerState {
        return TabManagerState.update(this, (draft) => {
            delete draft.bookmarkIdMap[tabWindow.savedFolderId];
            const umWindow = tabWindowUtils.removeSavedWindowState(tabWindow);
            if (umWindow.open) {
                draft.windowIdMap[umWindow.openWindowId] = umWindow;
            }
        });
    }

    attachBookmarkFolder(
        bookmarkFolder: chrome.bookmarks.BookmarkTreeNode,
        chromeWindow: chrome.windows.Window,
    ): TabManagerState {
        return TabManagerState.update(this, (draft) => {
            const folderTabWindow =
                tabWindowUtils.makeFolderTabWindow(bookmarkFolder);
            const mergedTabWindow = tabWindowUtils.updateWindow(
                folderTabWindow,
                chromeWindow,
            );
            if (mergedTabWindow.open) {
                draft.windowIdMap[mergedTabWindow.openWindowId] =
                    mergedTabWindow;
            }
            if (mergedTabWindow.saved) {
                draft.bookmarkIdMap[mergedTabWindow.savedFolderId] =
                    mergedTabWindow;
            }
        });
    }

    getOpen(): TabWindow[] {
        return Object.values(this.windowIdMap);
    }

    getAll(): TabWindow[] {
        const openWindows = this.getOpen();
        const closedSavedWindows = Object.values(this.bookmarkIdMap).filter(
            (w) => !w.open,
        );
        return [...openWindows, ...closedSavedWindows];
    }

    findTabWindowByKey(targetKey: string): TabWindow | undefined {
        return this.getAll().find((w) => w.key === targetKey);
    }

    getTabWindowsByType(windowType: string): TabWindow[] {
        return this.getOpen().filter((w) => w.windowType === windowType);
    }

    getTabWindowByChromeId(windowId: number): TabWindow | null {
        return this.windowIdMap[windowId] || null;
    }

    getTabWindowByChromeTabId(tabId: number): TabWindow | null {
        return (
            Object.values(this.windowIdMap).find(
                (w) => w.findChromeTabId(tabId) !== null,
            ) || null
        );
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

    getSavedWindowByBookmarkId(bookmarkId: string): TabWindow | null {
        return this.bookmarkIdMap[bookmarkId] || null;
    }

    getSavedWindowByTabBookmarkId(bookmarkId: string): TabWindow | null {
        return (
            Object.values(this.bookmarkIdMap).find((w) =>
                w.tabItems.some(
                    (ti) =>
                        ti.saved &&
                        ti.savedState &&
                        ti.savedState.bookmarkId === bookmarkId,
                ),
            ) || null
        );
    }

    countOpenWindows(): number {
        return this.getTabWindowsByType('normal').length;
    }

    countSavedWindows(): number {
        return Object.keys(this.bookmarkIdMap).length;
    }

    countOpenTabs(): number {
        return this.getTabWindowsByType('normal').reduce(
            (count, w) => count + w.tabItems.filter((ti) => ti.open).length,
            0,
        );
    }

    getUrlBookmarkIdMap(): Map<string, Set<string>> {
        const bmEnts = Object.entries(this.bookmarkIdMap);
        const bmUrls = bmEnts.flatMap(([bmid, tw]) =>
            tw.tabItems.map((ti) => [ti.url, bmid] as [string, string]),
        );

        const groupedUrls = bmUrls.reduce((acc, [url, bmid]) => {
            if (!acc.has(url)) {
                acc.set(url, new Set());
            }
            acc.get(url)!.add(bmid);
            return acc;
        }, new Map<string, Set<string>>());

        return groupedUrls;
    }

    findURL(url: string): [TabWindow, TabItem][] {
        if (
            url === 'chrome://newtab/' ||
            url.startsWith('chrome-extension://')
        ) {
            return [];
        }

        const openWindows = this.getOpen();
        const matches: [TabWindow, TabItem][] = [];

        for (const tabWindow of openWindows) {
            for (const tabItem of tabWindow.tabItems) {
                if (tabItem.open && tabItem.url === url) {
                    matches.push([tabWindow, tabItem]);
                }
            }
        }

        return matches;
    }

    static deserialize(snapshot: any): TabManagerState {
        const openWindows = Object.values(snapshot.windowIdMap).map((w: any) =>
            TabWindow.create(w),
        );
        const bookmarkWindows = Object.values(snapshot.bookmarkIdMap).map(
            (w: any) => TabWindow.create(w),
        );
        const preferences = prefs.Preferences.create(snapshot.preferences);

        const {
            folderId,
            archiveFolderId,
            currentWindowId,
            popoutWindowId,
            showRelNotes,
            expandAll,
        } = snapshot;

        const st = TabManagerState.create({
            preferences,
            folderId,
            archiveFolderId,
            currentWindowId,
            popoutWindowId,
            showRelNotes,
            expandAll,
        });

        return openWindows
            .concat(bookmarkWindows)
            .reduce((acc, w) => acc.registerTabWindow(w), st);
    }

    // migration aid (ideally we should get rid of this)

    set<K extends keyof TabManagerStateProps>(
        key: K,
        value: TabManagerStateProps[K],
    ): TabManagerState {
        return TabManagerState.update(this, (draft) => {
            (draft[key] as TabManagerStateProps[K]) = value;
        });
    }

    // migration aid (ideally we should get rid of this)
    toJS(): TabManagerStateProps {
        return {
            windowIdMap: this.windowIdMap,
            bookmarkIdMap: this.bookmarkIdMap,
            folderId: this.folderId,
            archiveFolderId: this.archiveFolderId,
            currentWindowId: this.currentWindowId,
            popoutWindowId: this.popoutWindowId,
            showRelNotes: this.showRelNotes,
            expandAll: this.expandAll,
            preferences: this.preferences,
        };
    }
}
