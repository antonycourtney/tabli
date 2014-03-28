(function ($) {
  'use strict';
  $.extend( true, window, {
    tabMan: {
      parseURL: parseURL,
      syncWindowList: syncWindowList,
      manageWindow: manageWindow,
      unmanageWindow: unmanageWindow,
      restoreBookmarkWindow: restoreBookmarkWindow,
      revertWindow: revertWindow
    }
  });

  var CONTEXT_MENU_ID = 99;

  var contextMenuCreated = false;

  var windowIdMap = {};
  var tabWindows = [];

  var tabmanFolderId = null;
  var tabmanFolderTitle = "Subjective Tab Manager";

  var archiveFolderId = null;
  var archiveFolderTitle = "_Archive";

  function restoreBookmarkWindow( tabWindow ) {
    var urls = [];
    var tabs = tabWindow.getTabItems();
    var urls = tabs.map( function (item) { return item.url; } );
    function cf( chromeWindow ) {
      tabWindow.chromeWindow = chromeWindow;  // TODO: hide in an attach member fn
      tabWindow.open = true;
      windowIdMap[ chromeWindow.id ] = tabWindow;      
    }
    chrome.windows.create( { url: urls, focused: true, type: 'normal'}, cf );
  }

  function revertWindow( tabWindow ) {
    var bmUrlMap = {};

    var bookmarks = tabWindow.bookmarkFolder.children;

    bookmarks.map( function( bm ) { bmUrlMap[ bm.url ] = bm; } );

    // now let's go through each open tab, and keep only those that are bookmarked...
    var openUrlMap = {};

    var tabs = tabWindow.chromeWindow.tabs;

    for ( var i = 0; i < tabs.length; i++ ) {
      var tab = tabs[ i ];
      if ( bmUrlMap[ tab.url ] ) {
        openUrlMap[ tab.url ] = tab;
      } else {
        // not bookmarked, close it...
        chrome.tabs.remove( tab.id );
      }
    }

    for ( i = 0; i < bookmarks.length; i++ ) {
      var bm = bookmarks[ i ];
      if ( openUrlMap[ bm.url ] )
        continue;

      // need to open it:
      var tabInfo = { windowId: tabWindow.chromeWindow.id, url: bm.url };
      chrome.tabs.create( tabInfo );
    }
  }

 /*
  * begin managing the specified tab window
  *
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

  var tabWindowPrototype = { 
    _managed: false, 
    _managedTitle: "",
    chromeWindow: null,
    bookmarkFolder: null,  
    open: false,
  
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

    // Get a set of tab-like items for rendering
    getTabItems: function() {

      function makeBookmarkedTabItem( bm ) {
        var ret = Object.create( bm );
        ret.bookmarked = true;
        ret.open = false;
        ret.bookmark = bm;
        return ret;
      };

      function makeOpenTabItem( urlMap, ot ) {
        var ret = Object.create( ot );
        ret.bookmarked = false;
        ret.open = true;
        urlMap[ ot.url ] = ret;

        return ret;
      };

      var tabs;

      if( this.isManaged() ) {
        // try to match the open tabs as closely as possible by starting there:

        var urlMap = {};

        if( this.open ) {
          tabs = this.chromeWindow.tabs.map( function ( ot ) { return makeOpenTabItem( urlMap, ot); } );

          var closedBookmarks = [];
          for ( var i = 0; i < this.bookmarkFolder.children.length; i++ ) {
            var bm = this.bookmarkFolder.children[ i ];
            var obm = urlMap[ bm.url ];
            if ( obm ) {
              obm.bookmarked = true;
              obm.bookmark = bm;
            } else {
              closedBookmarks.push( makeBookmarkedTabItem( bm ) );
            }
          }
          tabs = closedBookmarks.concat( tabs );
        } else {
          tabs = this.bookmarkFolder.children.map( makeBookmarkedTabItem );
        }
      } else {
        tabs = this.chromeWindow.tabs;
      }

      return tabs;
    }
  };

  /*  
   * initialize a tab window from a (unmanaged) chrome Window
   */
  function makeChromeTabWindow( chromeWindow ) {
    var ret = Object.create( tabWindowPrototype );
    ret.chromeWindow = chromeWindow;
    ret.open = true;
    return ret;
  }

  /*
   * initialize an unopened window from a bookmarks folder
   */
  function makeFolderTabWindow( bookmarkFolder ) {
    var ret = Object.create( tabWindowPrototype );
    ret._managed = true;
    ret.bookmarkFolder = bookmarkFolder;

    return ret;
  }

   /*
    * add a new Tab window to global maps:
    */
   function addTabWindow( tabWindow ) {
      var chromeWindow = tabWindow.chromeWindow;
      if( chromeWindow ) {
        windowIdMap[ chromeWindow.id ] = tabWindow;
      }
      tabWindows.push( tabWindow );     
   }

  /**
   * synchronize windows from chrome.windows.getAll with internal map of
   * managed and unmanaged tab windows
   * returns:
   *   - array of all tab Windows
   */
  function syncWindowList( chromeWindowList ) {
    // To GC any closed windows:
    for ( var i = 0; i < tabWindows.length; i++ ) {
      var tabWindow = tabWindows[ i ];
      if( tabWindow )
        tabWindow.open = false;
    }
    for ( var i = 0; i < chromeWindowList.length; i++ ) {
      var chromeWindow = chromeWindowList[ i ];
      var tabWindow = windowIdMap[ chromeWindow.id ];
      if( !tabWindow ) {
        console.log( "syncWindowList: new window id: ", chromeWindow.id );
        tabWindow = makeChromeTabWindow( chromeWindow );
        addTabWindow( tabWindow );
      } else {
        // console.log( "syncWindowList: cache hit for id: ", chromeWindow.id );
        // Set chromeWindow to current snapshot of tab contents:
        tabWindow.chromeWindow = chromeWindow;
        tabWindow.open = true;
      }
    }
    // GC any closed, unmanaged windows:
    for ( var i = 0; i < tabWindows.length; i++ ) {
      tabWindow = tabWindows[ i ];
      if( tabWindow && !( tabWindow._managed ) && !( tabWindow.open ) ) {
        console.log( "syncWindowList: detected closed window: ", tabWindow );
        // if user un-bookmarked a non-open folder window, won't have an id or a folder:
        var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
        if ( windowId ) 
          delete windowIdMap[ tabWindow.chromeWindow.id ];
        delete tabWindows[ i ];
      }
    }

    return tabWindows;
  }   

  /* On startup load managed windows from bookmarks folder */
  function loadManagedWindows( tabManFolder ) {
    function loadWindow( winFolder ) {
      var folderWindow = makeFolderTabWindow( winFolder );
      addTabWindow( folderWindow );
    }

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
      loadWindow( windowFolder );
    }
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

  function initBookmarks() {
    chrome.bookmarks.getTree(function(tree){
      var otherBookmarksNode = tree[0].children[1]; 
      console.log( "otherBookmarksNode: ", otherBookmarksNode );
      ensureChildFolder( otherBookmarksNode, tabmanFolderTitle, function( tabManFolder ) {
        console.log( "tab manager folder acquired." );
        tabmanFolderId = tabManFolder.id;
        ensureChildFolder( tabManFolder, archiveFolderTitle, function( archiveFolder ) {
          console.log( "archive folder acquired." );
          archiveFolderId = archiveFolder.id;
          loadManagedWindows( tabManFolder );
        })
      });
    });
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

  initBookmarks();
  // initContextMenu(); -- someday.  Maybe not in first release
})(jQuery);
