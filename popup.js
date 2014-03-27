(function ($) {
  'use strict';
  $.extend( true, window, {
    tabMan: {
      renderPopup: renderPopup
    }
  });

  var bgw = chrome.extension.getBackgroundPage();

  function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  function refreshPopup() {
    window.location.href="popup.html";
  }

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


  function initManageDialog() {
    var subject = $("#subject"),
        allFields = $( [] ).add( subject );
    $("#manage-dialog").dialog({
          autoOpen: false,
          height: 200,
          width: 280,
          modal: true,
          buttons: {
            "Create": function() {
              var bValid = true;
              allFields.removeClass( "ui-state-error" );

              if ( bValid ) {
                var tabWindow = $( this ).data( "tabWindow" );
                console.log( "manage window:", tabWindow );
                var subjField = $( "#subject" );
                var windowTitle = subjField.val();
                bgw.tabMan.manageWindow( tabWindow, { title: windowTitle } );
                $( this ).dialog( "close" );
                refreshPopup();
              }
            },
            Cancel: function() {
              $( this ).dialog( "close" );
            }
          },
          close: function() {
            allFields.val( "" ).removeClass( "ui-state-error" );
          }
        }); 
  }

  function makeElem( tag, options ) {
    var item = document.createElement( tag );
    if( options ) {
      var txt = options.text;
      if( txt )
        item.appendChild( document.createTextNode(txt) );
      var classes = options.classes;
      if( classes ) {
        for ( var i = 0; i < classes.length; i++ ) {
          item.classList.add( classes[ i ] );
        }
      }
      var parent = options.parent;
      if( parent ) {
        parent.appendChild( item );
      }
      var attrs = options.attributes;
      if( attrs ) {
        for( var attr in attrs ) {
          if( !attrs.hasOwnProperty( attr ) )
            continue;
          item.setAttribute( attr, attrs[attr] );
        }
      }
    }

    return item;
  };
  
  function mkChangeClassHandler( element, addClassName, removeClassName ) {
    return function() {
      if ( addClassName )
        element.classList.add( addClassName );
      if ( removeClassName )
        element.classList.remove( removeClassName );
    };
  }

  function renderTabWindow( tabWindow, current ) {
    var managed = tabWindow.isManaged();
    var windowTitle = tabWindow.getTitle();
    var tabs = tabWindow.getTabItems();
    var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;

    // console.log( "renderTabWindow: title: ", windowTitle, ", tabWindow: ", tabWindow );
    // console.log( "tabs:", tabs );
    var headerId = current ? 'currentWindow' : ( managed ? 'managedWindows' : 'unmanagedWindows' );
    var windowItem = makeElem( 'div', { classes: [ "windowInfo" ] } );

    function makeTabClickHandler( windowId, tabId ) {
      function handler() {
        console.log( "clicked on tab for tab id ", tabId );
        if( tabWindow.open ) {
          chrome.tabs.update( tabId, { active: true } );
          chrome.windows.update( windowId, { focused: true } );
        } else {
          bgw.tabMan.restoreBookmarkWindow( tabWindow );
        }        
      };
      return handler;
    }

    function makeTabCloseHandler( tabElement, windowId, tabId ) {
      function handler() {
        chrome.tabs.remove( tabId );
        tabListItem.removeChild( tabElement );
      }
      return handler;
    }

    function windowCloseHandler() {
      chrome.windows.remove( windowId, function() {
        tabWindow.open = false;
        if ( !managed ) {
          winHeader.parentNode.removeChild( windowItem );
        }
      });
    }

    var windowHeader = makeElem( 'div', 
      { classes: [ "nowrap", "singlerow", "oneRowContainer", "windowHeader" ] } );

    var openClass = tabWindow.open ? "open" : "closed";

    var windowCheckItem = makeElem( 'button',
        { classes: [ "header-button" ], parent: windowHeader } );
    if( managed ) {
      windowCheckItem.classList.add( "managed" );
    } else {
      windowCheckItem.classList.add( "unmanaged" );
      // windowCheckItem.classList.add( "show-on-hover" );
      // windowHeader.addEventListener( "mouseover", mkChangeClassHandler( windowCheckItem, 'hover', 'show-on-hover' ) );
      // windowHeader.addEventListener( "mouseout", mkChangeClassHandler( windowCheckItem, 'show-on-hover', 'hover' ) );
    }

    windowCheckItem.onclick = function() {
      console.log( "toggle manage for '", windowTitle, "'" );
      var checked = windowCheckItem.classList.contains( "unmanaged" ); // current unmanaged, so action is "checked"
      console.log( "state:", checked );
      if( checked ) {
        // unmanaged --> managed:
        var dlg = $("#manage-dialog" );
        var subjField = $( "#subject" );
        subjField.val( windowTitle );
        window.setTimeout( function() {
          subjField[0].setSelectionRange( 0, windowTitle.length );
        }, 0 );
        dlg.data( "tabWindow", tabWindow );
        dlg.dialog( "open" );
      } else {
        bgw.tabMan.unmanageWindow( tabWindow );
        refreshPopup();        
      }
    }

    var windowTitleItem = makeElem( 'span', 
      { text: windowTitle, 
        classes: [ "windowList", "nowrap", "singlerow", "windowTitle", openClass ],
        parent: windowHeader 
      });
    windowTitleItem.onclick = function() {
      console.log( "clicked on window '", windowTitle, "'" );
      if( tabWindow.open ) {
        chrome.windows.update( windowId, { focused: true } );
      } else {
        // need to open it!
        bgw.tabMan.restoreBookmarkWindow( tabWindow );
      }
    };

    if ( tabWindow.open ) {
      var windowCloseButton = makeElem( 'button',
        { classes: [ "header-button", "close", "show-on-hover" ],
          parent: windowHeader,
        });

      // roll our onw hover events because we don't want to bother with cons'ing element ids.
      windowHeader.addEventListener( "mouseover", mkChangeClassHandler( windowCloseButton, 'hover', 'show-on-hover' ) );
      windowHeader.addEventListener( "mouseout", mkChangeClassHandler( windowCloseButton, 'show-on-hover', 'hover' ) );

      windowCloseButton.onclick = windowCloseHandler;
    }

    var tabListItem = makeElem('div', { classes: [ "tablist" ] } );
    for( var i = 0; i < tabs.length; i++ ) {
      var tab = tabs[ i ];
      var tabOpenClass = openClass;

      var tabItem = makeElem( 'div', 
        { classes: [ "singlerow", "nowrap", "oneRowContainer", "tabinfo" ] } );

      if ( managed ) {
        if( !tab.open )
          tabOpenClass = "closed";

        var tabCheckItem = makeElem( 'button',
            { classes: [ "header-button" ],
              parent: tabItem,
            } );

        // TODO: conditional -- actual bookmarks only
        if (tab.bookmarked ) {
          tabCheckItem.classList.add( "managed" );
        } else {
          tabCheckItem.classList.add( "unmanaged" );
          tabCheckItem.classList.add( "show-on-hover" );
          tabItem.addEventListener( "mouseover", mkChangeClassHandler( tabCheckItem, 'hover', 'show-on-hover' ) );
          tabItem.addEventListener( "mouseout", mkChangeClassHandler( tabCheckItem, 'show-on-hover', 'hover' ) );
        }
      }

      var tabFavIcon = makeElem('img', { classes: [ "favicon" ], parent: tabItem } );
      if ( tab.favIconUrl )
        tabFavIcon.setAttribute( 'src', tab.favIconUrl );

      var tabTitleClasses = [ "windowList", "nowrap", "singlerow", tabOpenClass ];
      if( tab.active ) {
        tabTitleClasses.push( "activeTab" );
      }
      var titleItem = makeElem( 'span', 
        { text: tab.title,
          classes: tabTitleClasses,
          parent: tabItem
        });
      titleItem.onclick = makeTabClickHandler( windowId, tab.id );

      if ( tabWindow.open ) {
        var closeButton = makeElem( 'button',
          { classes: [ "header-button", "close", "show-on-hover" ],
            parent: tabItem,
          });

        // roll our onw hover events because we don't want to bother with cons'ing element ids.
        tabItem.addEventListener( "mouseover", mkChangeClassHandler( closeButton, 'hover', 'show-on-hover' ) );
        tabItem.addEventListener( "mouseout", mkChangeClassHandler( closeButton, 'show-on-hover', 'hover' ) );

        closeButton.onclick = makeTabCloseHandler( tabItem, windowId, tab.id );
      }

      tabListItem.appendChild( tabItem );
    }
    windowItem.appendChild( windowHeader ); 
    windowItem.appendChild( tabListItem );

    var winHeader= document.getElementById( headerId );
    insertAfter( winHeader, windowItem );
  }

  function renderPopup() {
    initManageDialog();
    console.log( "background page:", bgw );
    chrome.bookmarks.getTree( function ( tree ) {
      console.log( "Bookmarks tree: ", tree );
    });

    function syncAndRender( windowList ) {
      chrome.windows.getCurrent( null, function ( currentWindow ) {
        console.log( "in windows.getCurrent callback:", windowList, currentWindow );
        var tabWindows = logWrap( bgw.tabMan.syncWindowList )( windowList );
        console.log( "tabWindows:", tabWindows );
        for ( var i = 0; i < tabWindows.length; i++ ) {
          var tabWindow = tabWindows[ i ];
          if( tabWindow ) {
            var isCurrent = tabWindow.open && tabWindow.chromeWindow.id == currentWindow.id;
            logWrap( function() { renderTabWindow( tabWindow, isCurrent ); } )();
          }
        }
      } );
    }

    // wrapper to log exceptions
    function logWrap( f ) {
      function wf() {
        try {
          var ret = f.apply( this, arguments );
        } catch( e ) {
          console.error( "logWrap: caught exception invoking function: " );
          console.error( e.stack );
          throw e;
        }
        return ret;
      }
      return wf;
    }

    chrome.windows.getAll( {populate: true}, logWrap( syncAndRender ) );
  }
})(jQuery);

/*
document.addEventListener('DOMContentLoaded', function () {
  tabMan.renderPopup();
});

*/
$(document).bind('ready', tabMan.renderPopup );