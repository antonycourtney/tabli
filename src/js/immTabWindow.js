/**
 * Representation of tabbed windows using Immutable.js
 */

'use strict';

import * as _ from 'underscore';
import * as Immutable from 'immutable';

/**
 * An item in a tabbed window
 *
 * A tab item may be associated with an open tab, a bookmark, or both
 */
var TabItem = Immutable.Record({
  title: '',
  url: '',
  favIconUrl: '',

  saved: false,
  savedBookmarkId: '',

  open: false,    // Note: This may differ from open state of containing window!
  openTabId: -1,
  active: false  
});

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
class TabWindow extends Immutable.Record({
  saved: false,
  savedTitle: '',
  savedFolderId: -1,

  open: false,
  openWindowId: -1,

  tabItems: Immutable.Seq()   // <TabItem>
}) {

  get title() {
    if (this.saved)
      return this.savedTitle;

    const activeTab = this.tabItems.find((t) => t.active);

    if (!activeTab) {
      // shouldn't happen!
      console.warn("TabWindow.getTitle(): No active tab found: ", this);
      return '';
    }

    return activeTab.title;    
  }
}

/**
 * Initialize a TabItem from a bookmark
 * 
 * Returned TabItem is closed (not associated with an open tab)
 */
function makeBookmarkedTabItem(bm) {
  const tabItem = new TabItem({
    title: bm.title,
    url: bm.url,
    favIconUrl: bm.favIconUrl,

    saved: true,
    savedBookmarkId: bm.id
  });
  return tabItem;
}

/**
 * Initialize a TabItem from an open Chrome tab
 */
function makeOpenTabItem(tab) {
  const tabItem = new TabItem({
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    open: true,
    openTabId: tab.id,
    active: tab.active
  });
  return tabItem;
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
    tabItems: Immutable.Seq(tabItems)
  });

  const tabsArr = tabWindow.tabItems.toArray();
  return tabWindow;
}
