/**
 * 
 * High level routines for initialization and synchronization of window and tab state before
 * rendering.
 * Used to run as a background page, but there seems to be a critical performance issue when
 * a popup talks to a bg page that makes popup rendering extremely slow.
 */

'use strict';

var $ = require('jquery');

var _ = require('underscore');
var Fluxxor = require('fluxxor');
var constants = require('./constants.js');
var actions = require('./actions.js');
var TabWindowStore = require('./tabWindowStore.js');

var TabWindow = require('./tabWindow.js');
var CONTEXT_MENU_ID = 99;

var contextMenuCreated = false;

var flux = null; // flux instance
var winStore = null;  // TabWindowStore instance

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
function loadManagedWindows( tabManFolder ) {
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


// This function creates a new anchor element and uses location
// properties (inherent) to get the desired URL data. Some String
// operations are used (to normalize results across browsers).
// From http://james.padolsey.com/javascript/parsing-urls-with-the-dom/ 
function parseURL(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
        hash: a.hash.replace('#',''),
        path: a.pathname.replace(/^([^\/])/,'/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
        segments: a.pathname.replace(/^\//,'').split('/')
    };
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

function initBookmarks(cb) {
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
          loadManagedWindows(subTreeNodes[0]);
          cb();
        });
      })
    });
  });
}

function initStored(winStore,payloads,cb) {
  var tabWindows = payloads.map(TabWindow.deserialize);
  flux.actions.addTabWindows(tabWindows);    
  cb(winStore);
}

function initContextMenu() {
  var sendToMenuItem = { type: "normal",
                     id: CONTEXT_MENU_ID,
                     title: "Open Link in Existing Window",
                     contexts: [ "link" ]
                    };
  chrome.contextMenus.create( sendToMenuItem, function() {
    contextMenuCreated = true;
  });
}

function initFluxStore() {
  var stores = {
    TabWindowStore: new TabWindowStore()
  };

  flux = new Fluxxor.Flux(stores, actions);
  winStore = stores.TabWindowStore;
  flux.on("dispatch", function(type, payload) {
      if (console && console.log) {
          console.log("[Dispatch]", type, payload);
      }
  });
  module.exports.flux = flux;
  module.exports.winStore = winStore;
  return winStore;    
}

/**
 * init doing full read of bookmarks (for bgHelper)
 */
function init(cb) {
  console.log("tabman: init");
  var winStore = initFluxStore();
  initBookmarks(function () {
    console.log("tabman: init complete.");
    cb(winStore);
  });
}

/**
 * init for popup by reading from local storage and using
 * that to re-constitute Flux
 */
function initPopup(cb) {
  console.log("renderPopup: About to read from local storage");
  chrome.storage.local.get('contents', function (container) {
    console.log("renderPopup: read container ", container);
    var tabWindows = container.contents.contents;
    var winStore = initFluxStore();
    initStored(winStore,tabWindows, cb);
  });
}

module.exports = {
  parseURL: parseURL,
  manageWindow: manageWindow,
  unmanageWindow: unmanageWindow,
  init: init,
  initPopup: initPopup    
};