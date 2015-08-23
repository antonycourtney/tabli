/**
 * Representations of windows and bookmark folders
 */
'use strict';

function makeBookmarkedTabItem( bm ) {
  var ret = Object.create( bm );
  ret.bookmarked = true;
  ret.open = false;
  ret.bookmark = bm;
  return ret;
};

function makeOpenTabItem(ot) {
  var ret = Object.create( ot );
  ret.bookmarked = false;
  ret.open = true;
  return ret;
};

/*
 * Gather open tabs and a set of non-opened bookmarks from the given bookmarks 
 * list for a managed window that is open
 */
function getManagedOpenTabInfo(openTabs,bookmarks) {
  var urlMap = {};
  var tabs = openTabs.map( function ( ot ) { 
    var item = makeOpenTabItem( ot); 
    urlMap[ ot.url ] = item;
    return item;
  } );
  var closedBookmarks = [];
  for ( var i = 0; i < bookmarks.length; i++ ) {
    var bm = bookmarks[ i ];
    var obm = urlMap[ bm.url ];
    if ( obm ) {
      obm.bookmarked = true;
      obm.bookmark = bm;
    } else {
      closedBookmarks.push( makeBookmarkedTabItem( bm ) );
    }
  }
  return { openTabs: tabs, closedBookmarks: closedBookmarks };
}

/*
 * For a managed, open window, return a list of tab items
 * representing both open tabs and closed bookmarks, making
 * best effort to preserve a sensible order
 */
function getManagedOpenTabs(chromeWindow,bookmarkFolder) {
  var tabInfo = getManagedOpenTabInfo( chromeWindow.tabs, bookmarkFolder.children );
  /*
   * So it's actually not possible to come up with a perfect ordering here, since we
   * want to preserve both bookmark order (whether open or closed) and order of
   * currently open tabs.
   * As a compromise, we'll present bookmarked, opened tabs for as long as they
   * match the bookmark ordering, then we'll inject the closed bookmarks, then
   * everything else.
   */
  var outTabs = [];
  var openTabs = tabInfo.openTabs.slice();
  var bookmarks = bookmarkFolder.children.slice();

  while ( openTabs.length > 0 && bookmarks.length > 0) {
    var tab = openTabs.shift();
    var bm = bookmarks.shift();
    if ( tab.bookmarked && bm.url === tab.url) {
      outTabs.push( tab );
      tab = null;
      bm = null;
    } else {
      break;
    }
  }
  // we hit a non-matching tab, now inject closed bookmarks:
  outTabs = outTabs.concat( tabInfo.closedBookmarks );
  if (tab) {
    outTabs.push(tab);
  }
  // and inject the remaining tabs:
  outTabs = outTabs.concat( openTabs );

  return outTabs;
}

var tabWindowPrototype = { 
  _managed: false, 
  _managedTitle: "",
  chromeWindow: null,
  bookmarkFolder: null,  
  open: false,
  _focused: false,  // TODO/FIXME: Wrong rep for event-driven bgHelper

  reloadBookmarkFolder: function() {
    var tabWindow = this;
    chrome.bookmarks.getSubTree( this.bookmarkFolder.id, function ( folderNodes ) {
      var fullFolderNode = folderNodes[ 0 ];
      tabWindow.bookmarkFolder = fullFolderNode;
    } );
  },

  getTitle:  function() {
    if( this._managed ) {
      return this.bookmarkFolder.title;
    } else {
      var tabs = this.chromeWindow.tabs;
      if (!tabs)
        return "";  // window initializing
      
      // linear search to find active tab to use as window title
      for ( var j = 0; j < tabs.length; j++ ) {
        var tab = tabs[j];
        if ( tab.active ) {
          return tab.title;
        }
      }
    }
    return "";  // shouldn't happen
  },

  isManaged: function() {
    return this._managed;
  },

  isFocused: function() {
    return this._focused;
  },

  // Get a set of tab-like items for rendering
  getTabItems: function() {
    var tabs;

    if( this.isManaged() ) {
      if( this.open ) {
        tabs = getManagedOpenTabs(this.chromeWindow,this.bookmarkFolder);
      } else {
        tabs = this.bookmarkFolder.children.map( makeBookmarkedTabItem );
      }
    } else {
      tabs = this.chromeWindow.tabs.map( makeOpenTabItem );
    }

    return tabs;
  },

  /*
   * return bookmark Id or chrome Id dependending on tabWindow type
   */
  getEncodedId: function() {
    var idType;
    var id;

    if (this.bookmarkFolder) {
      idType = "bookmark";
      id = this.bookmarkFolder.id;
    } else {
      idType = "window";
      id = this.chromeWindow.id;
    }
    return { idType: idType, id: id };
  }
};

/*  
 * initialize a tab window from a (unmanaged) chrome Window
 */
export function makeChromeTabWindow( chromeWindow ) {
  var ret = Object.create( tabWindowPrototype );
  ret.chromeWindow = chromeWindow;
  ret.open = true;
  return ret;
}

/*
 * initialize an unopened window from a bookmarks folder
 */
export function makeFolderTabWindow( bookmarkFolder ) {
  var ret = Object.create( tabWindowPrototype );
  ret._managed = true;
  ret.bookmarkFolder = bookmarkFolder;

  return ret;
}

/*
 * deserialize a TabWindow from its payload:
 */
export function deserialize(payload) {
  if (payload._managed) {
    return makeFolderTabWindow(payload.bookmarkFolder);
  } else {
    return makeChromeTabWindow(payload.chromeWindow);
  }
} 
