/**
 * Background helper page.
 * Gathering bookmark and window state and places in local storage so that
 * popup rendering will be as fast as possible
 */
'use strict';

var TabWindowStore = require('./tabWindowStore.js');
var TabWindow = require('./tabWindow.js');

var actions = require('./actions');

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
    var tabs = TabWindow.chromeWindow.tabs;
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
      TabWindow.bookmarkFolder = fullFolderNode;

      // Note: Only now do we actually change the state to managed!
      // This is to avoid a nasty race condition where the bookmarkFolder would be undefined
      // or have no children because of the asynchrony of creating bookmarks.
      // There might still be a race condition here since
      // the bookmarks for children may not have been created yet.
      // Haven't seen evidence of this so far.
      TabWindow._managed = true;
      TabWindow._managedTitle = opts.title;
    } );
  } );
}

/* stop managing the specified window...move all bookmarks for this managed window to Recycle Bin */
function unmanageWindow( tabWindow ) {
  TabWindow._managed = false;

  if( !archiveFolderId ) {
    alert( "could not move managed window folder to archive -- no archive folder" );
    return;
  }
  chrome.bookmarks.move( TabWindow.bookmarkFolder.id, { parentId: archiveFolderId } );
  TabWindow.bookmarkFolder = null;  // disconnect from this bookmark folder
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

function main() {
  console.log("Hello from background page!");
  var fluxState = TabWindowStore.init(actions);

  fluxState.flux.on("sync",function (info) {
    console.log("bgHelper: got sync event -- rendering");
  });

  fluxState.flux.on("change",function (info) {
    console.log("bgHelper: got change event");
  });

  window.fluxState = fluxState;
  initBookmarks(fluxState.flux,function () {
    console.log("init: done reading bookmarks.");
    fluxState.flux.actions.syncWindowList();
  });
}

main();