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
  
  function renderTabWindow( tabWindow ) {
    var managed = tabWindow.managed;
    var windowTitle = tabWindow.getTitle();
    var tabs = tabWindow.chromeWindow.tabs;
    var windowId = tabWindow.chromeWindow.id;

    var headerId = managed ? 'managedWindows' : 'unmanagedWindows';
    var windowItem = makeElem( 'div', { classes: [ "windowInfo" ] } );

    function makeTabClickHandler( windowId, tabId ) {
      function handler() {
        console.log( "clicked on tab for tab id ", tabId );
        chrome.tabs.update( tabId, { active: true } );
        chrome.windows.update( windowId, { focused: true } );        
      };
      return handler;
    }

    var windowHeader = makeElem( 'div', 
      { classes: [ "nowrap", "singlerow", "oneRowContainer", "windowHeader" ] } );

    var windowTitleItem = makeElem( 'span', 
      { text: windowTitle, 
        classes: [ "windowList", "nowrap", "singlerow", "windowTitle" ],
        parent: windowHeader 
      });
    windowTitleItem.onclick = function() {
      console.log( "clicked on window '", windowTitle, "'" );
      chrome.windows.update( windowId, { focused: true } );
    };

    if( managed ) {
      var windowManageButton = makeElem( 'button', 
        { classes: [ "unmanage", "header-button" ],
          attributes: { 'title': "Stop Managing Window" },
          parent: windowHeader 
        });
      windowManageButton.onclick = function() {
        tabWindow.managed = false;
        refreshPopup();
      }
    } else {
      var windowManageButton = makeElem( 'button', 
        { classes: [ "manage", "header-button" ],
          attributes: { 'title': "Create Managed Window" },
          parent: windowHeader 
        });
      windowManageButton.onclick = function() {
        console.log( "Manage window '" + windowTitle + "'" );
        var dlg = $("#manage-dialog" );
        var subjField = $( "#subject" );
        subjField.val( windowTitle );
        window.setTimeout( function() {
          subjField[0].setSelectionRange( 0, windowTitle.length );
        }, 0 );
        dlg.data( "tabWindow", tabWindow );
        dlg.dialog( "open" );        
      }
    }
    var tabListItem = makeElem('div', { classes: [ "tablist" ] } );
    for( var i = 0; i < tabs.length; i++ ) {
      var tab = tabs[ i ];

      var tabItem = makeElem( 'div', 
        { classes: [ "singlerow", "nowrap", "oneRowContainer", "tabinfo" ] } );
      if( tab.favIconUrl ) {
        var tabFavIcon = makeElem('img', { classes: [ "favicon" ], parent: tabItem } );
        tabFavIcon.setAttribute( 'src', tab.favIconUrl );
      }

      var tabTitleClasses = [ "windowList", "nowrap", "singlerow" ];
      if( tab.active ) {
        tabTitleClasses.push( "activeTab" );
      }
      var titleItem = makeElem( 'span', 
        { text: tab.title,
          classes: tabTitleClasses,
          parent: tabItem
        });
      titleItem.onclick = makeTabClickHandler( windowId, tab.id );
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
    chrome.windows.getAll( {populate: true}, function( windowList ) {
      console.log( "in windows.getAll callback:", windowList );
      var tabWindows = bgw.tabMan.syncWindowList( windowList );
      console.log( "tabWindows:", tabWindows );
      for ( var i = 0; i < tabWindows.length; i++ ) {
        var tabWindow = tabWindows[ i ];
        if( tabWindow )
          renderTabWindow( tabWindow );
      }
    } );
  }
})(jQuery);

/*
document.addEventListener('DOMContentLoaded', function () {
  tabMan.renderPopup();
});

*/
$(document).bind('ready', tabMan.renderPopup );