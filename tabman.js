(function ($) {
  'use strict';
  $.extend( true, window, {
    tabMan: {
      parseURL: parseURL,
      syncWindowList: syncWindowList,
      manageWindow: manageWindow,
    }
  });

  var windowIdMap = {};
  var tabWindows = [];


  function getTabWindowTitle() {
    if( this.managed ) {
      return this._managedTitle;
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
  }

 /*
  * begin managing the specified tab window
  */
  function manageWindow( tabWindow, opts ) {
    tabWindow.managed = true;
    tabWindow._managedTitle = opts.title;
  }

  /*  
   * initialize a tab window from a chrome Window
   */
  function makeTabWindow( chromeWindow ) {
    var ret = { managed: false, 
                _managedTitle: "",
                chromeWindow: chromeWindow,  
                open: true,
              };
    ret.getTitle = getTabWindowTitle;
    return ret;
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
        tabWindow = makeTabWindow( chromeWindow );
        windowIdMap[ chromeWindow.id ] = tabWindow;
        tabWindows.push( tabWindow );
      } else {
        console.log( "syncWindowList: cache hit for id: ", chromeWindow.id );
        // Set chromeWindow to current snapshot of tab contents:
        tabWindow.chromeWindow = chromeWindow;
        tabWindow.open = true;
      }
    }
    // GC any closed windows:
    for ( var i = 0; i < tabWindows.length; i++ ) {
      tabWindow = tabWindows[ i ];
      if( tabWindow && !( tabWindow.open ) ) {
        console.log( "syncWindowList: detected closed window id: ", chromeWindow.id );
        delete windowIdMap[ tabWindow.chromeWindow.id ];
        delete tabWindows[ i ];
      }
    }

    return tabWindows;
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



})(jQuery);
