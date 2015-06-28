/**
 * Background helper page.
 * Gathering bookmark and window state and places in local storage so that
 * popup rendering will be as fast as possible
 */
'use strict';

var TabWindowStore = require('./tabWindowStore.js');
var TabWindow = require('./tabWindow.js');

var HelperMessages = require('./helperMessages.js');

var popupPort = null;
var tabmanFolderId = null;
var tabmanFolderTitle = "Subjective Tab Manager";

var archiveFolderId = null;
var archiveFolderTitle = "_Archive";

/*
 * begin managing the specified tab window
 */
function manageWindow( tabWindow, opts ) {
  // and write out a Bookmarks folder for this newly managed window:
  if( !tabmanFolderId ) {
    alert( "Could not save bookmarks -- no tab manager folder" );
  }
  var windowFolder = { parentId: tabmanFolderId,
                       title: opts.title,
                     };
  chrome.bookmarks.create( windowFolder, function( windowFolderNode ) {
    console.log( "succesfully created bookmarks folder ", windowFolderNode );
    console.log( "for window: ", tabWindow );
    var tabs = tabWindow.chromeWindow.tabs;
    for( var i = 0; i < tabs.length; i++ ) {
      var tab = tabs[ i ];
      // bookmark for this tab:
      var tabMark = { parentId: windowFolderNode.id, title: tab.title, url: tab.url };
      chrome.bookmarks.create( tabMark, function( tabNode ) {
        console.log( "succesfully bookmarked tab ", tabNode );
      });
    }
    // Now do an explicit get of subtree to get node populated with children
    chrome.bookmarks.getSubTree( windowFolderNode.id, function ( folderNodes ) {
      var fullFolderNode = folderNodes[ 0 ];
      tabWindow.bookmarkFolder = fullFolderNode;

      // Note: Only now do we actually change the state to managed!
      // This is to avoid a nasty race condition where the bookmarkFolder would be undefined
      // or have no children because of the asynchrony of creating bookmarks.
      // There might still be a race condition here since
      // the bookmarks for children may not have been created yet.
      // Haven't seen evidence of this so far.
      tabWindow._managed = true;
      tabWindow._managedTitle = opts.title;
    } );
  } );
}

/* stop managing the specified window...move all bookmarks for this managed window to Recycle Bin */
function unmanageWindow( tabWindow ) {
  tabWindow._managed = false;

  if( !archiveFolderId ) {
    alert( "could not move managed window folder to archive -- no archive folder" );
    return;
  }
  chrome.bookmarks.move( tabWindow.bookmarkFolder.id, { parentId: archiveFolderId } );
  tabWindow.bookmarkFolder = null;  // disconnect from this bookmark folder
}

/* On startup load managed windows from bookmarks folder */
function loadManagedWindows(flux,tabManFolder ) {
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
  flux.actions.addTabWindows(folderTabWindows);
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

function initBookmarks(flux,cb) {
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
          loadManagedWindows(flux,subTreeNodes[0]);
          cb();
        });
      })
    });
  });
}

/**
 * serialize current window store state and send to popup
 */
function sendFullUpdate(fluxState,port) {
  var encodedStore = fluxState.winStore.serializeAll();

  var msg = HelperMessages.fullUpdate(encodedStore);
  port.postMessage(msg);
}

/**
 * handle message received on port from popup
 */
function handlePopupMessage(fluxState,port,msg) {
  console.log("handlePopupMessage: Got message from popup: ", msg);
  switch (msg.messageType) {
    case HelperMessages.REQ_HELLO:
      sendFullUpdate(fluxState,port);
      break;
    default:
      console.error("bgHelper: Unexpected message type: ", msg.messageType);
  }
}


function main() {
  console.log("Hello from background page!");
  var fluxState = TabWindowStore.init();

  chrome.runtime.onConnect.addListener(function (port) {
    console.log("Background page accepted connection on port ", port.name);
    popupPort = port;
    port.onMessage.addListener(function (msg) {
      handlePopupMessage(fluxState,port,msg);
    });
  });

  initBookmarks(fluxState.flux,function () {
    console.log("init: done reading bookmarks, now syncing windows...");
    /**
     * register a one-time onChange event handler to be invoked after syncWindowList action
     * completes
     */
    fluxState.winStore.once('change', function() {
      console.log("init: done sync'ing windows");

      console.log("bgHelper: initialization complete.");
      var encodedStore = fluxState.winStore.serializeAll();

      var storeState = {
          'formatVersion': '0.1',
          'contents': encodedStore
      };
      chrome.storage.local.set({'contents': storeState}, function () {
          console.log("Wrote bookmark state to local storage");
      });
      console.log("winStore: ", fluxState.winStore);
    });
    fluxState.flux.actions.syncWindowList();
  });
}

main();