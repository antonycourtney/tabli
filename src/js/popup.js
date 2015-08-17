'use strict';

var $ = require('jquery');

var _ = require('underscore');

// slight performance hit:
var React = require('react');

var objectAssign = require('object-assign');

var Fluxxor = require('fluxxor');
var TabWindowStore = require('./tabWindowStore.js');
var TabWindow = require('./tabWindow.js');

var FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;

var WINDOW_HEADER_HEIGHT = 22;

var styles = {
  noWrap: { 
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  // This is the container for a single tabWindow, consisting of its
  // header and tabs:
  windowInfo: {
    border: '1px solid #bababa',
    borderRadius: 3,
    marginBottom: 8,
    maxWidth: 345,
    display: 'flex',
    flexDirection: 'column'
  },
  windowInfoHover: {
    boxShadow: '0px 0px 5px 2px #7472ff'
  },
  windowHeader: {
    backgroundColor: '#ebe9eb',
    borderBottom: '1px solid #bababa',
    height: WINDOW_HEADER_HEIGHT,
    maxHeight: WINDOW_HEADER_HEIGHT,
    paddingLeft: 3,
    paddingRight: 3,
    marginBottom: 3,
    display: 'inline-flex',
    // justifyContent: 'space-between',
    alignItems: 'center'
  },
  tabItem: {
    height: 20,
    maxHeight: 20,
    paddingLeft: 3,
    paddingRight: 3,
    display: 'flex',
    alignItems: 'center'
  },
  tabItemHover: {
   backgroundColor: '#dadada'
  },
  windowList: { 
    fontSize: 12,
    // lineHeight: '100%',
    width: 243,
    maxWidth: 243,
    marginTop: 'auto',
    marginBottom: 'auto',
    marginLeft: 3
  },
  tabTitle: {
    width: 275,
    maxWidth: 275
  },  
  expandablePanel: {
    width: '100%',
    position: 'relative',
    minHeight: WINDOW_HEADER_HEIGHT,
    overflow: 'hidden'
  },

  expandablePanelContentClosed: {
    marginTop: '-999px'
  },

  expandablePanelContentOpen: {
    marginTop: 0
  },
  windowExpand: {
    WebkitMaskImage: 'url("../images/triangle-small-4-01.png")',
    backgroundColor: '#606060'
  },
  windowCollapse: {
    WebkitMaskImage: 'url("../images/triangle-small-1-01.png")',
    backgroundColor: '#606060',
  },
  // Hmmm, we use this as a common base for both
  // 
  headerButton: {
    outline: 'none',
    border: 'none',
    backgroundColor: 'transparent',
    backgroundRepeat: 'no-repeat',
    width: 16,
    height: 16,
    marginLeft: 1,
    marginRight: 0 
  },
  favIcon: {
    width: 16,
    height: 16,
    marginRight: 3
  },
  hidden: {
    visibility: 'hidden'
  },
  visible: {
    visibility: 'visible'
  },
  open: {
  },
  closed: {
    color: '#979ca0'    
  },
  tabManagedButton: {
    WebkitMaskImage: 'url("../images/status-9.png")',
    backgroundColor: '#7472ff'
  },
  windowManagedButton: {
    WebkitMaskImage: 'url("../images/Status-9.png")',
    backgroundColor: '#7472ff'
  },
  revertButton: { 
      WebkitMaskImage: 'url("../images/chevron-double-mix-1-01.png")',
      backgroundColor: '#7472ff',
      marginRight: '20px'
  },
  closeButton: {
    background: 'url("../images/interface-80.png")',
  },
  closeButtonHover: {
    background: 'url("../images/interface-94.png")'
  },
  tabList: {
    marginLeft: 0
  },
  spanClosed: {
    color: '#979ca0'
  },
  activeSpan: {
    fontWeight: 'bold',
  },
  windowTitle: {
    fontWeight: 'bold'
  },
  headerCheckBox: {
    width: 13,
    height: 13
  }
}

function m() {
  var res = {};
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i]) {
      objectAssign(res, arguments[i]);
    } else {
      if (typeof(arguments[i])==="undefined") {
        throw new Error("m(): argument " + i + " undefined");
      }
    }
  }
  return res;
}

// expand / contract button for a window
var R_ExpanderButton = React.createClass({
  handleClicked: function(event) {
    var nextState = !this.props.expanded;
    this.props.onClick(nextState);
    event.stopPropagation();
  },
  render: function() {
    var expandStyle = this.props.expanded ? styles.windowCollapse : styles.windowExpand;
    var buttonStyle = m(styles.headerButton,expandStyle);
    return ( 
      <button style={buttonStyle}
              onClick={this.handleClicked} />
    );
  }
});

/**
 * mixin for that maintains a "hovering" state
 * and provides callbacks for mouseOver/mouseOut
 * User of mixin must connect these callbacks to onMouseOver / onMouseOut
 * of appropriate component
 */
var Hoverable = {
  getInitialState: function() {
    return { "hovering": false }
  },

  handleMouseOver: function() {
    this.setState({"hovering": true});
  },

  handleMouseOut: function() {
    this.setState({"hovering": false});
  }  
};

// A button that will merge in hoverStyle when hovered over
var R_HeaderButton = React.createClass({
  mixins: [Hoverable],
  handleClick: function(event) {
    if (this.props.visible) {
      this.props.onClick();
      event.stopPropagation();
    }
  },

  render: function() {
    var visibilityStyle = this.props.visible ? styles.visible : styles.hidden;
    var hoverStyle = (this.state.hovering && this.props.hoverStyle) ? this.props.hoverStyle : null;
    var buttonStyle = m(this.props.baseStyle,visibilityStyle,hoverStyle);
    return (<button style={buttonStyle} title={this.props.title} onClick={this.handleClick}
              onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut} 
            />);
  }  
})


var R_WindowHeader = React.createClass({
  mixins:[Hoverable],

  handleUnmanageClick: function(event) {
    console.log("unamange: ", this.props.tabWindow);
    event.stopPropagation();
  },

  handleManageClick: function(event) {
    console.log("manage: ", this.props.tabWindow);
      event.stopPropagation();
  },

  render: function() {
    var tabWindow = this.props.tabWindow;

    var managed = tabWindow.isManaged();
    var windowTitle = tabWindow.getTitle();

    var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;

    var hoverStyle = this.state.hovering ? styles.visible : styles.hidden;

    var windowCheckItem;

    if( managed ) {
      windowCheckItem =  <button style={m(styles.headerButton,styles.windowManagedButton)} 
                            title="Stop managing this window" onClick={this.handleUnmanageClick} />;
      // TODO: callbacks!
    } else {
      var checkStyle = m(styles.headerButton,hoverStyle,styles.headerCheckBox);
      windowCheckItem = <input style={checkStyle} type="checkbox" 
                          title="Bookmark this window (and all its tabs)" 
                          onClick={this.handleManageClick}
                          />;
    }

    var windowTitle = tabWindow.getTitle();   
    var openStyle = tabWindow.open ? styles.open : styles.closed;
    var titleStyle = m(styles.windowList,styles.noWrap,styles.windowTitle,openStyle);

    var closeStyle = m(styles.headerButton,styles.closeButton);

    // We use hovering in the window header (this.state.hovering) to determine 
    // visibility of both the revert button and close button appearing after the window title.
    var revertButton = <R_HeaderButton baseStyle={m(styles.headerButton,styles.revertButton)} 
                          visible={this.state.hovering && managed && tabWindow.open} 
                          title="Revert to bookmarked tabs (Close other tabs)" 
                          onClick={this.props.onRevert} />

    var closeButton = <R_HeaderButton baseStyle={closeStyle} visible={this.state.hovering} 
                          hoverStyle={styles.closeButtonHover} title="Close Window" 
                          onClick={this.props.onClose} />

    // console.log("WindowHeader: ", windowTitle, openStyle, managed, this.props.expanded);

    return (
      <div style={m(styles.windowHeader,styles.noWrap)}
          onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut} 
          onClick={this.props.onOpen} >
        {windowCheckItem}
        <R_ExpanderButton expanded={this.props.expanded} onClick={this.props.onExpand} />
        <span style={titleStyle}>{windowTitle}</span>
        {revertButton}
        {closeButton}
      </div>
    );
  }
});

var R_TabItem = React.createClass({
  mixins:[Hoverable],

  handleClick: function() {
    var tabWindow = this.props.tabWindow;
    var tab = this.props.tab;
    var tabIndex = this.props.tabIndex;

    // console.log("R_TabItem: handleClick: tab: ", tab);

    this.props.flux.actions.activateTab(tabWindow,tab,tabIndex);
  },

  handleClose: function() {
    this.props.flux.actions.closeTab(this.props.tab);
  }, 

  render: function() {
    var tabWindow = this.props.tabWindow;
    var tab = this.props.tab;

    var managed = tabWindow.isManaged();

    var tabTitle = tab.title;

    // span style depending on whether open or closed window
    var tabOpenStyle = null;

    var tabCheckItem;

    if ( managed ) {
      if( !tab.open ) 
        tabOpenStyle = styles.closed;


      var hoverVisible = this.state.hovering ? styles.visible : styles.hidden;

      if (tab.bookmarked ) {
        tabCheckItem = <button style={m(styles.headerButton,styles.tabManagedButton)} title="Remove bookmark for this tab" />;
        // TODO: callback
      } else {
        tabCheckItem = <input style={m(styles.headerButton,hoverVisible,styles.headerCheckBox)} type="checkbox" title="Bookmark this tab" />;
        //tabCheckItem.onchange = makeTabAddBookmarkHandler( tab );
      }
    } else {
      // insert a spacer:
      tabCheckItem = <div style={styles.headerButton} />;
    }

    var fiSrc=tab.favIconUrl ? tab.favIconUrl : "";
    var tabFavIcon = <img style={styles.favIcon} src={fiSrc} />;

    var tabActiveStyle = tab.active ? styles.activeSpan : null;
    var tabTitleStyles = m(styles.windowList,styles.tabTitle,styles.noWrap,tabOpenStyle,tabActiveStyle);
    var hoverStyle = this.state.hovering ? styles.tabItemHover : null;

    var closeStyle = m(styles.headerButton,styles.closeButton);
    var closeButton = <R_HeaderButton flux={this.props.flux} baseStyle={closeStyle} visible={tab.open && this.state.hovering} 
                          hoverStyle={styles.closeButtonHover} title="Close Tab" 
                          onClick={this.handleClose} />

    return (
      <div style={m(styles.noWrap,styles.tabItem,hoverStyle)}
          onMouseOut={this.handleMouseOut} 
          onMouseOver={this.handleMouseOver}
          onClick={this.handleClick} >
        {tabCheckItem}
        {tabFavIcon}
        <span style={tabTitleStyles}>{tabTitle}</span>
        {closeButton}
      </div>);
  }

});

var R_TabWindow = React.createClass({
  mixins: [Hoverable],

  getInitialState: function() {
    // Note:  We initialize this with null rather than false so that it will follow
    // open / closed state of window
    return ({expanded: null});
  },

  handleOpen: function() {
    console.log("handleOpen", this, this.props);
    this.props.flux.actions.openTabWindow(this.props.tabWindow);
  },

  handleClose: function(event) {
    // console.log("handleClose");
    this.props.flux.actions.closeTabWindow(this.props.tabWindow);
  },

  handleRevert: function(event) {
    // console.log("handleRevert");
    this.props.flux.actions.revertTabWindow(this.props.tabWindow);
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
      var tabItem = <R_TabItem flux={this.props.flux} tabWindow={tabWindow} tab={tabs[i]} key={id} tabIndex={i} />;
      items.push(tabItem);
    };

    var expanded = this.getExpandedState();
    var expandableContentStyle = expanded ? styles.expandablePanelContentOpen : styles.expandablePanelContentClosed;
    var tabListStyle = m(styles.tabList,expandableContentStyle);
    return (
      <div style={tabListStyle}  >
        {items}
      </div>);
  },

  handleExpand: function(expand) {
    this.setState({expanded: expand});
  },

  render: function () {
    var tabWindow = this.props.tabWindow;
    var tabs = tabWindow.getTabItems();

    // console.log("TabWindow.render: ", this.props.flux, this.props);

    /*
     * optimization:  Let's only render tabItems if expanded
     */
    var expanded = this.getExpandedState();
    var tabItems = null;
    if (expanded) {
      tabItems = this.renderTabItems(tabWindow,tabs);
    } else {
      // render empty list of tab items to get -ve margin rollup layout right...
      tabItems = this.renderTabItems(tabWindow,[]);
    }
    var windowHeader = 
      <R_WindowHeader flux={this.props.flux}
          tabWindow={tabWindow} 
          expanded={expanded} 
          onExpand={this.handleExpand} 
          onOpen={this.handleOpen}
          onRevert={this.handleRevert}
          onClose={this.handleClose}
        />;

    var hoverStyle=this.state.hovering ? styles.windowInfoHover : null;
    var windowStyles=m(styles.windowInfo,styles.expandablePanel,hoverStyle);

    return (
      <div style={windowStyles} onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut} >
        {windowHeader}
        {tabItems}
      </div>
      );
  }
});

/*
 * sort criteria for window list:
 *   open windows first, then alpha by title
 */
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

/*
 * top-level element for all tab windows that pulls window list from Flux store
 */
var R_TabWindowList = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin("TabWindowStore")],

  getStateFromFlux: function() {
    var t_start = performance.now();
    var store = this.props.winStore;

    var tabWindows = store.getAll();

    var sortedWindows = tabWindows.sort(windowCmpFn);

    // console.log("R_TabWindowList: ", tabWindows, sortedWindows);

    var fluxState = {
      tabWindows: sortedWindows
    };

    // console.log("getStateFromFlux:");
    // console.log(JSON.stringify(fluxState,null,2));

    var t_finish = performance.now();
    console.log("TabWindowList.getStateFromFlux: ", t_finish - t_start, " ms");
    return fluxState;
  },

  render: function() {
    console.log("TabWindowList: render");
    var focusedWindowElem = [];
    var managedWindows = [];
    var unmanagedWindows = [];

    var tabWindows = this.state.tabWindows;
    for (var i=0; i < tabWindows.length; i++) {
      var tabWindow = tabWindows[i];
      var id = "tabWindow" + i;
      if (tabWindow) {
          var isFocused = tabWindow.isFocused();
          var isManaged = tabWindow.isManaged();

          var windowElem = <R_TabWindow flux={this.props.flux} tabWindow={tabWindow} key={id} />;
          if (isFocused) {
            console.log("TabWindowList.render: current window: ", tabWindow);
            focusedWindowElem = windowElem;
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
        {focusedWindowElem}
        <hr/>
        {managedWindows}
        <hr/>
        {unmanagedWindows}
      </div>
    );    
  }
});

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


/**
 * Call React.render with flux state
 */
function renderPopup(flux,winStore) {

  var t_init = performance.now();
  var elemId = document.getElementById('windowList-region');
  var windowList = <R_TabWindowList flux={flux} winStore={winStore} />;
  React.render( windowList, elemId ); 
  var t_render = performance.now();
  console.log("initial render complete. render time: (", t_render - t_init, " ms)");
} 

/*
 * Perform our React rendering *after* the load event for the popup
 * because we observe that Chrome's http cache will not attempt to
 * re-validate cached resources accessed after the load event.
 *
 * See https://code.google.com/p/chromium/issues/detail?id=511699
 *
 */

var t_start = performance.now();

function postLoadRender() {
  var t_load = performance.now();
  console.log("postLoadRender: (", t_load - t_start, " ms)");
  var bgw = chrome.extension.getBackgroundPage();
  var fluxState = bgw.fluxState;

  fluxState.flux.on("sync",function () {
    console.log("Got sync event -- rendering");
    renderPopup(fluxState.flux,fluxState.winStore);
  });

  console.log("syncing window list...");
  fluxState.flux.actions.syncWindowList();
}

/**
 * Initialize tab manager and flux store, and then render popup from Flux store.
 */
function main() {
  console.log("popup main");

  window.onload = postLoadRender;
}

main();