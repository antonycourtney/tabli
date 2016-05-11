/**
 * application state for tab manager
 *
 * We'll instantiate and initialize this in the bgHelper and attach it to the background window,
 * and then retrieve the instance from the background window in the popup
 */
import * as _ from 'lodash';
import * as Immutable from 'immutable';
import * as TabWindow from './tabWindow';

function validChromeWindow(cw,normalOnly) {
  if (!cw)
    return false;
  const cwTabs = _.get(cw,'tabs',[]);
  const isNormal = cw.type==='normal' && (cwTabs.length > 0);
  const isPopout = cw.type==='popup' && cwTabs.length > 0 && cwTabs[0].title==="Tabli";
  return isNormal || (!normalOnly && isPopout);
}

export default class TabManagerState extends Immutable.Record({
  windowIdMap: Immutable.Map(),     // maps from chrome window id for open windows
  bookmarkIdMap: Immutable.Map(),   // maps from bookmark id for saved windows
  folderId: -1,
  archiveFolderId: -1,
  currentWindowId: -1,               // chrome window id of window with focus
  initializing: true,                // true until bgHelper initialization completes.
}) {
  /**
   * Update store to include the specified window, indexed by
   * open window id or bookmark id
   *
   * Note that if an earlier snapshot of tabWindow is in the store, it will be
   * replaced
   */
  registerTabWindow(tabWindow) {
    const nextWindowIdMap =
      (tabWindow.open) ? this.windowIdMap.set(tabWindow.openWindowId, tabWindow) : this.windowIdMap;
    const nextBookmarkIdMap =
      (tabWindow.saved) ? this.bookmarkIdMap.set(tabWindow.savedFolderId, tabWindow) : this.bookmarkIdMap;

    return this.set('windowIdMap', nextWindowIdMap).set('bookmarkIdMap', nextBookmarkIdMap);
  }

  registerTabWindows(tabWindows) {
    return _.reduce(tabWindows, (acc, w) => acc.registerTabWindow(w), this);
  }

  handleTabWindowClosed(tabWindow) {
    // console.log("handleTabWindowClosed: ", tabWindow.toJS());
    /*
     * We only remove window from map of open windows (windowIdMap) but then we re-register
     * reverted window to ensure that a reverted version of saved window stays in
     * bookmarkIdMap.
     */
    const closedWindowIdMap = this.windowIdMap.delete(tabWindow.openWindowId);

    const revertedWindow = TabWindow.removeOpenWindowState(tabWindow);

    return this.set('windowIdMap', closedWindowIdMap).registerTabWindow(revertedWindow);
  }

  handleTabClosed(tabWindow, tabId) {
    var updWindow = TabWindow.closeTab(tabWindow, tabId);
    return this.registerTabWindow(updWindow);
  }

  handleTabSaved(tabWindow, tabItem, tabNode) {
    var updWindow = TabWindow.saveTab(tabWindow, tabItem, tabNode);
    return this.registerTabWindow(updWindow);
  }

  handleTabUnsaved(tabWindow, tabItem) {
    var updWindow = TabWindow.unsaveTab(tabWindow, tabItem);
    return this.registerTabWindow(updWindow);
  }

  handleTabActivated(tabWindow, tabId) {
    const updWindow = TabWindow.setActiveTab(tabWindow,tabId);
    return this.registerTabWindow(updWindow);
  }

  handleTabCreated(tabWindow, tab) {
    const updWindow = TabWindow.createTab(tabWindow, tab);
    return this.registerTabWindow(updWindow);    
  }

  handleTabUpdated(tabWindow, tabId, changeInfo) {
    const updWindow = TabWindow.updateTabItem(tabWindow, tabId, changeInfo);
    return this.registerTabWindow(updWindow);    
  }

  /**
   * attach a Chrome window to a specific tab window (after opening a saved window)
   */
  attachChromeWindow(tabWindow, chromeWindow) {
    // console.log("attachChromeWindow: ", tabWindow.toJS(), chromeWindow);

    // Was this Chrome window id previously associated with some other tab window?
    const oldTabWindow = this.windowIdMap.get(chromeWindow.id);

    // A store without oldTabWindow
    const rmStore = oldTabWindow ? this.handleTabWindowClosed(oldTabWindow) : this;

    const attachedTabWindow = TabWindow.updateWindow(tabWindow, chromeWindow);

    // console.log('attachChromeWindow: attachedTabWindow: ', attachedTabWindow.toJS());

    return rmStore.registerTabWindow(attachedTabWindow);
  }

  /**
   * Synchronize internal state of our store with snapshot
   * of current Chrome window state
   *
   * @param chromeWindow window to synchronize
   */
  syncChromeWindow(chromeWindow) {
    const prevTabWindow = this.windowIdMap.get(chromeWindow.id);
    /*
    if (!prevTabWindow) {
      console.log("syncChromeWindow: detected new chromeWindow: ", chromeWindow);
    }
    */
    const tabWindow = prevTabWindow ? TabWindow.updateWindow(prevTabWindow, chromeWindow) : TabWindow.makeChromeTabWindow(chromeWindow);
    const stReg = this.registerTabWindow(tabWindow);

    // if window has focus and is a 'normal' window, update current window id:
    const updCurrent = chromeWindow.focused && validChromeWindow(chromeWindow,true);
    const st = updCurrent ? stReg.set('currentWindowId',chromeWindow.id) : stReg;

    if (updCurrent) {
      console.log("syncChromeWindow: updated current window to: ", chromeWindow.id);
    }

    return st;
  }

  /**
   * synchronize the currently open windows from chrome.windows.getAll with
   * internal map of open windows
   */
  syncWindowList(rawChromeWindowList) {
   
    // restrict our management to normal chrome windows that have at least 1 tab: 
    const chromeWindowList = _.filter(rawChromeWindowList,cw => validChromeWindow(cw,false));

    var tabWindows = this.getOpen();

    // Iterate through tab windows (our current list of open windows)
    // closing any not in chromeWindowList:
    var chromeIds = _.map(chromeWindowList, 'id');
    var chromeIdSet = new Set(chromeIds);

    var closedWindows = _.filter(tabWindows, (tw) => !chromeIdSet.has(tw.openWindowId));
    var closedWinStore = _.reduce(closedWindows, (acc, tw) => acc.handleTabWindowClosed(tw), this);

    // Now update all open windows:
    const nextSt = _.reduce(chromeWindowList, (acc, cw) => acc.syncChromeWindow(cw), closedWinStore);
    return nextSt;
  }

  setCurrentWindowId(windowId) {
    const nextSt = this.windowIdMap.has(windowId) ? this.set('currentWindowId',windowId) : this;
    return nextSt;
  }

  setCurrentWindow(chromeWindow) {
    const nextSt = validChromeWindow(chromeWindow,true) ? this.setCurrentWindowId(chromeWindow.id) : this;
    return nextSt;
  }

  getCurrentWindow() {
    return this.getTabWindowByChromeId(this.currentWindowId);
  }

  getActiveTabId() {
    const cw = this.getCurrentWindow();
    const tabId = cw ? cw.getActiveTabId() : undefined;
    return tabId;
  }

  removeBookmarkIdMapEntry(tabWindow) {
    return this.set('bookmarkIdMap', this.bookmarkIdMap.delete(tabWindow.savedFolderId));
  }

  unmanageWindow(tabWindow) {
    // Get a view of this store with tabWindow removed from bookmarkIdMap:
    const rmStore = this.removeBookmarkIdMapEntry(tabWindow);

    // disconnect from the previously associated bookmark folder and re-register
    const umWindow = TabWindow.removeSavedWindowState(tabWindow);
    return rmStore.registerTabWindow(umWindow);
  }

  /**
   * attach a bookmark folder to a specific chrome window
   */
  attachBookmarkFolder(bookmarkFolder, chromeWindow) {
    const folderTabWindow = TabWindow.makeFolderTabWindow(bookmarkFolder);

    const mergedTabWindow = TabWindow.updateWindow(folderTabWindow, chromeWindow);

    // And re-register in store maps:
    return this.registerTabWindow(mergedTabWindow);
  }

  /**
   * get the currently open tab windows
   */
  getOpen() {
    const openWindows = this.windowIdMap.toIndexedSeq().toArray();
    return openWindows;
  }

  getAll() {
    const openWindows = this.getOpen();
    const closedSavedWindows = this.bookmarkIdMap.toIndexedSeq().filter((w) => !(w.open)).toArray();
    return openWindows.concat(closedSavedWindows);
  }

  getTabWindowsByType(windowType) {
    const openWindows = this.getOpen();
    return _.filter(openWindows, w => w.windowType === windowType);
  }

  // returns a tabWindow or undefined
  getTabWindowByChromeId(windowId) {
    return this.windowIdMap.get(windowId);
  }

  // Find a tabWindow containing the given tab id (or undefined)
  // Not terribly efficient!
  getTabWindowByChromeTabId(tabId) {
    const tw = this.windowIdMap.find(w => w.findChromeTabId(tabId));
    return tw;
  }


  countOpenWindows() {
    return this.windowIdMap.count();
  }

  countSavedWindows() {
    return this.bookmarkIdMap.count();
  }

  countOpenTabs() {
    return this.windowIdMap.reduce((count, w) => count + w.openTabCount, 0);
  }

  /*
   * obtain a map from URL to Set<bookmark id> of saved windows, for use on initial
   * attach.
   *
   * returns: Map<URL,Set<BookmarkId>>
   */
  getUrlBookmarkIdMap() {
    const bmEnts = this.bookmarkIdMap.entrySeq();

    // bmEnts ::  Iterator<[BookmarkId,TabWindow]>
    const getSavedUrls = (tw) => tw.tabItems.map((ti) => ti.url)


    const bmUrls = bmEnts.map(([bmid,tw]) => getSavedUrls(tw).map(url => [url,bmid])).flatten(true);

    const groupedIds = bmUrls.groupBy(([url,bmid]) => url).map(vs => Immutable.Set(vs.map(([url,bmid]) => bmid)));
    // groupedIds :: Seq.Keyed<URL,Set<BookmarkId>>

    return Immutable.Map(groupedIds);
  }

  getPopoutTabWindow() {
    const popupTabWindows = this.getTabWindowsByType("popup");
    if (popupTabWindows.length > 0) {
      return popupTabWindows[0];
    }
    return null;
  }

  markInitialized() {
    return this.set('initializing', false);
  }   
}
