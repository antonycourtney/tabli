/**
 * Representation of tabbed windows using Immutable.js
 */

'use strict';

import * as _ from 'lodash';
import * as Immutable from 'immutable';

/**
 * An item in a tabbed window.
 *
 * May be associated with an open tab, a bookmark, or both
 */
export class TabItem extends Immutable.Record({
  url: '',

  /* Saved state fields
  /* NOTE!  Must be sure to keep these in sync with mergeTabItems() */
  // We should perhaps break these out into their own Record type 
  saved: false,
  savedBookmarkId: '',
  savedBookmarkIndex: 0,   // position in bookmark folder
  savedTitle: '',

  // Note: Must be kept in sync with resetSavedItem
  // Again: Suggests we should possibly break these out into their own record type
  open: false,    // Note: Saved tabs may be closed even when containing window is open
  openTabId: -1,
  active: false,
  openTabIndex: 0,  // index of open tab in its window
  favIconUrl: '',
  tabTitle: ''
}) {
  get title() {
    if (this.open)
      return this.tabTitle;

    return this.savedTitle;
  }
}

/**
 * Initialize a TabItem from a bookmark
 * 
 * Returned TabItem is closed (not associated with an open tab)
 */
function makeBookmarkedTabItem(bm) {
  const tabItem = new TabItem({
    url: bm.url,

    saved: true,
    savedTitle: bm.title,

    savedBookmarkId: bm.id,
    savedBookmarkIndex: bm.index
  });
  return tabItem;
}

/**
 * Initialize a TabItem from an open Chrome tab
 */
function makeOpenTabItem(tab) {
  const tabItem = new TabItem({
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    open: true,
    tabTitle: tab.title,
    openTabId: tab.id,
    active: tab.active,
    openTabIndex: tab.index
  });
  return tabItem;
}

/**
 * Returns the base saved state of a tab item (no open tab info)
 */
function resetSavedItem(ti) {
  return ti.remove('open').remove('tabTitle').remove('openTabId').remove('active').remove('openTabIndex').remove('favIconUrl');
}

/**
 * Return the base state of an open tab (no saved tab info)
 */
function resetOpenItem(ti) {
  return ti.remove('saved').remove('savedBookmarkId').remove('savedBookmarkIndex').remove('savedTitle');
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
  focused: false,

  tabItems: Immutable.Seq()   // <TabItem>
}) {

  get title() {
    if (this._title === undefined) {
      this._title = this.computeTitle()
    }
    return this._title;
  }

  computeTitle() {
    if (this.saved)
      return this.savedTitle;

    const activeTab = this.tabItems.find((t) => t.active);

    if (!activeTab) {
      // shouldn't happen!
      console.warn("TabWindow.get title(): No active tab found: ", this.toJS());

      var openTabItem = this.tabItems.find((t) => t.open);
      if (!openTabItem)
        return '';
      return openTabItem.title;
    }
    return activeTab.title;    
  }

  get openTabCount() {
    return this.tabItems.count((ti) => ti.open);
  }
}

/**
 * reset a window to its base saved state (after window is closed) 
 */
export function removeOpenWindowState(tabWindow) {
  const savedItems = tabWindow.tabItems.filter((ti) => ti.saved);
  const resetSavedItems = savedItems.map(resetSavedItem);

  return tabWindow.remove('open').remove('openWindowId').remove('focused').set('tabItems',resetSavedItems);
} 

/*
 * remove any saved state, keeping only open tab and window state
 *
 * Used when unsave'ing a saved window
 */
export function removeSavedWindowState(tabWindow) {
  const openItems = tabWindow.tabItems.filter((ti) => ti.open);
  const resetOpenItems = openItems.map(resetOpenItem);

  return tabWindow.remove('saved').remove('savedFolderId').remove('savedTitle');
}

/**
 * Initialize an unopened TabWindow from a bookmarks folder
 */
export function makeFolderTabWindow( bookmarkFolder ) {
  const tabItems = bookmarkFolder.children.map(makeBookmarkedTabItem);
  const tabWindow = new TabWindow({ 
    saved: true,
    savedTitle: bookmarkFolder.title,
    savedFolderId: bookmarkFolder.id,
    tabItems: Immutable.Seq(tabItems)
  });

  return tabWindow;
}

/**
 * Initialize a TabWindow from an open Chrome window
 */
export function makeChromeTabWindow(chromeWindow) {
  const tabItems = chromeWindow.tabs.map(makeOpenTabItem);
  const tabWindow = new TabWindow({
    open: true,
    openWindowId: chromeWindow.id,
    focused: chromeWindow.focused,
    tabItems: Immutable.Seq(tabItems)
  });

  return tabWindow;
}


/**
 * Gather open tab items and a set of non-open saved tabItems from the given
 * open tabs and tab items based on URL matching, without regard to 
 * tab ordering.  Auxiliary helper function for mergeOpenTabs.
 */
function getOpenTabInfo(tabItems,openTabs) {
  const chromeOpenTabItems = openTabs.map(makeOpenTabItem);
  // console.log("getOpenTabInfo: openTabs: ", openTabs);
  // console.log("getOpenTabInfo: chromeOpenTabItems: " + JSON.stringify(chromeOpenTabItems,null,4));
  const openUrlMap = Immutable.Map(chromeOpenTabItems.map((ti) => [ti.url,ti]));

  // console.log("getOpenTabInfo: openUrlMap :" + JSON.stringify(openUrlMap,null,4));

  // Now we need to do two things:
  // 1. augment chromeOpenTabItems with bookmark Ids / saved state (if it exists)
  // 2. figure out which savedTabItems are not in openTabs
  const savedItems = tabItems.filter((ti) => ti.saved);
  // Restore the saved items to their base state (no open tab info), since we
  // only want to pick up open tab info from what was passed in in openTabs
  const baseSavedItems = savedItems.map(resetSavedItem);

  const savedUrlMap = Immutable.Map(baseSavedItems.map((ti) => [ti.url,ti]));
  // console.log("getOpenTabInfo: savedUrlMap :" + JSON.stringify(savedUrlMap,null,4));

  function mergeTabItems(openItem,savedItem) {
    return openItem.set('saved',true)
      .set('savedBookmarkId',savedItem.savedBookmarkId)
      .set('savedBookmarkIndex',savedItem.savedBookmarkIndex)
      .set('savedTitle',savedItem.savedTitle);
  } 
  const mergedMap = openUrlMap.mergeWith(mergeTabItems,savedUrlMap);

  // console.log("getOpenTabInfo: mergedMap :" + JSON.stringify(mergedMap,null,4));

  // partition mergedMap into open and closed tabItems:
  const partitionedMap = mergedMap.toIndexedSeq().groupBy((ti) => ti.open);

  return partitionedMap;
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
function mergeOpenTabs(tabItems,openTabs) {
  const tabInfo = getOpenTabInfo(tabItems,openTabs);

  /* TODO: Use algorithm from OLDtabWindow.js to determine tab order.
   * For now, let's just concat open and closed tabs, in their sorted order.
   */
  const openTabItems = tabInfo.get(true,Immutable.Seq()).sortBy((ti) => ti.openTabIndex);
  const closedTabItems = tabInfo.get(false,Immutable.Seq()).sortBy((ti) => ti.savedBookmarkIndex);

  const mergedTabItems = openTabItems.concat(closedTabItems);

  return mergedTabItems;
}

/**
 * update a TabWindow from a current snapshot of the Chrome Window
 *
 * @param {TabWindow} tabWindow - TabWindow to be updated
 * @param {ChromeWindow} chromeWindow - current snapshot of Chrome window state
 *
 * @return {TabWindow} Updated TabWindow
 */
export function updateWindow(tabWindow,chromeWindow) {
  // console.log("updateWindow: ", tabWindow.toJS(), chromeWindow);
  const mergedTabItems = mergeOpenTabs(tabWindow.tabItems,chromeWindow.tabs);
  const updWindow = tabWindow
                      .set('tabItems',mergedTabItems)
                      .set('focused',chromeWindow.focused)
                      .set('open',true)
                      .set('openWindowId',chromeWindow.id);
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
export function closeTab(tabWindow,tabId) {
  // console.log("closeTab: ", tabWindow, tabId);
  var [index,tabItem] = tabWindow.tabItems.findEntry((ti) => ti.open && ti.openTabId === tabId);

  var updItems;

  if (tabItem.saved) {
    var updTabItem = resetSavedItem(tabItem);
    updItems = tabWindow.tabItems.splice(index,1,updTabItem);
  } else {
    updItems = tabWindow.tabItems.splice(index,1);
  }

  return tabWindow.set('tabItems',updItems);
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
export function saveTab(tabWindow,tabItem,tabNode) {
  var [index] = tabWindow.tabItems.findEntry((ti) => ti.open && ti.openTabId === tabItem.openTabId);      

  const updTabItem=tabItem.set('saved',true)
                      .set('savedTitle',tabNode.title)
                      .set('savedBookmarkId',tabNode.id)
                      .set('savedBookmarkIndex',tabNode.index);

  const updItems = tabWindow.tabItems.splice(index,1,updTabItem);

  return tabWindow.set('tabItems',updItems);
}

/**
 * Update a tab's saved state when tab has been 'unsaved' (i.e. bookmark removed)
 *
 * @param {TabWindow} tabWindow - tab window with tab that's been unsaved
 * @param {TabItem} tabItem -- open tab that has been saved
 *
 * @return {TabWindow} tabWindow with tabItems updated to reflect saved state
 */
export function unsaveTab(tabWindow,tabItem) {
  var [index] = tabWindow.tabItems.findEntry((ti) => ti.saved && ti.savedBookmarkId === tabItem.savedBookmarkId);      

  const updTabItem = resetOpenItem(tabItem);

  var updItems;
  if (updTabItem.open) {
    updItems = tabWindow.tabItems.splice(index,1,updTabItem);
  } else {
    // It's neither open nor saved, so just get rid of it...
    updItems = tabWindow.tabItems.splice(index,1);
  }
  return tabWindow.set('tabItems',updItems);
}