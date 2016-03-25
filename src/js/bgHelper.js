/**
 * Background helper page.
 * Gathering bookmark and window state and places in local storage so that
 * popup rendering will be as fast as possible
 */
import chromeBrowser from './chromeBrowser';
import * as Tabli from '../tabli-core/src/js/index';
import * as _ from 'lodash';

const TabManagerState = Tabli.TabManagerState;
const TabWindow = Tabli.TabWindow;
const Popup = Tabli.components.Popup;
const actions = Tabli.actions;
const ViewRef = Tabli.ViewRef;

import * as React from 'react';

import * as ReactDOMServer from 'react-dom/server';
import { refUpdater } from 'oneref';

const tabmanFolderTitle = 'Tabli Saved Windows';
const archiveFolderTitle = '_Archive';

/* On startup load managed windows from bookmarks folder */
function loadManagedWindows(winStore, tabManFolder) {
  var folderTabWindows = [];
  for (var i = 0; i < tabManFolder.children.length; i++) {
    var windowFolder = tabManFolder.children[i];
    if (windowFolder.title[0] === '_') {
      continue;
    }

    var fc = windowFolder.children;
    if (!fc) {
      console.log('Found bookmarks folder with no children, skipping: ', fc);
      continue;
    }

    folderTabWindows.push(TabWindow.makeFolderTabWindow(windowFolder));
  }

  return winStore.registerTabWindows(folderTabWindows);
}

/*
 * given a specific parent Folder node, ensure a particular child exists.
 * Will invoke callback either synchronously or asynchronously passing the node
 * for the named child
 */
function ensureChildFolder(parentNode, childFolderName, callback) {
  if (parentNode.children) {
    for (var i = 0; i < parentNode.children.length; i++) {
      var childFolder = parentNode.children[i];
      if (childFolder.title.toLowerCase() === childFolderName.toLowerCase()) {
        // exists
        // console.log( "found target child folder: ", childFolderName );
        callback(childFolder);
        return true;
      }
    }
  }

  console.log('Child folder ', childFolderName, ' Not found, creating...');

  // If we got here, child Folder doesn't exist
  var folderObj = { parentId: parentNode.id, title: childFolderName };
  chrome.bookmarks.create(folderObj, callback);
}

/**
 * acquire main folder and archive folder and initialize
 * window store
 */
function initWinStore(cb) {
  var tabmanFolderId = null;
  var archiveFolderId = null;

  chrome.bookmarks.getTree((tree) => {
    var otherBookmarksNode = tree[0].children[1];

    // console.log( "otherBookmarksNode: ", otherBookmarksNode );
    ensureChildFolder(otherBookmarksNode, tabmanFolderTitle, (tabManFolder) => {
      console.log('tab manager folder acquired.');
      tabmanFolderId = tabManFolder.id;
      ensureChildFolder(tabManFolder, archiveFolderTitle, (archiveFolder) => {
        console.log('archive folder acquired.');
        archiveFolderId = archiveFolder.id;
        chrome.bookmarks.getSubTree(tabManFolder.id, (subTreeNodes) => {
          // console.log("bookmarks.getSubTree for TabManFolder: ", subTreeNodes);
          const baseWinStore = new TabManagerState({ folderId: tabmanFolderId, archiveFolderId });
          const loadedWinStore = loadManagedWindows(baseWinStore, subTreeNodes[0]);
          cb(loadedWinStore);
        });
      });
    });
  });
}

function setupConnectionListener(storeRef) {
  chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((msg) => {
      var listenerId = msg.listenerId;
      port.onDisconnect.addListener(() => {
        storeRef.removeViewListener(listenerId);
        console.log("Removed view listener ", listenerId);
      });
    });
  });
}

/**
 * Download the specified object as JSON (for testing)
 */
function downloadJSON(dumpObj, filename) {
  const dumpStr = JSON.stringify(dumpObj, null, 2);
  const winBlob = new Blob([dumpStr], { type: 'application/json' });
  const url = URL.createObjectURL(winBlob);
  chrome.downloads.download({ url, filename });
}

/**
 * dump all windows -- useful for creating performance tests
 *
 * NOTE:  Requires the "downloads" permission in the manifest!
 */
function dumpAll(winStore) {  // eslint-disable-line no-unused-vars
  const allWindows = winStore.getAll();

  const jsWindows = allWindows.map((tw) => tw.toJS());

  const dumpObj = { allWindows: jsWindows };

  downloadJSON(dumpObj, 'winStoreSnap.json');
}

function dumpChromeWindows() { // eslint-disable-line no-unused-vars
  chrome.windows.getAll({ populate: true }, (chromeWindows) => {
    downloadJSON({ chromeWindows }, 'chromeWindowSnap.json');
  });
}

/**
 * create a TabMan element, render it to HTML and save it for fast loading when
 * opening the popup
 */
function makeRenderListener(storeRef) {
  function renderAndSave() {
    const winStore = storeRef.getValue();
    // console.log("renderAndSave");
    if (winStore.equals(window.savedStore)) {
      // console.log("renderAndSave: current and save store match, skipping render...");
      return;
    }
    /* Let's create a dummy app element to render our current store
     * React.renderToString() will remount the component, so really want a fresh element here with exactly
     * the store state we wish to render and save.
     */
    const renderAppElement = <Popup storeRef={null} initialWinStore={winStore} noListener />;
    const renderedString = ReactDOMServer.renderToString(renderAppElement);

    // console.log("renderAndSave: updated saved store and HTML");
    window.savedStore = winStore;
    window.savedHTML = renderedString;
  }

  return renderAndSave;
}

function invokeLater(f) {
  window.setTimeout(f, 0);
}

function registerEventHandlers(uf) {
    // window events:
    chrome.windows.onRemoved.addListener((windowId) => {
      uf((state) => {
        const tabWindow = state.getTabWindowByChromeId(windowId);
        const st = tabWindow ? state.handleTabWindowClosed(tabWindow) : state;
        return st;
      });
    });
    chrome.windows.onCreated.addListener(chromeWindow => {
      uf((state) => {
        return state.syncChromeWindow(chromeWindow);
      });
    });
    chrome.windows.onFocusChanged.addListener(windowId => {
      if (windowId===chrome.windows.WINDOW_ID_NONE)
        return;
      uf((state) => {
        return state.setCurrentWindow(windowId);
      });
    },
      { windowTypes: ['normal'] }
    );

    // tab events:
    chrome.tabs.onCreated.addListener(tab => {
      uf(state => {
        const tabWindow = state.getTabWindowByChromeId(tab.windowId);
        if (!tabWindow) {
          console.warn("tabs.onCreated: window id not found: ", tab.windowId);
          return state;
        }
        return state.handleTabCreated(tabWindow,tab);
      });
    });
    chrome.tabs.onUpdated.addListener((tabId,changeInfo,tab) => {
      uf(state => {
        const tabWindow = state.getTabWindowByChromeId(tab.windowId);
        if (!tabWindow) {
          console.warn("tabs.onUpdated: window id not found: ", tab.windowId);
          return state;
        }
        return state.handleTabUpdated(tabWindow,tabId,changeInfo);
      });
    });
    chrome.tabs.onActivated.addListener(activeInfo => {
      // console.log("tabs.onActivated: ", activeInfo);
      uf((state) => {
        const tabWindow = state.getTabWindowByChromeId(activeInfo.windowId);
        if (!tabWindow) {
          console.warn("tabs.onActivated: window id not found: ", activeInfo.windowId);
          return state;
        }
        const st = tabWindow ? state.handleTabActivated(tabWindow,activeInfo.tabId) : state;
        return st;
      });
    });
    chrome.tabs.onRemoved.addListener((tabId,removeInfo) => {
      uf(state => {
        const tabWindow = state.getTabWindowByChromeId(removeInfo.windowId);
        if (!tabWindow) {
          console.warn("tabs.onActivated: window id not found: ", removeInfo.windowId);
          return state;
        }
        if (removeInfo.isWindowClosing) {
          // window closing, ignore...
          return state;
        }
        return state.handleTabClosed(tabWindow, tabId);
      });
    });
}

function main() {
  initWinStore((bmStore) => {
    // console.log("init: done reading bookmarks: ", bmStore);
    // window.winStore = winStore;
    actions.syncChromeWindows((uf) => {
      console.log('initial sync of chrome windows complete.');
      const syncedStore = uf(bmStore);
      window.storeRef = new ViewRef(syncedStore);

      // dumpAll(winStore);
      // dumpChromeWindows();

      const renderListener = makeRenderListener(window.storeRef);

      // And call it once to get started:
      renderListener();

      /*
       * The renderListener is just doing a background render to enable us to
       * display an initial server-rendered preview of the HTML when opening the popup
       * and (hopefully) speed up the actual render since DOM changes should be
       * minimized.
       *
       * Let's throttle this way down to avoid spending too many cycles building
       * this non-interactive preview.
       */
      const throttledRenderListener = _.debounce(renderListener, 2000);
      window.storeRef.on('change', throttledRenderListener);

      setupConnectionListener(window.storeRef);


      const storeRefUpdater = refUpdater(window.storeRef);
      registerEventHandlers(storeRefUpdater);

      /*
       * OK, this really shows limits of our refUpdater strategy, which conflates the
       * state updater action with the notion of a completion callback.
       * We really want to use callback chaining to ensure we don't show the popout
       * until after the popout is closed.
       */
      actions.closePopout(window.storeRef.getValue(),(uf) => {
        storeRefUpdater(uf);      
        actions.showPopout(window.storeRef.getValue(),storeRefUpdater);
      });
    });
  });
}

main();
