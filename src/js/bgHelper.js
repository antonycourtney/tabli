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
  winStore.registerTabWindows(folderTabWindows);
}

/*
 * given a specific parent Folder node, ensure a particular child exists.
 * Will invoke callback either synchronously or asynchronously passing the node
 * for the named child
 */
function ensureChildFolder( parentNode, childFolderName, callback ) {
  for ( var i = 0; i < parentNode.children.length; i++ ) {
    var childFolder = parentNode.children[ i ];
    if( childFolder.title.toLowerCase() === childFolderName.toLowerCase() ) {
      // exists
      console.log( "found target child folder: ", childFolderName );
      callback( childFolder );
      return true;
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
          var winStore = new TabWindowStore(tabmanFolderId,archiveFolderId);
          loadManagedWindows(winStore,subTreeNodes[0]);
          cb(winStore);
        });
      })
    });
  });
}

function setupConnectionListener(winStore) {
  chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
      var listenerId = msg.listenerId;
      port.onDisconnect.addListener(() => {
        winStore.removeViewListener(listenerId);
      });
    });
  });
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

  const dumpStr = JSON.stringify(dumpObj,null,2);

  const winBlob = new Blob([dumpStr], {type:"application/json"});
  const url = URL.createObjectURL(winBlob);
  chrome.downloads.download({url: url,filename: 'winSnap.json'});
}

function main() {
  initWinStore(function (winStore) {
    console.log("init: done reading bookmarks.");
    window.winStore = winStore;
    actions.syncChromeWindows(winStore,() => {
      console.log("initial sync of chrome windows complete.");
      // dumpAll(winStore);

      // Let's do an initial render and save the result for faster load by popup:
      const appElement = <Components.TabMan winStore={winStore} noListener={true} />;  
  
      const renderedString = React.renderToString(appElement);
      console.log("rendered initial HTML");
      window.savedHTML = renderedString;
    });
    setupConnectionListener(winStore);
  });
}

main();