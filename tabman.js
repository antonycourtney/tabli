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
  
  function renderWindow( managed, windowTitle, tabs ) {
    var headerId = managed ? 'managedWindows' : 'unmanagedWindows';
    var windowItem = makeElem( 'div', { classes: [ "windowInfo" ] } );

    var windowHeader = makeElem( 'div', 
      { classes: [ "nowrap", "singlerow", "oneRowContainer", "windowHeader" ] } );

    var windowTitleItem = makeElem( 'span', 
      { text: windowTitle, 
        classes: [ "windowList", "nowrap", "singlerow", "windowTitle" ],
        parent: windowHeader 
      });

    if( !managed ) {
      var windowManageButton = makeElem( 'button', 
        { classes: [ "manage", "header-button" ],
          attributes: { 'title': "Manage as Subject Window" },
          parent: windowHeader 
        });
      windowManageButton.onclick = function() {
        console.log( "Manage window '" + windowTitle + "'" );
        var subjField = $( "#subject" );
        subjField.val( windowTitle );
        window.setTimeout( function() {
          subjField[0].setSelectionRange( 0, windowTitle.length );
        }, 0 );
        $( "#manage-dialog" ).dialog( "open" );        
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

      var titleItem = makeElem( 'span', 
        { text: tab.title,
          classes: [ "windowList", "nowrap", "singlerow" ],
          parent: tabItem
        });

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

      renderWindow( true, subject, sc.tabs );
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
      
      renderWindow( false, windowTitle, tabs );
    }          
  }

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
              // allFields.removeClass( "ui-state-error" );

/*
              bValid = bValid && checkLength( name, "username", 3, 16 );
              bValid = bValid && checkLength( email, "email", 6, 80 );
              bValid = bValid && checkLength( password, "password", 5, 16 );

              bValid = bValid && checkRegexp( name, /^[a-z]([0-9a-z_])+$/i, "Username may consist of a-z, 0-9, underscores, begin with a letter." );
              // From jquery.validate.js (by joern), contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
              bValid = bValid && checkRegexp( email, /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i, "eg. ui@jquery.com" );
              bValid = bValid && checkRegexp( password, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9" );
*/
              if ( bValid ) {
/*
                $( "#users tbody" ).append( "<tr>" +
                  "<td>" + name.val() + "</td>" +
                  "<td>" + email.val() + "</td>" +
                  "<td>" + password.val() + "</td>" +
                "</tr>" );
*/
                $( this ).dialog( "close" );
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

  function renderPopup() {
    initManageDialog();
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