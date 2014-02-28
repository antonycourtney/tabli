(function ($) {
  'use strict';
  $.extend( true, window, {
    tabMan: {
      parseURL: parseURL,
      renderPopup: renderPopup
    }
  });

  // TODO: construct and store dynamically!
  var subjectConfig = {
    'Mail': {
      urlHostSuffix: 'mail.google.com',
      tabs: [
        { title: "GMail Inbox", url: "https://mail.google.com/mail/u/0/#inbox" }
      ],
    },
    'Facebook': {
      urlHostSuffix: 'facebook.com',
      tabs: [
        { title: "Facebook", url: "https://www.facebook.com/" }
      ] 
    },
    'Python': {
      urlHostSuffix: 'docs.python.org',
      tabs: [
        { title: "Python Docs", url: "http://docs.python.org/2/" },
        { title: "Tutorial", url: "http://docs.python.org/2/tutorial/index.html" },
        { title: "Library Reference", url: "http://docs.python.org/2/library/index.html" },
        { title: "Language Reference", url: "http://docs.python.org/2/reference/index.html" }
      ]  
    }
  };



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

  function insertAfter(referenceNode, newNode) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  function makeElem( tag, txt ) {
    var item = document.createElement( tag );
    if( txt )
      item.appendChild( document.createTextNode(txt) );
    return item;
  };

/*
  function updateWindowList() {
    var subjectWindowList = [];
    var unmanagedWindowList = [];

    var subjectWindows = {};
    var subjectMatchers = [];

    function init() {
      var subject;
      for ( subject in subjectConfig ) {
        if ( !subjectConfig.hasOwnProperty( subject ) ) 
          continue;
        var sc = subjectConfig[ subject ];
        var pat = sc.urlHostSuffix.replace(".", "\\.") + "$";
        var re = new RegExp( pat );
        var sw = { subject: subject, config: sc };
        subjectWindowList.push( sw );
        subjectMatchers.push( { urlRE: re, subjectWindow: sw } );
      }
    }



    function buildWindowLists( windowList ) {
      console.log( "tabMan.buildWindowLists ", windowList );
      for ( var i = 0; i < windowList.length; i++ ) {
        var win = windowList[i];
        var tabs = win.tabs;
        for ( var j = 0; j < tabs.length; j++ ) {
          var tab = tabs[j];
          var sw = findSubjectByURL( tab.url );

        }
      }
    }
    // chrome.windows.getAll( {populate: true}, buildWindowLists );
*/
  
  function renderWindowTabs( headerId, windowTitle, tabs ) {
    var windowItem = makeElem( 'div' );
    windowItem.classList.add('windowInfo');

    var windowHeader = makeElem( 'div' );
    windowHeader.classList.add( 'windowHeader' );

    var windowTitleItem = makeElem( 'h3', windowTitle );
    windowTitleItem.classList.add('nowrap');
    windowTitleItem.classList.add('singlerow');
    windowTitleItem.classList.add('windowTitle');
    windowHeader.appendChild( windowTitleItem );

    var tabListItem = makeElem('div');
    tabListItem.classList.add('tablist');
    for( var i = 0; i < tabs.length; i++ ) {
      var tab = tabs[ i ];

      var tabItem = makeElem( 'div' );  
      tabItem.classList.add('singlerow');
      tabItem.classList.add('nowrap');
      tabItem.classList.add('tabinfo');

      if( tab.favIconUrl ) {
        var tabFavIcon = makeElem('img');
        tabFavIcon.setAttribute('src',tab.favIconUrl);
        tabFavIcon.classList.add('favicon');
        tabItem.appendChild(tabFavIcon);        
      }

      var titleItem = makeElem( 'span', tab.title );
      titleItem.classList.add('nowrap');
      titleItem.classList.add('singlerow');
      tabItem.appendChild( titleItem );

      tabListItem.appendChild( tabItem );
    }
    windowItem.appendChild( windowHeader ); 
    windowItem.appendChild( tabListItem );

    var winHeader= document.getElementById( headerId );
    insertAfter( winHeader, windowItem );
  }

  function renderManagedList( managedWindows ) {
    var subject;
    for ( subject in subjectConfig ) {
      if ( !subjectConfig.hasOwnProperty( subject ) ) 
        continue;
      var sc = subjectConfig[ subject ];

      renderWindowTabs( 'managedWindows', subject, sc.tabs );
    }
  }

  function renderUnmanagedList( windowList ) {
    for ( var i = 0; i < windowList.length; i++ ) {
      var win = windowList[i];
      var tabs = win.tabs;
      var windowTitle = "";

      // linear search to find active tab to use as window title
      for ( var j = 0; j < tabs.length; j++ ) {
        var tab = tabs[j];
        if ( tab.active ) {
          windowTitle = tab.title;
        }
      }
      
      renderWindowTabs( 'unmanagedWindows', windowTitle, tabs );
    }          
  }

  function renderPopup() {
    chrome.windows.getAll( {populate: true}, function( windowList ) {
      console.log( "in windows.getAll callback:", windowList );
      var managedWindows = subjectConfig; // for now
      var unmanagedWindows = windowList;  // for now

      renderManagedList( managedWindows );
      renderUnmanagedList( unmanagedWindows );
    } );
  }
})(jQuery);

/*
document.addEventListener('DOMContentLoaded', function () {
  tabMan.renderPopup();
});

*/
$(document).bind('ready', tabMan.renderPopup );