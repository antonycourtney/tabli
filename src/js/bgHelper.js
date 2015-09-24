/**
 * Background helper page.
 * Gathering bookmark and window state and places in local storage so that
 * popup rendering will be as fast as possible
 */
'use strict';

import TabWindowStore from './tabWindowStore';
import * as TabWindow from './tabWindow';
import * as actions from './actions';
import * as React from 'react';
import {addons} from 'react/addons';
import * as Components from './components';
import RefCell from './refCell';

var popupPort = null;
const tabmanFolderTitle = "Subjective Tab Manager";
const archiveFolderTitle = "_Archive";

/* On startup load managed windows from bookmarks folder */
function loadManagedWindows(winStore,tabManFolder ) {
  var folderTabWindows = [];
  for( var i = 0; i < tabManFolder.children.length; i++ ) {
    var windowFolder = tabManFolder.children[ i ];
    if( windowFolder.title[0] === "_" ) {
      continue;
    }
    var fc = windowFolder.children;
    if ( !fc ) {
      console.log( "Found bookmarks folder with no children, skipping: ", fc );
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
function ensureChildFolder( parentNode, childFolderName, callback ) {
  if (parentNode.children) {
    for ( var i = 0; i < parentNode.children.length; i++ ) {
      var childFolder = parentNode.children[ i ];
      if( childFolder.title.toLowerCase() === childFolderName.toLowerCase() ) {
        // exists
        console.log( "found target child folder: ", childFolderName );
        callback( childFolder );
        return true;
      }
    }
  }
  console.log( "Child folder ", childFolderName, " Not found, creating..." );
  // If we got here, child Folder doesn't exist
  var folderObj = { parentId: parentNode.id, title: childFolderName };
  chrome.bookmarks.create( folderObj, callback );
}

/**
 * acquire main folder and archive folder and initialize
 * window store
 */
function initWinStore(cb) {
  var tabmanFolderId = null;
  var archiveFolderId = null;

  chrome.bookmarks.getTree(function(tree){
    var otherBookmarksNode = tree[0].children[1]; 
    console.log( "otherBookmarksNode: ", otherBookmarksNode );
    ensureChildFolder( otherBookmarksNode, tabmanFolderTitle, function( tabManFolder ) {
      console.log( "tab manager folder acquired." );
      tabmanFolderId = tabManFolder.id;
      ensureChildFolder( tabManFolder, archiveFolderTitle, function( archiveFolder ) {
        console.log( "archive folder acquired." );
        archiveFolderId = archiveFolder.id;
        chrome.bookmarks.getSubTree(tabManFolder.id,function (subTreeNodes) {
          console.log("bookmarks.getSubTree for TabManFolder: ", subTreeNodes);
          const baseWinStore = new TabWindowStore({folderId: tabmanFolderId, archiveFolderId });
          const loadedWinStore = loadManagedWindows(baseWinStore,subTreeNodes[0]);
          cb(loadedWinStore);
        });
      })
    });
  });
}

function setupConnectionListener(storeRef) {
  chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
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
function downloadJSON(dumpObj,filename) {
  const dumpStr = JSON.stringify(dumpObj,null,2);
  const winBlob = new Blob([dumpStr], {type:"application/json"});
  const url = URL.createObjectURL(winBlob);
  chrome.downloads.download({url,filename});  
}

/**
 * dump all windows -- useful for creating performance tests
 *
 * NOTE:  Requires the "downloads" permission in the manifest!
 */
function dumpAll(winStore) {
  const allWindows = winStore.getAll();

  const jsWindows = allWindows.map((tw) => tw.toJS());

  const dumpObj = {allWindows: jsWindows};

  downloadJSON(dumpObj,'winStoreSnap.json');
}

function dumpChromeWindows() {
  chrome.windows.getAll({populate: true}, (chromeWindows) => {
    downloadJSON({chromeWindows},'chromeWindowSnap.json');
  });
}

/**
 * create a TabMan element, render it to HTML and save it for fast loading when 
 * opening the popup
 */
function makeRenderListener(storeRef) {
  function renderAndSave() {
    const winStore = storeRef.getValue();

    /* Let's create a dummy app element to render our current store 
     * React.renderToString() will remount the component, so really want a fresh element here with exactly
     * the store state we wish to render and save.
     */
    const renderAppElement = <Components.TabMan storeRef={null} initialWinStore={winStore} noListener={true} />;  
    const renderedString = React.renderToString(renderAppElement);
    console.log("renderAndSave: updated saved store and HTML");
    window.savedStore = winStore;
    window.savedHTML = renderedString;
  }
  return renderAndSave;
}

function main() {
  initWinStore(function (bmStore) {
    console.log("init: done reading bookmarks: ", bmStore);
    // window.winStore = winStore;
    actions.syncChromeWindows(bmStore,(syncedStore) => {
      console.log("initial sync of chrome windows complete.");
      window.storeRef = new RefCell(syncedStore);

      // dumpAll(winStore);
      // dumpChromeWindows();

      const renderListener = makeRenderListener(window.storeRef);
      // And call it once to get started:
      renderListener();
      storeRef.on("change", renderListener);

      setupConnectionListener(window.storeRef);
    });
  });
}

main();