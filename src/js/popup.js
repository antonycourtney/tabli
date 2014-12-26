/** @jsx React.DOM */
var $ = require('jquery');

var _ = require('underscore');

var React = require('react');

var Fluxxor = require('fluxxor');
var constants = require('./constants.js');
var actions = require('./actions.js');
var TabWindowStore = require('./tabWindowStore.js');

var FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;

var bgw = chrome.extension.getBackgroundPage();

// expand / contract button for a window
var R_ExpanderButton = React.createClass({
  handleClicked: function(event) {
    var nextState = !this.props.expanded;
    this.props.onClick(nextState);
    event.stopPropagation();
  },
  render: function() {
    var expandClass = this.props.expanded ? "window-collapse" : "window-expand";
    var buttonClass = "header-button expander " + expandClass;
    return ( 
      <button className={buttonClass}
              onClick={this.handleClicked} />
  );
  }
});

var R_WindowHeader = React.createClass({
  getInitialState: function() {
    return { "hovering": false }
  },

  handleMouseOver: function() {
    this.setState({"hovering": true});
  },

  handleMouseOut: function() {
    this.setState({"hovering": false});
  },

  render: function() {
    var tabWindow = this.props.tabWindow;
    var managed = tabWindow.isManaged();
    var windowTitle = tabWindow.getTitle();
    var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;

    var hoverClass = this.state.hovering ? "hover" : "show-on-hover";

    var windowCheckItem;

    if( managed ) {
      windowCheckItem =  <button className="header-button window-managed" title="Stop managing this window" />;
      // TODO: callbacks!
    } else {
      var checkClass = "header-button " + hoverClass;
      windowCheckItem = <input className={checkClass} type="checkbox" title="Bookmark this window (and all its tabs)" />;
    }

    var windowTitle = tabWindow.getTitle();   
    var openClass = tabWindow.open ? "open" : "closed";
    var titleClass = "windowList nowrap singlerow windowTitle " + openClass;

    var closeClass = "header-button close " + hoverClass;
    var closeButton = <button className={closeClass} title="Close Window" onClick={this.props.onClose} />;

    console.log("WindowHeader: ", windowTitle, openClass, managed, this.props.expanded);

    return (
      <div className="nowrap singlerow oneRowContainer windowHeader"
          onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut} 
          onClick={this.props.onOpen} >
        {windowCheckItem}
        <R_ExpanderButton expanded={this.props.expanded} onClick={this.props.onExpand} />
        <span className={titleClass}>{windowTitle}</span>
        {closeButton}
      </div>
    );
  }
});

var R_TabItem = React.createClass({
  render: function() {
    var tabWindow = this.props.tabWindow;
    var tab = this.props.tab;

    var managed = tabWindow.isManaged();

    var tabTitle = tab.title;

    var openClass = tabWindow.open ? "open" : "closed";
    var tabOpenClass = openClass;

    var tabCheckItem;

    if ( managed ) {
      if( !tab.open )
        tabOpenClass = "closed";


      if (tab.bookmarked ) {
        tabCheckItem = <button className="header-button tab-managed" title="Remove bookmark for this tab" />;
        // TODO: callback
      } else {
        tabCheckItem = <input className="header-button" type="checkbox" title="Bookmark this tab" />;
        //showWhenHoverOn( tabCheckItem, tabItem );
        // TODO: callback
        //tabCheckItem.onchange = makeTabAddBookmarkHandler( tab );
      }
    } else {
      // insert a spacer:
      tabCheckItem = <div className="header-button" />;
    }

    var fiSrc=tab.favIconUrl ? tab.favIconUrl : "";
    var tabFavIcon = <img className="favicon" src={fiSrc} />;

    var tabTitleClasses = [ "windowList", "nowrap", "singlerow", tabOpenClass ];
    if( tab.active ) {
      tabTitleClasses.push( "activeTab" );
    }

    var titleClassStr = tabTitleClasses.join(" ");

    return (
      <div className="singlerow nowrap oneRowContainer tabinfo">
        {tabCheckItem}
        {tabFavIcon}
        <span className={titleClassStr}>{tabTitle}</span>
      </div>);
  }

});

var R_TabWindow = React.createClass({
  getInitialState: function() {
    // Note:  We initialize this with null rather than false so that it will follow
    // open / closed state of window
    return ({expanded: null});
  },

  handleOpen: function() {
    console.log("handleOpen");
    bgw.tabMan.flux.actions.openTabWindow(this.props.tabWindow);
  },

  handleClose: function(event) {
    console.log("handleClose");
    bgw.tabMan.flux.actions.closeTabWindow(this.props.tabWindow);
    event.stopPropagation();
  },

  /* expanded state follows window open/closed state unless it is 
   * explicitly set interactively by the user
   */
  getExpandedState: function() {
    if (this.state.expanded === null) {
      return this.props.tabWindow.open;
    } else {
      return this.state.expanded;
    }
  },

  renderTabItems: function(tabWindow,tabs) {
    var items = [];
    for (var i = 0; i < tabs.length; i++ ) {
      var id = "tabItem-" + i;
      var tabItem = <R_TabItem tabWindow={tabWindow} tab={tabs[i]} key={id} />;
      items.push(tabItem);
    };

    var expanded = this.getExpandedState();
    var expandableContentClass = expanded ? "expandable-panel-content-open" : "expandable-panel-content-closed";
    var tabListClasses="tablist expandable-panel-content " + expandableContentClass;
    return (
      <div className={tabListClasses}>
        {items}
      </div>);
  },

  handleExpand: function(expand) {
    this.setState({expanded: expand});
  },

  render: function () {
    var tabWindow = this.props.tabWindow;
    var tabs = tabWindow.getTabItems();
    var tabItems = this.renderTabItems(tabWindow,tabs);
    var expanded = this.getExpandedState();
    var windowHeader = 
      <R_WindowHeader tabWindow={tabWindow} 
          expanded={expanded} 
          onExpand={this.handleExpand} 
          onOpen={this.handleOpen}
          onClose={this.handleClose}
        />;
    return (
      <div className="windowInfo expandable-panel">
        {windowHeader}
        {tabItems}
      </div>
      );
  }
});

/*
 * top-level element for all tab windows
 */
var R_TabWindowList = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin("TabWindowStore")],

  getInitialState: function() {
    return {};
  },

  getStateFromFlux: function() {
    var store = bgw.tabMan.winStore;

    return {
      tabWindows: store.getAll()
    };
  },

  render: function() {
    console.log("TabWindowList: render");
    var currentWindowElem = [];
    var managedWindows = [];
    var unmanagedWindows = [];

    var currentWindow = this.props.currentWindow;
    var tabWindows = this.state.tabWindows;
    for (var i=0; i < tabWindows.length; i++) {
      var tabWindow = tabWindows[i];
      var id = "tabWindow" + i;
      if (tabWindow) {
          var isCurrent = tabWindow.open && tabWindow.chromeWindow.id == currentWindow.id;
          var isManaged = tabWindow.isManaged();

          var windowElem = <R_TabWindow tabWindow={tabWindow} key={id} />;
          if (isCurrent) {
            currentWindowElem = windowElem;
          } else if (isManaged) {
            managedWindows.push(windowElem);
          } else {
            unmanagedWindows.push(windowElem);
          }
      }
    }

    return (
      <div>
        <hr/>
        {currentWindowElem}
        <hr/>
        {managedWindows}
        <hr/>
        {unmanagedWindows}
      </div>
    );    
  }
}); 

function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function refreshPopup() {
  window.location.href="popup.html";
}

function initManageDialog() {
  /*
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
  */ 
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

/* 
 * Show the target element when hovering on the subject element
 */
 function showWhenHoverOn( target, subject ) {
  target.classList.add( 'show-on-hover' );
  subject.addEventListener( "mouseover", mkChangeClassHandler( target, 'hover', 'show-on-hover' ) );
  subject.addEventListener( "mouseout", mkChangeClassHandler( target, 'show-on-hover', 'hover' ) );
}


function renderTabWindowHeader( tabWindow, current, windowPanelId ) {
  var managed = tabWindow.isManaged();
  var windowTitle = tabWindow.getTitle();
  var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;

  function windowCloseHandler() {
    chrome.windows.remove( windowId, function() {
      tabWindow.open = false;
      if ( !managed ) {
        var windowElem = windowHeader.parentNode;
        var windowParent = windowElem.parentNode;
        windowParent.removeChild( windowElem );
      }
    });
  }

  var windowHeader = makeElem( 'div', 
    { classes: [ "nowrap", "singlerow", "oneRowContainer", "windowHeader" ] } );

  var openClass = tabWindow.open ? "open" : "closed";

  // We want to use a lighter, icon-based checkmark for the checked state, so this
  // is a little involved...

  var windowCheckItem;
  if( managed ) {
    windowCheckItem =  makeElem( 'button',
      { classes: [ "header-button", "window-managed" ],
        parent: windowHeader,
        attributes: { title: "Stop managing this window"}
      } );  
    windowCheckItem.onclick = function() {
      // managed --> unmanaged:
      // TODO: confirmation dialog
      bgw.tabMan.unmanageWindow( tabWindow );
      refreshPopup();                
    };
  } else {
    windowCheckItem = makeElem( 'input',
      { classes: [ "header-button" ], parent: windowHeader,
        attributes: { type: "checkbox", title: "Bookmark this window (and all its tabs)" }
      } );
    showWhenHoverOn( windowCheckItem, windowHeader );
    windowCheckItem.onchange = function() {
      console.log( "toggle manage for '", windowTitle, "'" );
      var checked = windowCheckItem.checked;
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
      }
    }
  }

  var expandButtonClass = tabWindow.open ? "window-collapse" : "window-expand";
  var windowExpandButton = makeElem( 'button',
      { classes: [ "header-button", "expander", expandButtonClass ],
        parent: windowHeader,
        attributes: { title: "Expand window contents"}
      } ); 
  windowExpandButton.onclick = function() {
    console.log( "Got click on expander" );
    var obj = $("#" + windowPanelId + " .expandable-panel-content");
    if (windowExpandButton.classList.contains( "window-expand" ) ) {
      // obj.animate({'margin-top':0}, 500 );
      obj.css('margin-top',"0px" );
      windowExpandButton.classList.remove( "window-expand" );
      windowExpandButton.classList.add( "window-collapse" );
    } else {
      // var ht = parseInt( contentHeight );
      var ht = 500;
      //obj.animate({'margin-top':"-" + (ht + 30) + "px" }, 500 );
      obj.css('margin-top',"-500px");
      windowExpandButton.classList.remove( "window-collapse" );        
      windowExpandButton.classList.add( "window-expand" );
    }
  };

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
      refreshPopup();
    }
  };

  if ( tabWindow.open ) {
    if ( managed ) {
      var windowRevertButton = makeElem( 'button',
        { classes: [ "header-button", "revert-spacer", "revert-window" ],
          parent: windowHeader,
          attributes: { title: "Revert to bookmarked tabs" }
        });
      showWhenHoverOn( windowRevertButton, windowHeader );
      windowRevertButton.onclick = function () {
        bgw.tabMan.revertWindow( tabWindow, refreshPopup );
      }
    } else {
      var revertSpacer = makeElem( 'div',
        { classes: [ "header-button", "revert-spacer" ],
          parent: windowHeader
        } );
    }
    var windowCloseButton = makeElem( 'button',
      { classes: [ "header-button", "close" ],
        parent: windowHeader,
        attributes: { title: "Close Window" }
      });
    showWhenHoverOn( windowCloseButton, windowHeader );
    windowCloseButton.onclick = windowCloseHandler;
  }

  return windowHeader;
}

function renderTabItem( tabWindow, tab, tabIndex ) {
  var managed = tabWindow.isManaged();
  var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;

  function makeTabClickHandler( windowId, tabId, isClosed ) {
    function handler() {
      console.log( "clicked on tab for tab id ", tabId );
      if( tabWindow.open ) {
        if ( !isClosed ) {
          chrome.tabs.update( tabId, { active: true } );
          chrome.windows.update( windowId, { focused: true } );
        } else {
          // restore this bookmarked tab:
          var createOpts = {
            windowId: tabWindow.chromeWindow.id, 
            url: tab.url,
            index: tabIndex,
            active: true
          };
          chrome.tabs.create( createOpts, function () {
            titleItem.classList.remove("closed");
            titleIem.classList.add("open");  
          });
        }
      } else {
        bgw.tabMan.restoreBookmarkWindow( tabWindow );
        refreshPopup();
      }        
    };
    return handler;
  }

  function makeTabCloseHandler( tabElement, windowId, tabId ) {
    function handler() {
      chrome.tabs.remove( tabId );
      tabElement.parentNode.removeChild( tabElement );
    }
    return handler;
  }

  function makeTabRemoveBookmarkHandler( tab ) {
    function handler() {
      console.log( "about to remove bookmark for tab: ", tab );
      chrome.bookmarks.remove( tab.bookmark.id, function () {
        console.log( "succesfully removed bookmark" );
        tabWindow.reloadBookmarkFolder();
        refreshPopup();
      } );
    }
    return handler;
  }

  function makeTabAddBookmarkHandler( tab ) {
    function handler() {
      var tabMark = { parentId: tabWindow.bookmarkFolder.id, title: tab.title, url: tab.url };
      chrome.bookmarks.create( tabMark, function( tabNode ) { 
        console.log( "Successfully added bookmark for tab ',", tab.title, "'" );
        tabWindow.reloadBookmarkFolder();
        refreshPopup();
      } );
    }
    return handler;
  }

  var openClass = tabWindow.open ? "open" : "closed";
  var tabOpenClass = openClass;
  var tabItem = makeElem( 'div', 
    { classes: [ "singlerow", "nowrap", "oneRowContainer", "tabinfo" ] } );

  if ( managed ) {
    if( !tab.open )
      tabOpenClass = "closed";

    var tabCheckItem;

    if (tab.bookmarked ) {
      tabCheckItem = makeElem( 'button',
        { classes: [ "header-button", "tab-managed" ],
          parent: tabItem,
          attributes: { title: "Remove bookmark for this tab"}
        } );
      tabCheckItem.onclick = makeTabRemoveBookmarkHandler( tab );
    } else {
      tabCheckItem = makeElem( 'input',
        { classes: [ "header-button" ], parent: tabItem,
          attributes: { type: "checkbox", title: "Bookmark this tab" }
        } );
      showWhenHoverOn( tabCheckItem, tabItem );
      tabCheckItem.onchange = makeTabAddBookmarkHandler( tab );
    }
  } else {
    var tabCheckSpacer = makeElem( 'div',
      { classes: [ "header-button" ],
        parent: tabItem
      } );

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
  titleItem.onclick = makeTabClickHandler( windowId, tab.id, tabOpenClass === "closed" );

  if ( tabWindow.open ) {
    var closeButton = makeElem( 'button',
      { classes: [ "header-button", "close" ],
        parent: tabItem,
        attributes: { title: "Close Tab" }
      });

    showWhenHoverOn( closeButton, tabItem );

    closeButton.onclick = makeTabCloseHandler( tabItem, windowId, tab.id );
  }

  return tabItem;
}

function renderTabWindow( tabWindow, current, windowPanelId ) {
  var managed = tabWindow.isManaged();
  var windowTitle = tabWindow.getTitle();
  var tabs = tabWindow.getTabItems();
  var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;

  // console.log( "renderTabWindow: title: ", windowTitle, ", tabWindow: ", tabWindow );
  // console.log( "tabs:", tabs );
  var groupHeaderId = current ? 'currentWindow' : ( managed ? 'managedWindows' : 'unmanagedWindows' );
  var windowItem = makeElem( 'div', { classes: [ "windowInfo", "expandable-panel" ], 
    attributes: { id: windowPanelId } } );


  var windowHeader = renderTabWindowHeader( tabWindow, current, windowPanelId, windowItem );

  var expandableContentClass = tabWindow.open ? "expandable-panel-content-open" : "expandable-panel-content-closed";
  var tabListItem = makeElem('div', { classes: [ "tablist", "expandable-panel-content", expandableContentClass ] } );
  for( var i = 0; i < tabs.length; i++ ) {
    var tab = tabs[ i ];

    var tabItem = renderTabItem( tabWindow, tab, i );

    tabListItem.appendChild( tabItem );
  }
  windowItem.appendChild( windowHeader ); 
  windowItem.appendChild( tabListItem );

  var winGroupHeader= document.getElementById( groupHeaderId );
  insertAfter( winGroupHeader, windowItem );

  var panelContent = $("#" + windowPanelId + " .expandable-panel-content");
  // var contentHeight = panelContent.css('height');
  if ( !window.open ) {
    panelContent.css('margin-top',"-500px" );
  }
}

/*
 * initialize global expand / collapse all toggle button
 */
 function initExpandToggle() {
  var toggleElem = $('#expandToggle');
  toggleElem.click( function() {
    /* 
     * Okay, this is where HTML really shows itself as a terrible programming model.
     * We use the presence of the class name to squirrel away the state of the
     * toggle button, and then we manipulate the expand / collapse state of every
     * button and also apply the manipulation needed to expand / collapse every
     * expandable panel, instead of just asking each panel to expand or collapse itself.
     */
    var iconElem = $( this ).find( '.top-button-icon' );
    var collapse = iconElem.hasClass( 'window-collapse' );
    iconElem.toggleClass('window-collapse').toggleClass('window-expand');

    var expandButtons = $( '.expander' );
    var expandPanels = $( '.expandable-panel-content' );
    if ( collapse ) {
      // collapse all windows
      expandButtons.removeClass('window-collapse').addClass('window-expand');
      expandPanels.css('margin-top', '-500px' );
    } else {
      // expand all windows
      expandButtons.addClass('window-collapse').removeClass('window-expand');
      expandPanels.css('margin-top', '0px' );
    }
  });
 }


function windowCmpFn( tabWindowA, tabWindowB ) {
  // open windows first:
  if ( tabWindowA.open != tabWindowB.open ) {
    if ( tabWindowA.open )
      return -1;
    else
      return 1;
  }
  var tA = tabWindowA.getTitle();
  var tB = tabWindowB.getTitle();
  return tA.localeCompare( tB );
}

function renderReact(tabWindows,currentWindow) {
  React.render(
    <R_TabWindowList flux={bgw.tabMan.flux} currentWindow={currentWindow} />,
    document.getElementById('windowList-region')
  );
}

function renderPopup() {
  initManageDialog();
  console.log( "background page:", bgw );
  chrome.bookmarks.getTree( function ( tree ) {
    console.log( "Bookmarks tree: ", tree );
  });

  function syncAndRender( windowList ) {
    chrome.windows.getCurrent( null, function ( currentWindow ) {
      console.log( "in windows.getCurrent:" );
      console.log( "Chrome Windows: ", windowList );
      logWrap( bgw.tabMan.syncWindowList )( windowList );
      console.log("After syncWindowList");
      var tabWindows = bgw.tabMan.winStore.getAll();
      tabWindows.sort( windowCmpFn );
      console.log( "tabWindows:", tabWindows );
      /*
      for ( var i = 0; i < tabWindows.length; i++ ) {
        var tabWindow = tabWindows[ i ];
        var id = "tabWindow" + i;
        if( tabWindow ) {
          var isCurrent = tabWindow.open && tabWindow.chromeWindow.id == currentWindow.id;
          logWrap( function() { renderTabWindow( tabWindow, isCurrent, id ); } )();
        }
      }
      */
      if (tabWindows.length > 0) {
        logWrap( renderReact )( tabWindows, currentWindow );
      }

      initExpandToggle();
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

console.log("hello from popup.js");
console.log("bgw: ", bgw);
renderPopup();
// $(document).bind('ready', tabMan.renderPopup );