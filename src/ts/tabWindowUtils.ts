import { log } from './globals';
import { produce } from 'immer';
import { SavedTabState, OpenTabState, TabItem, TabWindow } from './tabWindow';
import * as suspender from './suspender';

export function tabItemFromJS(js: any): TabItem {
    return TabItem.create(js);
}

export function tabWindowFromJS(js: any): TabWindow {
    return TabWindow.create(js);
}

export function tabItemCompare(tiA: TabItem, tiB: TabItem): number {
    if (tiA.open !== tiB.open) {
        return tiA.open ? -1 : 1;
    }
    if (tiA.open && tiA.openState && tiB.openState) {
        const ret = tiA.openState.openTabIndex - tiB.openState.openTabIndex;
        if (ret === 0) {
            log.warn('unexpected equal openTabIndex vals: ', tiA, tiB);
        }
        return ret;
    }
    let sret = 0;
    if (tiA.savedState && tiB.savedState) {
        sret = tiA.savedState.bookmarkIndex - tiB.savedState.bookmarkIndex;
        if (sret === 0) {
            log.warn(
                'unexpected equal bookmarkIndex vals:',
                tiA.savedState.bookmarkIndex,
                tiB.savedState.bookmarkIndex,
            );
        }
    } else {
        log.warn(
            'unexpected null saved states: ',
            tiA.savedState,
            tiB.savedState,
        );
    }
    if (sret === 0) {
        log.warn(
            'unexpected equal bookmarkIndex vals:',
            tiA.savedState!.bookmarkIndex,
            tiB.savedState!.bookmarkIndex,
            tiA,
            tiB,
        );
    }
    return sret;
}

function makeSavedTabState(
    bm: chrome.bookmarks.BookmarkTreeNode,
): SavedTabState {
    return SavedTabState.create({
        url: bm.url || '',
        title: bm.title || bm.url || '',
        bookmarkId: bm.id,
        bookmarkIndex: bm.index || 0,
    });
}

export function makeBookmarkedTabItem(
    bm: chrome.bookmarks.BookmarkTreeNode,
): TabItem {
    return TabItem.create({
        saved: true,
        savedState: makeSavedTabState(bm),
    });
}

function makeOpenTabState(
    tab: chrome.tabs.Tab,
    openerUrl?: string,
): OpenTabState {
    const [url, isSuspended] = suspender.getURI(tab.url || '');
    return OpenTabState.create({
        url,
        audible: tab.audible,
        favIconUrl: tab.favIconUrl,
        title: tab.title || url,
        openTabId: tab.id!,
        active: tab.active,
        openTabIndex: tab.index,
        pinned: tab.pinned,
        isSuspended,
        muted: tab.mutedInfo?.muted || false,
        openerTabId: tab.openerTabId,
        openerUrl,
    });
}

export function makeOpenTabItem(
    tab: chrome.tabs.Tab,
    openerUrl?: string,
): TabItem {
    return TabItem.create({
        open: true,
        openState: makeOpenTabState(tab, openerUrl),
    });
}

export function resetSavedItem(ti: TabItem): TabItem {
    return TabItem.create({
        saved: ti.saved,
        savedState: ti.savedState,
    });
}

function cleanOpenState(ti: TabItem): TabItem {
    if (!ti.open) {
        return ti;
    }
    return TabItem.update(ti, {
        openState: ti.openState
            ? OpenTabState.create({ ...ti.openState, openTabId: undefined })
            : null,
    });
}

function resetOpenItem(ti: TabItem, clearActive: boolean = false): TabItem {
    let openState = ti.openState;
    if (clearActive && openState) {
        openState = OpenTabState.update(openState, { active: false });
    }
    return TabItem.create({
        open: ti.open,
        openState,
    });
}

export function removeOpenWindowState(
    tabWindow: TabWindow,
    snapshot: boolean = true,
): TabWindow {
    return TabWindow.update(tabWindow, {
        open: false,
        openWindowId: -1,
        windowType: '',
        width: 0,
        height: 0,
        tabItems: snapshot
            ? tabWindow.tabItems.map(cleanOpenState)
            : tabWindow.tabItems.filter((ti) => ti.saved).map(resetSavedItem),
        snapshot: true,
    });
}

export function removeSavedWindowState(tabWindow: TabWindow): TabWindow {
    return TabWindow.update(tabWindow, {
        saved: false,
        savedFolderId: '',
        savedTitle: '',
    });
}

export function makeFolderTabWindow(
    bookmarkFolder: chrome.bookmarks.BookmarkTreeNode,
): TabWindow {
    const tabItems = (bookmarkFolder.children || [])
        .filter((node) => 'url' in node)
        .map(makeBookmarkedTabItem);

    return TabWindow.create({
        saved: true,
        savedTitle: bookmarkFolder.title || '',
        savedFolderId: bookmarkFolder.id,
        tabItems: tabItems.sort(tabItemCompare),
    });
}

export function makeChromeTabWindow(
    chromeWindow: chrome.windows.Window,
): TabWindow {
    const tabItems = (chromeWindow.tabs || []).map((tab: chrome.tabs.Tab) =>
        makeOpenTabItem(tab),
    );
    return TabWindow.create({
        open: true,
        openWindowId: chromeWindow.id!,
        windowType: chromeWindow.type || '',
        width: chromeWindow.width || 0,
        height: chromeWindow.height || 0,
        tabItems: tabItems.sort(tabItemCompare),
    });
}

export function mergeSavedOpenTabs(
    savedItems: TabItem[],
    openItems: TabItem[],
): TabItem[] {
    const openUrlSet = new Set(openItems.map((ti) => ti.url));
    const savedUrlMap = new Map(savedItems.map((ti) => [ti.url, ti]));

    const openTabItems = openItems.map((openItem) => {
        const savedItem = openItem.openState
            ? savedUrlMap.get(openItem.openState.url)
            : null;
        return savedItem
            ? TabItem.update(openItem, {
                  saved: true,
                  savedState: savedItem.savedState,
              })
            : openItem;
    });

    const closedTabItems = savedItems.filter(
        (savedItem) => !openUrlSet.has(savedItem.url),
    );

    return [...openTabItems, ...closedTabItems];
}

export function mergeOpenTabs(
    tabItems: TabItem[],
    openTabs: chrome.tabs.Tab[],
): TabItem[] {
    const baseSavedItems = tabItems
        .filter((ti) => ti.saved)
        .map(resetSavedItem);
    const chromeOpenTabItems = openTabs.map((tab: chrome.tabs.Tab) =>
        makeOpenTabItem(tab),
    );
    return mergeSavedOpenTabs(baseSavedItems, chromeOpenTabItems);
}

export function mergeTabWindowTabItems(
    tabWindow: TabWindow,
    optChromeTab?: chrome.tabs.Tab,
    optBookmark?: chrome.bookmarks.BookmarkTreeNode,
    openerUrl?: string,
): TabWindow {
    const clearActive = optChromeTab && optChromeTab.active;

    let baseSavedItems = tabWindow.tabItems
        .filter((ti) => ti.saved)
        .map(resetSavedItem);
    let baseOpenItems = tabWindow.tabItems
        .filter((ti) => ti.open)
        .map((ti) => resetOpenItem(ti, clearActive));

    if (optChromeTab && optChromeTab.id) {
        baseOpenItems = baseOpenItems.filter(
            (ti) => ti.openState!.openTabId !== optChromeTab.id,
        );
    }

    if (optBookmark) {
        baseSavedItems = baseSavedItems.filter(
            (ti) => ti.savedState!.bookmarkId !== optBookmark.id,
        );
    }

    const updOpenItems = optChromeTab
        ? [
              ...baseOpenItems.slice(0, optChromeTab.index),
              makeOpenTabItem(optChromeTab, openerUrl),
              ...baseOpenItems.slice(optChromeTab.index),
          ]
        : baseOpenItems;

    const updSavedItems = optBookmark
        ? [...baseSavedItems, makeBookmarkedTabItem(optBookmark)]
        : baseSavedItems;

    const mergedItems = mergeSavedOpenTabs(updSavedItems, updOpenItems);
    return TabWindow.update(tabWindow, { tabItems: mergedItems });
}

/* Splice in updated tab item at index
 * Based on mergeTabWindowTabItems, but we don't assume that we have
 * the original Chrome tab.
 */
function spliceUpdatedTabItem(
    tabWindow: TabWindow,
    index: number,
    prevTabItem: TabItem,
    updatedOpenState: OpenTabState,
): TabWindow {
    const clearActive = updatedOpenState.active;

    let baseSavedItems = tabWindow.tabItems
        .filter((ti) => ti.saved)
        .map(resetSavedItem);
    let baseOpenItems = tabWindow.tabItems
        .filter((ti) => ti.open)
        .map((ti) => resetOpenItem(ti, clearActive));

    baseOpenItems = baseOpenItems.filter(
        (ti) => ti.openState!.openTabId !== updatedOpenState.openTabId,
    );

    const updOpenItems = [
        ...baseOpenItems.slice(0, index),
        TabItem.create({ open: true, openState: updatedOpenState }),
        ...baseOpenItems.slice(index),
    ];

    const updSavedItems = baseSavedItems;

    const mergedItems = mergeSavedOpenTabs(updSavedItems, updOpenItems);
    return TabWindow.update(tabWindow, { tabItems: mergedItems });
}

export function createTab(
    tabWindow: TabWindow,
    tab: chrome.tabs.Tab,
    openerUrl: string | undefined,
): TabWindow {
    return mergeTabWindowTabItems(tabWindow, tab, undefined, openerUrl);
}

export function createSavedTab(
    tabWindow: TabWindow,
    tab: chrome.tabs.Tab,
    bmNode: chrome.bookmarks.BookmarkTreeNode,
): TabWindow {
    return mergeTabWindowTabItems(tabWindow, tab, bmNode);
}

export function createBookmark(
    tabWindow: TabWindow,
    bm: chrome.bookmarks.BookmarkTreeNode,
): TabWindow {
    return mergeTabWindowTabItems(tabWindow, undefined, bm);
}

export function updateWindow(
    tabWindow: TabWindow,
    chromeWindow: chrome.windows.Window,
): TabWindow {
    const mergedTabItems = mergeOpenTabs(
        tabWindow.tabItems,
        chromeWindow.tabs || [],
    );
    return TabWindow.update(tabWindow, {
        windowType: chromeWindow.type || '',
        open: true,
        openWindowId: chromeWindow.id!,
        snapshot: false,
        chromeSessionId: null,
        tabItems: mergedTabItems,
    });
}

export function closeTab(tabWindow: TabWindow, tabId: number): TabWindow {
    const index = tabWindow.tabItems.findIndex(
        (ti) => ti.open && ti.openState!.openTabId === tabId,
    );
    if (index === -1) {
        log.debug('closeTab: could not find closed tab id ', tabId);
        return tabWindow;
    }

    return TabWindow.update(tabWindow, {
        tabItems: tabWindow.tabItems
            .map((ti, i) =>
                i === index
                    ? ti.saved
                        ? resetSavedItem(ti)
                        : TabItem.create()
                    : ti,
            )
            .filter((ti) => ti.saved || ti.open),
    });
}

export function saveTab(
    tabWindow: TabWindow,
    tabItem: TabItem,
    tabNode: chrome.bookmarks.BookmarkTreeNode,
): TabWindow {
    const index = tabWindow.tabItems.findIndex(
        (ti) =>
            ti.open && ti.openState!.openTabId === tabItem.openState!.openTabId,
    );
    if (index === -1) {
        log.error(
            'saveTab: could not find tab id for ',
            tabItem,
            ' in tabWindow ',
            tabWindow,
        );
        return tabWindow;
    }

    const savedState = makeSavedTabState(tabNode);
    const updatedTabItem = TabItem.update(tabItem, { saved: true, savedState });

    return TabWindow.update(tabWindow, {
        tabItems: tabWindow.tabItems.map((ti, i) =>
            i === index ? updatedTabItem : ti,
        ),
    });
}

export function unsaveTab(tabWindow: TabWindow, tabItem: TabItem): TabWindow {
    const index = tabWindow.tabItems.findIndex(
        (ti) =>
            ti.saved &&
            ti.savedState!.bookmarkId === tabItem.savedState!.bookmarkId,
    );
    if (index === -1) {
        log.error(
            'unsaveTab: could not find tab id for ',
            tabItem,
            ' in tabWindow ',
            tabWindow,
        );
        return tabWindow;
    }

    const updatedTabItem = resetOpenItem(tabItem);

    return TabWindow.update(tabWindow, {
        tabItems: tabWindow.tabItems
            .map((ti, i) => (i === index ? updatedTabItem : ti))
            .filter((ti) => ti.open || ti.saved),
    });
}

export function setActiveTab(tabWindow: TabWindow, tabId: number): TabWindow {
    return TabWindow.update(tabWindow, {
        tabItems: tabWindow.tabItems.map((ti) =>
            TabItem.update(ti, {
                openState: ti.openState
                    ? OpenTabState.update(ti.openState, {
                          active: ti.openState.openTabId === tabId,
                      })
                    : null,
            }),
        ),
    });
}

export function updateTabItem(
    tabWindow: TabWindow,
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
): TabWindow {
    const index = tabWindow.tabItems.findIndex(
        (ti) => ti.open && ti.openState!.openTabId === tabId,
    );
    if (index === -1) {
        return tabWindow;
    }

    const prevTabItem = tabWindow.tabItems[index];
    const prevOpenState = prevTabItem.openState!;

    let updatedOpenState = { ...prevOpenState, ...changeInfo };
    if (changeInfo.url) {
        const [url, isSuspended] = suspender.getURI(changeInfo.url);
        updatedOpenState = { ...updatedOpenState, url, isSuspended };
    }
    if (changeInfo.mutedInfo) {
        updatedOpenState.muted = changeInfo.mutedInfo.muted;
    }

    if (changeInfo.url) {
        return spliceUpdatedTabItem(
            tabWindow,
            index,
            prevTabItem,
            updatedOpenState,
        );
    } else {
        // URL did not change, so this is fairly minor state update:
        const updatedTabItem = TabItem.update(prevTabItem, {
            openState: OpenTabState.create(updatedOpenState),
        });

        return TabWindow.update(tabWindow, {
            tabItems: tabWindow.tabItems.map((ti, i) =>
                i === index ? updatedTabItem : ti,
            ),
        });
    }
}

export function updateTabBookmark(
    tabWindow: TabWindow,
    tabItem: TabItem,
    changeInfo: chrome.bookmarks.BookmarkChangeInfo,
): TabWindow {
    const index = tabWindow.tabItems.findIndex((ti) => ti === tabItem);
    if (index === -1) {
        log.error('tabItem not found in TabWindow: ', tabWindow, tabItem);
        return tabWindow;
    }

    const updatedSavedState = SavedTabState.update(
        tabItem.savedState!,
        changeInfo,
    );
    const updatedTabItem = TabItem.update(tabItem, {
        savedState: updatedSavedState,
    });

    return TabWindow.update(tabWindow, {
        tabItems: tabWindow.tabItems.map((ti, i) =>
            i === index ? updatedTabItem : ti,
        ),
    });
}
