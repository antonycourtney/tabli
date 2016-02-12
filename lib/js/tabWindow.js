'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TabWindow = exports.TabItem = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.removeOpenWindowState = removeOpenWindowState;
exports.removeSavedWindowState = removeSavedWindowState;
exports.makeFolderTabWindow = makeFolderTabWindow;
exports.makeChromeTabWindow = makeChromeTabWindow;
exports.updateWindow = updateWindow;
exports.closeTab = closeTab;
exports.saveTab = saveTab;
exports.unsaveTab = unsaveTab;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _immutable = require('immutable');

var Immutable = _interopRequireWildcard(_immutable);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Representation of tabbed windows using Immutable.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * An item in a tabbed window.
 *
 * May be associated with an open tab, a bookmark, or both
 */

var TabItem = exports.TabItem = function (_Immutable$Record) {
  _inherits(TabItem, _Immutable$Record);

  function TabItem() {
    _classCallCheck(this, TabItem);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TabItem).apply(this, arguments));
  }

  _createClass(TabItem, [{
    key: 'title',
    get: function get() {
      if (this.open) {
        return this.tabTitle;
      }

      return this.savedTitle;
    }
  }]);

  return TabItem;
}(Immutable.Record({
  url: '',
  audible: false,

  /* Saved state fields
  /* NOTE!  Must be sure to keep these in sync with mergeTabItems() */

  // We should perhaps break these out into their own Record type
  saved: false,
  savedBookmarkId: '',
  savedBookmarkIndex: 0, // position in bookmark folder
  savedTitle: '',

  // Note: Must be kept in sync with resetSavedItem
  // Again: Suggests we should possibly break these out into their own record type
  open: false, // Note: Saved tabs may be closed even when containing window is open
  openTabId: -1,
  active: false,
  openTabIndex: 0, // index of open tab in its window
  favIconUrl: '',
  tabTitle: ''
}));

/**
 * Initialize a TabItem from a bookmark
 *
 * Returned TabItem is closed (not associated with an open tab)
 */


function makeBookmarkedTabItem(bm) {
  var urlStr = bm.url;
  if (!urlStr) {
    console.error('makeBookmarkedTabItem: Malformed bookmark: missing URL!: ', bm);
    urlStr = ''; // better than null or undefined!
  }

  if (bm.title === undefined) {
    console.warn('makeBookmarkedTabItem: Bookmark title undefined (ignoring...): ', bm);
  }

  var tabItem = new TabItem({
    url: urlStr,

    saved: true,
    savedTitle: _.get(bm, 'title', urlStr),

    savedBookmarkId: bm.id,
    savedBookmarkIndex: bm.index
  });

  return tabItem;
}

/**
 * Initialize a TabItem from an open Chrome tab
 */
function makeOpenTabItem(tab) {
  var urlStr = tab.url;
  if (!urlStr) {
    console.error('malformed tab -- no URL: ', tab);
    urlStr = '';
  }
  /*
    if (!tab.title) {
      console.warn("tab missing title (ignoring...): ", tab);
    }
  */
  var tabItem = new TabItem({
    url: urlStr,
    audible: tab.audible,
    favIconUrl: tab.favIconUrl,
    open: true,
    tabTitle: _.get(tab, 'title', urlStr),
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

var TabWindow = exports.TabWindow = function (_Immutable$Record2) {
  _inherits(TabWindow, _Immutable$Record2);

  function TabWindow() {
    _classCallCheck(this, TabWindow);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TabWindow).apply(this, arguments));
  }

  _createClass(TabWindow, [{
    key: 'computeTitle',
    value: function computeTitle() {
      if (this.saved) {
        return this.savedTitle;
      }

      var activeTab = this.tabItems.find(function (t) {
        return t.active;
      });

      if (!activeTab) {
        // shouldn't happen!
        console.warn('TabWindow.get title(): No active tab found: ', this.toJS());

        var openTabItem = this.tabItems.find(function (t) {
          return t.open;
        });
        if (!openTabItem) {
          return '';
        }
        return openTabItem.title;
      }

      return activeTab.title;
    }
  }, {
    key: 'title',
    get: function get() {
      if (this._title === undefined) {
        this._title = this.computeTitle();
      }

      return this._title;
    }
  }, {
    key: 'openTabCount',
    get: function get() {
      return this.tabItems.count(function (ti) {
        return ti.open;
      });
    }
  }]);

  return TabWindow;
}(Immutable.Record({
  saved: false,
  savedTitle: '',
  savedFolderId: -1,

  open: false,
  openWindowId: -1,
  focused: false,

  tabItems: Immutable.Seq() }));

/**
 * reset a window to its base saved state (after window is closed)
 */


function removeOpenWindowState(tabWindow) {
  var savedItems = tabWindow.tabItems.filter(function (ti) {
    return ti.saved;
  });
  var resetSavedItems = savedItems.map(resetSavedItem);

  return tabWindow.remove('open').remove('openWindowId').remove('focused').set('tabItems', resetSavedItems);
}

/*
 * remove any saved state, keeping only open tab and window state
 *
 * Used when unsave'ing a saved window
 */
function removeSavedWindowState(tabWindow) {
  return tabWindow.remove('saved').remove('savedFolderId').remove('savedTitle');
}

/**
 * Initialize an unopened TabWindow from a bookmarks folder
 */
function makeFolderTabWindow(bookmarkFolder) {
  var itemChildren = bookmarkFolder.children.filter(function (node) {
    return 'url' in node;
  });
  var tabItems = Immutable.Seq(itemChildren.map(makeBookmarkedTabItem));
  var fallbackTitle = '';
  if (bookmarkFolder.title === undefined) {
    console.error('makeFolderTabWindow: malformed bookmarkFolder -- missing title: ', bookmarkFolder);
    if (tabItems.count() > 0) {
      fallbackTitle = tabItems.get(0).title;
    }
  }

  var tabWindow = new TabWindow({
    saved: true,
    savedTitle: _.get(bookmarkFolder, 'title', fallbackTitle),
    savedFolderId: bookmarkFolder.id,
    tabItems: tabItems
  });

  return tabWindow;
}

/**
 * Initialize a TabWindow from an open Chrome window
 */
function makeChromeTabWindow(chromeWindow) {
  var tabItems = chromeWindow.tabs.map(makeOpenTabItem);
  var tabWindow = new TabWindow({
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
function getOpenTabInfo(tabItems, openTabs) {
  var chromeOpenTabItems = Immutable.Seq(openTabs.map(makeOpenTabItem));

  // console.log("getOpenTabInfo: openTabs: ", openTabs);
  // console.log("getOpenTabInfo: chromeOpenTabItems: " + JSON.stringify(chromeOpenTabItems,null,4));
  var openUrlMap = Immutable.Map(chromeOpenTabItems.groupBy(function (ti) {
    return ti.url;
  }));

  // console.log("getOpenTabInfo: openUrlMap: ", openUrlMap.toJS());

  // Now we need to do two things:
  // 1. augment chromeOpenTabItems with bookmark Ids / saved state (if it exists)
  // 2. figure out which savedTabItems are not in openTabs
  var savedItems = tabItems.filter(function (ti) {
    return ti.saved;
  });

  // Restore the saved items to their base state (no open tab info), since we
  // only want to pick up open tab info from what was passed in in openTabs
  var baseSavedItems = savedItems.map(resetSavedItem);

  // The entries in savedUrlMap *should* be singletons, but we'll use groupBy to
  // get a type-compatible Seq so that we can merge with openUrlMap using
  // mergeWith:
  var savedUrlMap = Immutable.Map(baseSavedItems.groupBy(function (ti) {
    return ti.url;
  }));

  // console.log("getOpenTabInfo: savedUrlMap : " + savedUrlMap.toJS());

  function mergeTabItems(openItems, mergeSavedItems) {
    var savedItem = mergeSavedItems.get(0);
    return openItems.map(function (openItem) {
      return openItem.set('saved', true).set('savedBookmarkId', savedItem.savedBookmarkId).set('savedBookmarkIndex', savedItem.savedBookmarkIndex).set('savedTitle', savedItem.savedTitle);
    });
  }

  var mergedMap = openUrlMap.mergeWith(mergeTabItems, savedUrlMap);

  // console.log("mergedMap: ", mergedMap.toJS());

  // console.log("getOpenTabInfo: mergedMap :" + JSON.stringify(mergedMap,null,4));

  // partition mergedMap into open and closed tabItems:
  var partitionedMap = mergedMap.toIndexedSeq().flatten(true).groupBy(function (ti) {
    return ti.open;
  });

  // console.log("partitionedMap: ", partitionedMap.toJS());

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
function mergeOpenTabs(tabItems, openTabs) {
  var tabInfo = getOpenTabInfo(tabItems, openTabs);

  /* TODO: Use algorithm from OLDtabWindow.js to determine tab order.
   * For now, let's just concat open and closed tabs, in their sorted order.
   */
  var openTabItems = tabInfo.get(true, Immutable.Seq()).sortBy(function (ti) {
    return ti.openTabIndex;
  });
  var closedTabItems = tabInfo.get(false, Immutable.Seq()).sortBy(function (ti) {
    return ti.savedBookmarkIndex;
  });

  var mergedTabItems = openTabItems.concat(closedTabItems);

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
function updateWindow(tabWindow, chromeWindow) {
  // console.log("updateWindow: ", tabWindow.toJS(), chromeWindow);
  var mergedTabItems = mergeOpenTabs(tabWindow.tabItems, chromeWindow.tabs);
  var updWindow = tabWindow.set('tabItems', mergedTabItems).set('focused', chromeWindow.focused).set('open', true).set('openWindowId', chromeWindow.id);
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
function closeTab(tabWindow, tabId) {
  // console.log("closeTab: ", tabWindow, tabId);

  var _tabWindow$tabItems$f = tabWindow.tabItems.findEntry(function (ti) {
    return ti.open && ti.openTabId === tabId;
  });

  var _tabWindow$tabItems$f2 = _slicedToArray(_tabWindow$tabItems$f, 2);

  var index = _tabWindow$tabItems$f2[0];
  var tabItem = _tabWindow$tabItems$f2[1];


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
function saveTab(tabWindow, tabItem, tabNode) {
  var _tabWindow$tabItems$f3 = tabWindow.tabItems.findEntry(function (ti) {
    return ti.open && ti.openTabId === tabItem.openTabId;
  });

  var _tabWindow$tabItems$f4 = _slicedToArray(_tabWindow$tabItems$f3, 1);

  var index = _tabWindow$tabItems$f4[0];


  var updTabItem = tabItem.set('saved', true).set('savedTitle', tabNode.title).set('savedBookmarkId', tabNode.id).set('savedBookmarkIndex', tabNode.index);

  var updItems = tabWindow.tabItems.splice(index, 1, updTabItem);

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
function unsaveTab(tabWindow, tabItem) {
  var _tabWindow$tabItems$f5 = tabWindow.tabItems.findEntry(function (ti) {
    return ti.saved && ti.savedBookmarkId === tabItem.savedBookmarkId;
  });

  var _tabWindow$tabItems$f6 = _slicedToArray(_tabWindow$tabItems$f5, 1);

  var index = _tabWindow$tabItems$f6[0];


  var updTabItem = resetOpenItem(tabItem);

  var updItems;
  if (updTabItem.open) {
    updItems = tabWindow.tabItems.splice(index, 1, updTabItem);
  } else {
    // It's neither open nor saved, so just get rid of it...
    updItems = tabWindow.tabItems.splice(index, 1);
  }

  return tabWindow.set('tabItems', updItems);
}