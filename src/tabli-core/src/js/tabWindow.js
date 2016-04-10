/**
 * Representation of tabbed windows using Immutable.js
 */
import * as _ from 'lodash';
import * as Immutable from 'immutable';

/**
 * Tab state that is persisted as a bookmark
 */
const SavedTabState = Immutable.Record({
  bookmarkId: '',
  bookmarkIndex: 0,   // position in bookmark folder
  title: '',
  url: ''  
});


/**
 * Tab state associated with an open browser tab
 */
const OpenTabState = Immutable.Record({
  url: '',
  openTabId: -1,
  active: false,
  openTabIndex: 0,  // index of open tab in its window
  favIconUrl: '',
  title: '',
  audible: false  
});


/**
 * An item in a tabbed window.
 *
 * May be associated with an open tab, a bookmark, or both
 */
export class TabItem extends Immutable.Record({
  saved: false,
  savedState: null, // SavedTabState iff saved

  open: false,    // Note: Saved tabs may be closed even when containing window is open
  openState: null // OpenTabState iff open
}) {
  get title() {
    if (this.open) {
      return this.openState.title;
    }

    return this.savedState.title;
  }

  get url() {
    if (this.open) {
      return this.openState.url;
    }

    return this.savedState.url;
  }
}

/**
 * Initialize saved tab state from a bookmark
 */
function makeSavedTabState(bm) {
  const url = _.get(bm,'url','');
  if (url.length===0) {
    console.warn('makeSavedTabState: malformed bookmark: missing URL!: ', bm);    
  }
  const ts = new SavedTabState({
    url,
    title: _.get(bm,'title',url),
    bookmarkId: bm.id,
    bookmarkIndex: bm.index
  });
  return ts;
}

/**
 * Initialize a TabItem from a bookmark
 *
 * Returned TabItem is closed (not associated with an open tab)
 */
function makeBookmarkedTabItem(bm) {
  const savedState = makeSavedTabState(bm);

  const tabItem = new TabItem({
    saved: true,
    savedState
  });
  return tabItem;
}

/**
 * initialize OpenTabState from a browser tab
 */
function makeOpenTabState(tab) {
  const url = _.get(tab,'url','');
  const ts = new OpenTabState({
    url,
    audible: tab.audible,
    favIconUrl: tab.favIconUrl,
    title: _.get(tab, 'title', url),
    openTabId: tab.id,
    active: tab.active,
    openTabIndex: tab.index
  });
  return ts;
}

/**
 * Initialize a TabItem from an open Chrome tab
 */
function makeOpenTabItem(tab) {
  const openState = makeOpenTabState(tab);

  const tabItem = new TabItem({
    open: true,
    openState
  });
  return tabItem;
}

/**
 * Returns the base saved state of a tab item (no open tab info)
 */
function resetSavedItem(ti) {
  return ti.remove('open').remove('openState');
}

/**
 * Return the base state of an open tab (no saved tab info)
 */
function resetOpenItem(ti) {
  return ti.remove('saved').remove('savedState');
}

/**
 * A TabWindow
 *
 * Tab windows have a title and a set of tab items.
 *
 * A TabWindow has 3 possible states:
 *   (open,!saved)   - An open Chrome window that has not had its tabs saved
 *   (open,saved)    - An open Chrome window that has also had its tabs saved (as bookmarks)
 *   (!open,saved)   - A previously saved window that is not currently open
 */
export class TabWindow extends Immutable.Record({
  saved: false,
  savedTitle: '',
  savedFolderId: -1,

  open: false,
  openWindowId: -1,
  windowType: '',
  width: 0,
  height: 0,

  tabItems: Immutable.Seq(),  // <TabItem>
}) {

  get title() {
    if (this._title === undefined) {
      this._title = this.computeTitle();
    }

    return this._title;
  }

  computeTitle() {
    if (this.saved) {
      return this.savedTitle;
    }

    const activeTab = this.tabItems.find((t) => t.open && t.openState.active);

    if (!activeTab) {
      // shouldn't happen!
      console.warn('TabWindow.get title(): No active tab found: ', this.toJS());

      var openTabItem = this.tabItems.find((t) => t.open);
      if (!openTabItem) {
        return '';
      }
      return openTabItem.title;
    }

    return activeTab.title;
  }

  get openTabCount() {
    return this.tabItems.count((ti) => ti.open);
  }

  /*
   * Returns [index,TabItem] pair if window contains chrome tab id or else undefined
   */
  findChromeTabId(tabId) {
    return this.tabItems.findEntry((ti) => ti.open && ti.openState.openTabId === tabId);
  }

  getActiveTabId() {
    const activeTab = this.tabItems.find((t) => t.open && t.openState.active);
    const tabId = activeTab ? activeTab.openState.openTabId : undefined;
    return tabId;
  }
}

/**
 * reset a window to its base saved state (after window is closed)
 */
export function removeOpenWindowState(tabWindow) {
  const savedItems = tabWindow.tabItems.filter((ti) => ti.saved);
  const resetSavedItems = savedItems.map(resetSavedItem);

  return tabWindow.remove('open').remove('openWindowId').remove('windowType').remove('width').remove('height').set('tabItems', resetSavedItems);
}

/*
 * remove any saved state, keeping only open tab and window state
 *
 * Used when unsave'ing a saved window
 */
export function removeSavedWindowState(tabWindow) {
  return tabWindow.remove('saved').remove('savedFolderId').remove('savedTitle');
}

/**
 * Initialize an unopened TabWindow from a bookmarks folder
 */
export function makeFolderTabWindow(bookmarkFolder) {
  const itemChildren = bookmarkFolder.children.filter((node) => 'url' in node);
  const tabItems = Immutable.Seq(itemChildren.map(makeBookmarkedTabItem));
  var fallbackTitle = '';
  if (bookmarkFolder.title === undefined) {
    console.error('makeFolderTabWindow: malformed bookmarkFolder -- missing title: ', bookmarkFolder);
    if (tabItems.count() > 0) {
      fallbackTitle = tabItems.get(0).title;
    }
  }

  const tabWindow = new TabWindow({
    saved: true,
    savedTitle: _.get(bookmarkFolder, 'title', fallbackTitle),
    savedFolderId: bookmarkFolder.id,
    tabItems,
  });

  return tabWindow;
}

/**
 * Initialize a TabWindow from an open Chrome window
 */
export function makeChromeTabWindow(chromeWindow) {
  const chromeTabs = chromeWindow.tabs ? chromeWindow.tabs : [];
  const tabItems = chromeTabs.map(makeOpenTabItem);
  const tabWindow = new TabWindow({
    open: true,
    openWindowId: chromeWindow.id,
    windowType: chromeWindow.type,
    width: chromeWindow.width,
    height: chromeWindow.height,
    tabItems: Immutable.Seq(tabItems),
  });

  return tabWindow;
}

/**
 * merge saved and currently open tab states into tab items by joining on URL
 * 
 * @param {Seq<TabItem>} savedItems 
 * @param {Seq<TabItem>} openItems 
 *
 * @return {Seq<TabItem>}
 */
function mergeSavedOpenTabs(savedItems,openItems) {
  // Maps both Seqs by url:
  const openUrlMap = Immutable.Map(openItems.groupBy((ti) => ti.url));
  // The entries in savedUrlMap *should* be singletons, but we'll use groupBy to
  // get a type-compatible Seq so that we can merge with openUrlMap using
  // mergeWith:
  const savedUrlMap = Immutable.Map(savedItems.groupBy(ti => ti.url));

  // console.log("getOpenTabInfo: savedUrlMap : " + savedUrlMap.toJS());
  function mergeTabItems(openItemsGroup, mergeSavedItemsGroup) {
    const savedItem = mergeSavedItemsGroup.get(0);
    return openItemsGroup.map(openItem => openItem.set('saved', true)
                                         .set('savedState', savedItem.savedState));
  }
  const mergedMap = openUrlMap.mergeWith(mergeTabItems, savedUrlMap);

  // console.log("mergedMap: ", mergedMap.toJS());

  // partition mergedMap into open and closed tabItems:
  const partitionedMap = mergedMap.toIndexedSeq().flatten(true).groupBy((ti) => ti.open);

  /* 
   * Could potentially improve on the presentation order (and there was an algorithm for this in
   * an older version of Tabli)
   * For now, let's just concat open and closed tabs, in their sorted order.
   */
  const openTabItems = partitionedMap.get(true, Immutable.Seq()).sortBy((ti) => ti.openState.openTabIndex);
  const closedTabItems = partitionedMap.get(false, Immutable.Seq()).sortBy((ti) => ti.savedState.bookmarkIndex);

  const mergedTabItems = openTabItems.concat(closedTabItems);

  return mergedTabItems;
}

/**
 * Merge currently open tabs from an open Chrome window with tabItem state of a saved
 * tabWindow
 *
 * @param {Seq<TabItem>} tabItems -- previous TabItem state
 * @param {[Tab]} openTabs -- currently open tabs from Chrome window
 *
 * @returns {Seq<TabItem>} TabItems reflecting current window state
 */
function mergeOpenTabs(tabItems, openTabs) {
  const baseSavedItems = tabItems.filter(ti => ti.saved).map(resetSavedItem);
  const chromeOpenTabItems = Immutable.Seq(openTabs.map(makeOpenTabItem));

  const mergedTabItems = mergeSavedOpenTabs(baseSavedItems,chromeOpenTabItems);

  return mergedTabItems;
}

/**
 * re-merge saved and open tab items for a window.
 *
 * Called both after a new tab has been added or URL has changed in an existing tab.
 *
 * @param {TabWindow} tabWindow - TabWindow to be updated
 * @param {Tab|Null} optChromeTab - optional newly created Chrome tab
 */
function mergeTabWindowTabItems(tabWindow, optChromeTab) {
  const tabItems = tabWindow.tabItems;

  const baseSavedItems = tabItems.filter(ti => ti.saved).map(resetSavedItem);
  const baseOpenItems = tabItems.filter(ti => ti.open).map(resetOpenItem);

  const updOpenItems = optChromeTab ? baseOpenItems.toList().push(makeOpenTabItem(optChromeTab)) : baseOpenItems;

  const mergedItems = mergeSavedOpenTabs(baseSavedItems,updOpenItems);
  const updWindow = tabWindow.set('tabItems',mergedItems);
  return updWindow;
}

/**
 * Update a TabWindow by adding a newly created tab
 *
 * @param {TabWindow} tabWindow - TabWindow to be updated
 * @param {Tab} tab - newly created Chrome tab  
 */
export function createTab(tabWindow, tab) {
  return mergeTabWindowTabItems(tabWindow, tab);
}

/**
 * update a TabWindow from a current snapshot of the Chrome Window
 *
 * @param {TabWindow} tabWindow - TabWindow to be updated
 * @param {ChromeWindow} chromeWindow - current snapshot of Chrome window state
 *
 * @return {TabWindow} Updated TabWindow
 */
export function updateWindow(tabWindow, chromeWindow) {
  // console.log("updateWindow: ", tabWindow.toJS(), chromeWindow);
  const mergedTabItems = mergeOpenTabs(tabWindow.tabItems, chromeWindow.tabs);
  const updWindow = tabWindow
                      .set('tabItems', mergedTabItems)
                      .set('windowType', chromeWindow.type)
                      .set('open', true)
                      .set('openWindowId', chromeWindow.id);
  return updWindow;
}

/**
 * handle a tab that's been closed
 *
 * @param {TabWindow} tabWindow - tab window with tab that's been closed
 * @param {Number} tabId -- Chrome id of closed tab
 *
 * @return {TabWindow} tabWindow with tabItems updated to reflect tab closure
 */
export function closeTab(tabWindow, tabId) {
  // console.log("closeTab: ", tabWindow, tabId);
  const entry = tabWindow.findChromeTabId(tabId);

  if (!entry) {
    console.warn("closeTab: could not find closed tab id ", tabId);
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

  return tabWindow.set('tabItems', updItems);
}

/**
 * Update a tab's saved state
 *
 * @param {TabWindow} tabWindow - tab window with tab that's been closed
 * @param {TabItem} tabItem -- open tab that has been saved
 * @param {BookmarkTreeNode} tabNode -- bookmark node for saved bookmark
 *
 * @return {TabWindow} tabWindow with tabItems updated to reflect saved state
 */
export function saveTab(tabWindow, tabItem, tabNode) {
  var [index] = tabWindow.findChromeTabId(tabItem.openState.openTabId);

  const savedState = new SavedTabState(tabNode);

  const updTabItem = tabItem.set('saved', true)
                      .set('savedState', savedState);

  const updItems = tabWindow.tabItems.splice(index, 1, updTabItem);

  return tabWindow.set('tabItems', updItems);
}

/**
 * Update a tab's saved state when tab has been 'unsaved' (i.e. bookmark removed)
 *
 * @param {TabWindow} tabWindow - tab window with tab that's been unsaved
 * @param {TabItem} tabItem -- open tab that has been saved
 *
 * @return {TabWindow} tabWindow with tabItems updated to reflect saved state
 */
export function unsaveTab(tabWindow, tabItem) {
  var [index] = tabWindow.tabItems.findEntry((ti) => ti.saved && ti.savedState.bookmarkId === tabItem.savedState.bookmarkId);
  const updTabItem = resetOpenItem(tabItem);

  var updItems;
  if (updTabItem.open) {
    updItems = tabWindow.tabItems.splice(index, 1, updTabItem);
  } else {
    // It's neither open nor saved, so just get rid of it...
    updItems = tabWindow.tabItems.splice(index, 1);
  }

  return tabWindow.set('tabItems', updItems);
}

/**
 * Set the active tab in a window to the tab with specified tabId
 *
 * @param {TabWindow} tabWindow -- tab window to be updated
 * @param {tabId} activeTabId - chrome tab id of active tab
 *
 * @return {TabWindow} tabWindow updated with specified tab as active tab.
 */ 
export function setActiveTab(tabWindow, tabId) {
  const tabPos = tabWindow.findChromeTabId(tabId);

  if (!tabPos) {
    console.log("setActiveTab -- tab id not found: ", tabId);
    return tabWindow;
  }

  const [index, tabItem] = tabPos;
  if (tabItem.active) {
    console.log("setActiveTab: tab was already active, igoring");
    return tabWindow;
  }

  // mark all other tabs as not active:
  const tabItemRemoveActive = (ti) => {
    return (ti.open ? ti.set('openState',ti.openState.remove('active')) : ti);
  }

  const nonActiveItems = tabWindow.tabItems.map(tabItemRemoveActive);

  const updOpenState = tabItem.openState.set('active',true);
  const updActiveTab = tabItem.set('openState',updOpenState);
  const updItems = nonActiveItems.splice(index, 1, updActiveTab);

  return tabWindow.set('tabItems',updItems);
}

/**
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
export function updateTabItem(tabWindow,tabId,changeInfo) {
  const tabPos = tabWindow.findChromeTabId(tabId);

  var updItems;
  if (!tabPos) {
    console.warn("updateTabItem: Got update for unknown tab id ", tabId);
    console.log("updateTabItem: changeInfo: ", changeInfo);
    return tabWindow;
  }
  const [index, prevTabItem] = tabPos;
  const prevOpenState = prevTabItem.openState;
  const updKeys = _.intersection(_.keys(prevOpenState.toJS()),_.keys(changeInfo));

  if (updKeys.length==0)
    return TabWindow;
  
  const updOpenState = _.reduce(updKeys,(acc,k) => acc.set(k,changeInfo[k]),prevOpenState);

  const updTabItem = (updKeys.length > 0) ? prevTabItem.set('openState',updOpenState) : prevTabItem;

  // console.log("updateTabItem: ", index, updTabItem.toJS());
  updItems = tabWindow.tabItems.splice(index,1,updTabItem);
  
  const updWindow = tabWindow.set('tabItems',updItems);  

  if (_.has(changeInfo,'url')) {
    // May have to split or the updated tabItems -- just re-merge all tabs:
    return mergeTabWindowTabItems(updWindow);
  }
  return updWindow;
}

