'use strict';

import * as $ from 'jquery';
import * as React from 'react';
import * as actions from './actions';
import * as Immutable from 'immutable';
import * as searchOps from './searchOps';
import {refUpdater} from 'oneref';
import * as TabWindow from './tabWindow';

// import * as objectAssign from 'object-assign';
import 'babel/polyfill';

import {addons} from 'react/addons'; 
const {PureRenderMixin, Perf} = addons;

var WINDOW_HEADER_HEIGHT = 22;

var styles = {
  noWrap: { 
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  // This is the container for a single tabWindow, consisting of its
  // header and tabs:
  tabWindow: {
    border: '1px solid #bababa',
    borderRadius: 3,
    marginBottom: 8,
    maxWidth: 345,
    display: 'flex',
    flexDirection: 'column'
  },
  tabWindowSelected: {
    boxShadow: '0px 0px 5px 2px #7472ff'
  },
  windowHeader: {
    backgroundColor: '#ebe9eb',
    borderBottom: '1px solid #bababa',
    height: WINDOW_HEADER_HEIGHT,
    maxHeight: WINDOW_HEADER_HEIGHT,
    paddingLeft: 3,
    paddingRight: 3,
    // marginBottom: 3,
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
  tabItemSelected: {
   backgroundColor: '#dadada'
  },
  tabItemHover: {
   // backgroundColor: '#dadada'
   borderTop: '1px solid #cacaca',
   borderBottom: '1px solid #cacaca'
  },
  text: {
    fontSize: 12,
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
    marginRight: 1 
  },
  dialogButton: {
    outline: 'none',
    border: 'none',
    marginLeft: 4,
    marginRight: 4,
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 3,
    verticalAlign: 'center',
    display: 'flex',
    fontWeight: 600,
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: '#e0e1e2',
    color: 'rgba(0,0,0,.6)'
  },
  primaryButton: {
    backgroundColor: '#1678c2',
    color: '#fff',

  },
  spacer: {
    // backgroundColor: 'red', // for debugging
    // height: 8, // for debugging
    flex: 1
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
  audibleIcon: {
    WebkitMaskImage: 'url("../images/Multimedia-64.png")',
    backgroundColor: '#505050'
  },  
  /* checkboxes seems to obey width and height, but ignore padding
   * so we'll hack margin instead.
   */
  tabCheckItem: {
    width: 13,
    height: 13,
    margin: '3px 3px 3px 3px'
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
    WebkitMaskImage: 'url("../images/interface-77.png")',
    backgroundColor: '#888888'
  },
  closeButtonHover: {
    WebkitMaskImage: 'url("../images/interface-74.png")',
    backgroundColor: '#000000'
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
    fontWeight: 'bold',
    width: 243,
    maxWidth: 243
  },
  modalTitle: {
    fontWeight: 'bold',
    paddingLeft: 7,
    maxWidth: 243
  },
  headerCheckBox: {
    width: 13,
    height: 13
  },
  modalOverlay: { 
    position: 'fixed',
    top: 0,
    left: 0,
    background:'rgba(0,0,0,0.6)',
    zIndex: 5,
    width: '100%',
    height: '100%',
    display: 'flex'
  },
  modalContainer: {
    width: 300,
    position: 'relative',
    zIndex: 10,
    borderRadius: 3,
    background: '#fff',
    margin: 'auto',
    border: '1px solid #bababa',   
    display: 'flex',
    flexDirection: 'column'     
  },
  simpleTabContainer: {
    width: 250,
    marginLeft: 8,
    marginRight: 8,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 4,
    paddingBottom: 4,
    border: '1px solid #bababa',
    borderRadius: 3       
  },
  modalBodyContainer: {
    display: 'flex',
    minHeight: 50,
    flexDirection: 'column'
  },
  centerContents: {
    margin: 'auto'
  },
  dialogInfo: {
    borderBottom: '1px solid #bababa',
    paddingLeft: 3
  },
  dialogInfoContents: {
    marginLeft: 10,
    marginTop: 4,
    marginBottom: 10
  },
  windowListSection: {
    borderBottom: '1px solid #bababa',
    paddingLeft: 10,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 4
  },
  windowListSectionHeader: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  searchBar: {    
  },
  searchInput: {
    width: '100%'
  },
  alignRight: {
    display: 'flex',
    justifyContent: 'flex-end'
  }
}

/**
 * Object merge operator from the original css-in-js presentation
 */
function m() {

  var res = {};
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i]) {
      Object.assign(res, arguments[i]);
    } else {
      if (typeof(arguments[i])==="undefined") {
        throw new Error("m(): argument " + i + " undefined");
      }
    }
  }
  return res;
}

// expand / contract button for a window
var ExpanderButton = React.createClass({
  mixins: [PureRenderMixin],
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

const buttonSpacer = <div style={styles.headerButton} />;

// A button that will merge in hoverStyle when hovered over
var HeaderButton = React.createClass({
  mixins: [Hoverable,PureRenderMixin],
  handleClick: function(event) {
    if (this.props.visible) {
      this.props.onClick(event);
      event.stopPropagation();
    }
  },

  render: function() {
    /* We render a LOT of these, and React profiler indicates we're spending a lot of time here
     * and mostly visible will be false (due to not hovering in parent component, so let's
     * try to fast path the non-visible case with a simple spacer
     */
    if (!this.props.visible) {
      return buttonSpacer;
    }
    // const visibilityStyle = this.props.visible ? styles.visible : styles.hidden;
    var hoverStyle = (this.state.hovering && this.props.hoverStyle) ? this.props.hoverStyle : null;
    var buttonStyle = m(this.props.baseStyle,hoverStyle);
    return (<button style={buttonStyle} title={this.props.title} onClick={this.handleClick}
              onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut} 
            />);
  }  
})


var WindowHeader = React.createClass({
  mixins:[Hoverable,PureRenderMixin],


  handleUnmanageClick: function(event) {
    console.log("unamange: ", this.props.tabWindow);
    event.preventDefault();
    const archiveFolderId = this.props.winStore.archiveFolderId;
    actions.unmanageWindow(archiveFolderId,this.props.tabWindow,this.props.storeUpdateHandler);
    event.stopPropagation();
  },

  handleManageClick: function(event) {
    console.log("manage: ", this.props.tabWindow);
    event.preventDefault();
    var tabWindow = this.props.tabWindow;
    var appComponent = this.props.appComponent;
    appComponent.openSaveModal(tabWindow);

    event.stopPropagation();
  },

  render: function() {
    var tabWindow = this.props.tabWindow;

    var managed = tabWindow.saved;
    var windowTitle = tabWindow.title;

    var windowId = tabWindow.openWindowId;

    var hoverStyle = this.state.hovering ? styles.visible : styles.hidden;

    var windowCheckItem;

    if( managed ) {
      windowCheckItem =  <button style={m(styles.headerButton,styles.windowManagedButton)} 
                            title="Stop managing this window" onClick={this.handleUnmanageClick} />;
    } else {
      var checkStyle = m(styles.headerButton,hoverStyle,styles.headerCheckBox);
      windowCheckItem = <input style={checkStyle} type="checkbox" 
                          title="Save all tabs in this window" 
                          onClick={this.handleManageClick}
                          ref="managedCheckbox"
                          value={false}
                          />;
    }

    var openStyle = tabWindow.open ? styles.open : styles.closed;
    var titleStyle = m(styles.text,styles.noWrap,styles.windowTitle,openStyle);
    var closeStyle = m(styles.headerButton,styles.closeButton);

    // We use hovering in the window header (this.state.hovering) to determine 
    // visibility of both the revert button and close button appearing after the window title.

    var revertButton = <HeaderButton baseStyle={m(styles.headerButton,styles.revertButton)} 
                          // visible={this.state.hovering && managed && tabWindow.open} 
                          visible={managed && tabWindow.open}
                          title="Revert to bookmarked tabs (Close other tabs)" 
                          onClick={this.props.onRevert} />

    var closeButton = <HeaderButton baseStyle={closeStyle}
                          visible={this.state.hovering && tabWindow.open} 
                          hoverStyle={styles.closeButtonHover} title="Close Window" 
                          onClick={this.props.onClose} />

    // console.log("WindowHeader: ", windowTitle, openStyle, managed, this.props.expanded);

    return (
      <div style={m(styles.windowHeader,styles.noWrap)}
          onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut} 
          onClick={this.props.onOpen} >
        {windowCheckItem}
        <ExpanderButton winStore={this.props.winStore} expanded={this.props.expanded} onClick={this.props.onExpand} />
        <span style={titleStyle}>{windowTitle}</span>
        {revertButton}
        <div style={styles.spacer} />        
        {closeButton}
      </div>
    );
  }
});

var TabItem = React.createClass({
  mixins:[Hoverable],

  handleClick: function() {
    var tabWindow = this.props.tabWindow;
    var tab = this.props.tab;
    var tabIndex = this.props.tabIndex;
    // console.log("TabItem: handleClick: tab: ", tab);

    actions.activateTab(tabWindow,tab,tabIndex,this.props.storeUpdateHandler);
  },

  handleClose: function() {
    if (!this.props.tabWindow.open)
      return;
    if (!this.props.tab.open)
      return;
    var tabId = this.props.tab.openTabId;
    actions.closeTab(this.props.tabWindow,tabId,this.props.storeUpdateHandler);
  }, 

  handleBookmarkTabItem: function(event) {
    event.stopPropagation();
    console.log("bookmark tab: ", this.props.tab.toJS());
    actions.saveTab(this.props.tabWindow,this.props.tab,this.props.storeUpdateHandler);
  },

  handleUnbookmarkTabItem: function(event) {
    event.stopPropagation();
    console.log("unbookmark tab: ", this.props.tab.toJS());
    actions.unsaveTab(this.props.tabWindow,this.props.tab,this.props.storeUpdateHandler);
  },


  render: function() {
    var tabWindow = this.props.tabWindow;
    var tab = this.props.tab;

    var managed = tabWindow.saved;

    var tabTitle = tab.title;

    // span style depending on whether open or closed window
    var tabOpenStyle = null;

    var tabCheckItem;

    if ( managed ) {
      if( !tab.open ) 
        tabOpenStyle = styles.closed;


      var hoverVisible = this.state.hovering ? styles.visible : styles.hidden;

      if (tab.saved ) {
        tabCheckItem = <button style={m(styles.headerButton,styles.tabManagedButton)} 
                              title="Remove bookmark for this tab" 
                              onClick={this.handleUnbookmarkTabItem}
                              />;
        // TODO: callback
      } else {
        // We used to include headerCheckbox, but that only set width and height
        // to something to 13x13; we want 16x16 from headerButton
        tabCheckItem = <input style={m(styles.headerButton,hoverVisible,styles.tabCheckItem)} 
                              type="checkbox" 
                              title="Bookmark this tab" 
                              onClick={this.handleBookmarkTabItem}
                              />;
      }
    } else {
      // insert a spacer:
      tabCheckItem = <div style={styles.headerButton} />;
    }

    var fiSrc=tab.favIconUrl ? tab.favIconUrl : "";
    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf("chrome://theme/")==0) {
      fiSrc="";
    }

    var tabFavIcon = <img style={styles.favIcon} src={fiSrc} />;

    var tabActiveStyle = tab.active ? styles.activeSpan : null;
    var tabTitleStyles = m(styles.text,styles.tabTitle,styles.noWrap,tabOpenStyle,tabActiveStyle);
    var hoverStyle = this.state.hovering ? styles.tabItemHover : null;
    var selectedStyle = this.props.isSelected ? styles.tabItemSelected : null;

    const audibleIcon = tab.audible ? <div style={m(styles.headerButton,styles.audibleIcon)} /> : null;

    var closeStyle = m(styles.headerButton,styles.closeButton);
    var closeButton = <HeaderButton baseStyle={closeStyle} visible={tab.open && this.state.hovering} 
                          hoverStyle={styles.closeButtonHover} title="Close Tab" 
                          onClick={this.handleClose} />

    return (
      <div style={m(styles.noWrap,styles.tabItem,hoverStyle,selectedStyle)}
          onMouseOut={this.handleMouseOut} 
          onMouseOver={this.handleMouseOver}
          onClick={this.handleClick} >
        {tabCheckItem}
        {tabFavIcon}
        <span style={tabTitleStyles}>{tabTitle}</span>
        <div style={styles.spacer} />
        {audibleIcon}
        {closeButton}
      </div>);
  }

});

var FilteredTabWindow = React.createClass({
  mixins: [Hoverable],

  getInitialState: function() {
    // Note:  We initialize this with null rather than false so that it will follow
    // open / closed state of window
    return ({expanded: null});
  },

  handleOpen: function() {
    console.log("handleOpen", this, this.props);
    actions.openWindow(this.props.filteredTabWindow.tabWindow,this.props.storeUpdateHandler);
  },

  handleClose: function(event) {
    // console.log("handleClose");
    actions.closeWindow(this.props.filteredTabWindow.tabWindow,this.props.storeUpdateHandler);
  },

  handleRevert: function(event) {
    var appComponent = this.props.appComponent;
    appComponent.openRevertModal(this.props.filteredTabWindow);  
  },


  /* expanded state follows window open/closed state unless it is 
   * explicitly set interactively by the user
   */
  getExpandedState: function() {
    if (this.state.expanded === null) {
      return this.props.filteredTabWindow.tabWindow.open;
    } else {
      return this.state.expanded;
    }
  },

  renderTabItems: function(tabWindow,tabs) {
    /*
     * We tried explicitly checking for expanded state and
     * returning null if not expanded, but (somewhat surprisingly) it
     * was no faster, even with dozens of hidden tabs
     */
    var items = [];
    for (var i = 0; i < tabs.count(); i++ ) {
      var id = "tabItem-" + i;
      const isSelected = (i==this.props.selectedTabIndex);
      var tabItem = <TabItem winStore={this.props.winStore}
                      storeUpdateHandler={this.props.storeUpdateHandler}  
                      tabWindow={tabWindow} 
                      tab={tabs.get(i)} 
                      key={id} 
                      tabIndex={i} 
                      isSelected={isSelected}
                      appComponent={this.props.appComponent}
                       />;
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


  componentWillReceiveProps: function(nextProps) {
    if (nextProps.isSelected && !this.props.isSelected) {
      // scroll div for this window into view:
      React.findDOMNode(this.refs.windowDiv).scrollIntoViewIfNeeded();
    }
  },

  render: function () {
    var filteredTabWindow = this.props.filteredTabWindow;
    var tabWindow = filteredTabWindow.tabWindow;
    var tabs;
    if (this.props.searchStr.length==0) {
      tabs = tabWindow.tabItems;
    } else {
      tabs = filteredTabWindow.itemMatches.map((fti) => fti.tabItem);
    }

    /*
     * optimization:  Let's only render tabItems if expanded
     */
    var expanded = this.getExpandedState();
    var tabItems = null;
    if (expanded) {
      tabItems = this.renderTabItems(tabWindow,tabs);
    } else {
      // render empty list of tab items to get -ve margin rollup layout right...
      tabItems = this.renderTabItems(tabWindow,Immutable.Seq());
    }

    var windowHeader = 
      <WindowHeader winStore={this.props.winStore}
          storeUpdateHandler={this.props.storeUpdateHandler} 
          tabWindow={tabWindow} 
          expanded={expanded} 
          onExpand={this.handleExpand} 
          onOpen={this.handleOpen}
          onRevert={this.handleRevert}
          onClose={this.handleClose}
          appComponent={this.props.appComponent}
        />;

    var selectedStyle=this.props.isSelected ? styles.tabWindowSelected : null;
    var windowStyles=m(styles.tabWindow,styles.expandablePanel,selectedStyle);

    return (
      <div ref="windowDiv" style={windowStyles} onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut} >
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
  // focused window very first:
  const fA = tabWindowA.focused;
  const fB = tabWindowB.focused;
  if (fA != fB) {
    if (fA)
      return -1;
    else
      return 1;
  }

  // open windows first:
  if ( tabWindowA.open != tabWindowB.open ) {
    if ( tabWindowA.open )
      return -1;
    else
      return 1;
  }
  var tA = tabWindowA.title;
  var tB = tabWindowB.title;
  return tA.localeCompare( tB );
}

var WindowListSection = React.createClass({
  render() {
    var header = null;
    if (this.props.title) {
      header = (
        <div style={styles.windowListSectionHeader}>
          <span>{this.props.title}</span>
        </div>
      );
    }

    return (
      <div style={styles.windowListSection}>
        {header}
        <div>
          {this.props.children}
        </div>
      </div>
    );
  }
});

const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_TAB = 9;

var SearchBar = React.createClass({
  handleChange() {
    const searchStr=this.refs.searchInput.getDOMNode().value;
    this.props.onSearchInput(searchStr);
  },

  handleKeyDown(e) {
    // console.log("handleKeyDown: ", _.omit(e,_.isObject));
    if (e.keyCode===KEY_UP) {
      if (this.props.onSearchUp) {
        e.preventDefault();
        this.props.onSearchUp(e.ctrlKey);
      }
    }
    if (e.keyCode===KEY_DOWN) {
      if (this.props.onSearchDown) {
        e.preventDefault();
        this.props.onSearchDown(e.ctrlKey);
      }
    }
    if (e.keyCode===KEY_TAB) {
      // We need to determine if it was forward or backwards tab:
      // N.B. we still try and use e.ctrlKey to determine paged
      // nav, but that key combo consumed by Chrome before we see it...
      if (this.props.onSearchUp && this.props.onSearchDown) {
        e.preventDefault();
        if (e.shiftKey) {
          this.props.onSearchUp(e.ctrlKey);
        } else {
          this.props.onSearchDown(e.ctrlKey);
        }
      }
    }
    if (e.keyCode==KEY_ENTER) {
      if (this.props.onSearchEnter) {
        e.preventDefault();
        this.props.onSearchEnter();
      }
    }
  },

  render() {
    return (
      <div style={styles.searchBar}>
        <input style={styles.searchInput} type="text" ref="searchInput" id="searchBox" placeholder="Search..." 
          onChange={this.handleChange} onKeyDown={this.handleKeyDown} />
      </div>
    );  
  }
});

var TabWindowList = React.createClass({


  render: function() {
    var focusedWindowElem = [];
    var openWindows = [];
    var savedWindows = [];

    var filteredWindows = this.props.filteredWindows;    
    for (var i=0; i < filteredWindows.length; i++) {
      var filteredTabWindow = filteredWindows[i];
      var tabWindow = filteredTabWindow.tabWindow;
      var id = "tabWindow" + i;
      var isOpen = tabWindow.open;
      var isFocused = tabWindow.focused;
      var isSelected = (i==this.props.selectedWindowIndex);
      const selectedTabIndex = isSelected ? this.props.selectedTabIndex : -1;
      var windowElem = <FilteredTabWindow winStore={this.props.winStore}
                          storeUpdateHandler={this.props.storeUpdateHandler}  
                          filteredTabWindow={filteredTabWindow} key={id} 
                          searchStr={this.props.searchStr} 
                          searchRE={this.props.searchRE}
                          isSelected={isSelected}                          
                          selectedTabIndex={selectedTabIndex}
                          appComponent={this.props.appComponent}
                          />;
      if (isFocused) {
        focusedWindowElem = windowElem;
      } else if (isOpen) {
        openWindows.push(windowElem);
      } else {
        savedWindows.push(windowElem);
      }
    }

    var savedSection = null;
    if (savedWindows.length > 0) {
      savedSection = (
        <WindowListSection title="Saved Closed Windows">
          {savedWindows}
        </WindowListSection>
      );
    }


    return (
      <div>
        <WindowListSection title="Current Window">
          {focusedWindowElem}
        </WindowListSection>
        <WindowListSection title="Other Open Windows">
          {openWindows}
        </WindowListSection>
        {savedSection}
      </div>
    );    
  }
});

/*
 * generic modal dialog component
 */
var Modal = React.createClass({

  handleClose: function(event) {
    console.log("Modal.handleClose: ", event, arguments);
    event.preventDefault();
    this.props.onClose(event);
  },

  render() {
    var modalDiv = null;

    var titleStyle = m(styles.text,styles.noWrap,styles.modalTitle,styles.open);
    var closeStyle = m(styles.headerButton,styles.closeButton);
    var closeButton = <HeaderButton baseStyle={closeStyle} visible={true} 
                          hoverStyle={styles.closeButtonHover} title="Close Window" 
                          onClick={this.handleClose} />
    modalDiv = (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContainer}>
          <div style={m(styles.windowHeader,styles.noWrap)} >
            <span style={titleStyle}>{this.props.title}</span>
            <div style={styles.spacer} />
            {closeButton}
          </div>
          {this.props.children}
        </div>
      </div> );
    return modalDiv;
  },

  componentDidMount() {
    console.log("Modal: componentDidMount");
  }
});

var ModalInfo = React.createClass({
  render() {
    return (
      <div style={styles.dialogInfo}>      
        <div style={styles.dialogInfoContents}>
          {this.props.children}
        </div>
      </div>
    );
  }
});

var ModalBody = React.createClass({
  render() {
    return (
      <div style={styles.modalBodyContainer}>
        {this.props.children}
      </div>
    );
  }
});

/*
 * Modal dialog for reverting a bookmarked window
 */
var RevertModal = React.createClass({
  handleKeyDown(e) {
    if (e.keyCode==KEY_ESC) {
      // ESC key
      e.preventDefault();
      this.props.onClose(e);
    } else if (e.keyCode==KEY_ENTER) {
      this.handleSubmit(e);
    }
  },
  handleSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.props.tabWindow);
  },
  renderItem(tabItem) {
    var fiSrc=tabItem.favIconUrl ? tabItem.favIconUrl : "";
    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf("chrome://theme/")==0) {
      fiSrc="";
    }
    var tabFavIcon = <img style={styles.favIcon} src={fiSrc} />;
    const tabOpenStyle = tabItem.open ? null : styles.closed;
    var tabActiveStyle = tabItem.active ? styles.activeSpan : null;
    var tabTitleStyles = m(styles.text,styles.tabTitle,styles.noWrap,tabOpenStyle,tabActiveStyle);
    return(
        <div style={styles.noWrap} >
          {tabFavIcon}
          <span style={tabTitleStyles}>{tabItem.title}</span>
          <div style={styles.spacer} />
        </div>
      );    
  },
  renderTabItems(tabItems) {
    const itemElems = tabItems.map(this.renderItem);
    return (
      <div style={styles.tabList}>
        {itemElems}
      </div>
    );  
  },
  render() {
    const tabWindow = this.props.tabWindow;
    const revertedTabWindow = TabWindow.removeOpenWindowState(tabWindow);
    const savedUrlsSet = Immutable.Set(revertedTabWindow.tabItems.map((ti) => ti.url));

    const itemsToClose = tabWindow.tabItems.filter((ti) => !(savedUrlsSet.has(ti.url)));
    const closeItemsElem = this.renderTabItems(itemsToClose);

    const itemsToReload = tabWindow.tabItems.filter((ti) => savedUrlsSet.has(ti.url));
    const reloadItemsElem = this.renderTabItems(itemsToReload);

    var closeSection = null;
    if (itemsToClose.count() > 0) {
      closeSection = (
        <div>
          <p>The following tabs will be closed:</p>
          <div style={styles.simpleTabContainer}>
            {closeItemsElem}
          </div>
          <br/>
        </div>
        );
    }
    return (
      <Modal title="Revert Saved Window?" onClose={this.props.onClose} >
        <ModalBody>
          <div style={styles.dialogInfoContents}>
            {closeSection}
            <p>The following tabs will be reloaded:</p>
              <div style={styles.simpleTabContainer}>
                {reloadItemsElem}
              </div>
            <br/>
            <p>This action can not be undone.</p>
          </div>
          <div style={m(styles.alignRight)}>
            <div style={m(styles.dialogButton,styles.primaryButton)} 
                 onClick={this.handleSubmit}
                 ref="okButton"
                 tabIndex={0}
                 onKeyDown={this.handleKeyDown}>OK</div>  
            <div style={styles.dialogButton}
                  onClick={this.props.onClose}
                  tabIndex={0}
                  >Cancel</div>  
          </div>
        </ModalBody>      
      </Modal>
    );
  },

  /* HACK - get focus to the OK button, because tabIndex getting ignored. */
  componentDidMount() {
    console.log("revertModal: did mount");
    this.refs.okButton.getDOMNode().focus();
  }


});

var SaveModal = React.createClass({
  handleKeyDown(e) {
    if (e.keyCode==KEY_ESC) {
      // ESC key
      e.preventDefault();
      this.props.onClose(e);
    }
  },
  handleSubmit(e) {
    e.preventDefault();
    const titleStr = this.refs.titleInput.getDOMNode().value;
    console.log("handleSubmit: title: ", titleStr);
    this.props.onSubmit(titleStr);
  },
  render() {
    return (
      <Modal title="Save Tabs" focusRef="titleInput" onClose={this.props.onClose} >
        <ModalInfo>
          <span>Save all tabs in this window</span> 
        </ModalInfo>
        <ModalBody>
          <div style={styles.centerContents}>
            <form className="dialog-form" onSubmit={this.handleSubmit}>
              <fieldset>
                <label htmlFor="title">Window Title</label>
                <input type="text" name="title" id="title" ref="titleInput"
                  autoFocus={true}
                  defaultValue={this.props.initialTitle}
                  onKeyDown={this.handleKeyDown}
                 />
              </fieldset>
            </form>
          </div>
        </ModalBody>      
      </Modal>
    );
  },

  componentDidMount() {
    console.log("SaveModal: did mount");
    var titleElem = this.refs.titleInput.getDOMNode();
    /* titleElem.val(this.props.initialTitle); */
    const titleLen = this.props.initialTitle.length;
    window.setTimeout( function() {
      console.log("timer func");
      titleElem.setSelectionRange( 0, titleLen);
    }, 0 );
  }

});

function tabCount(searchStr,filteredTabWindow) {
  var ret = (searchStr.length > 0) ? filteredTabWindow.itemMatches.count() : filteredTabWindow.tabWindow.tabItems.count();
  return ret;
}

function selectedTab(filteredTabWindow,searchStr,tabIndex) {
  if (searchStr.length==0) {
    var tabWindow = filteredTabWindow.tabWindow;
    var tabItem = tabWindow.tabItems.get(tabIndex);
    return tabItem;
  } else {
    var filteredItem = filteredTabWindow.itemMatches.get(tabIndex);
    return filteredItem.tabItem;
  }
}


/**
 * An element that manages the selection.
 *
 * We want this as a distinct element from its parent TabMan, because it does local state management
 * and validation that should happen with respect to the (already calculated) props containing
 * filtered windows that we receive from above
 */
var SelectablePopup = React.createClass({
  getInitialState: function() {
    return {
      selectedWindowIndex: 0,
      selectedTabIndex: 0
    };
  },

  handlePrevSelection: function(byPage) {
    if (this.props.filteredWindows.length===0)
      return;
    const selectedWindow=this.props.filteredWindows[this.state.selectedWindowIndex];
    // const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count();

    if (selectedWindow.tabWindow.open && this.state.selectedTabIndex > 0 && !byPage) {
      this.setState({ selectedTabIndex: this.state.selectedTabIndex - 1 });
    } else {
      // Already on first tab, try to back up to previous window:
      if (this.state.selectedWindowIndex > 0 ) {
        const prevWindowIndex = this.state.selectedWindowIndex - 1;
        const prevWindow = this.props.filteredWindows[prevWindowIndex];
        const prevTabCount = (this.props.searchStr.length > 0) ? prevWindow.itemMatches.count() : prevWindow.tabWindow.tabItems.count();

        this.setState({ selectedWindowIndex: prevWindowIndex, selectedTabIndex: prevTabCount - 1 });
      }
    }
  },

  handleNextSelection: function(byPage) {
    if (this.props.filteredWindows.length===0)
      return;
    const selectedWindow=this.props.filteredWindows[this.state.selectedWindowIndex];
    const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count();

    // We'd prefer to use expanded state of window rather then open/closed state,
    // but that's hidden in the component...
    if (selectedWindow.tabWindow.open && (this.state.selectedTabIndex + 1) < tabCount && !byPage) {
      this.setState({ selectedTabIndex: this.state.selectedTabIndex + 1 });
    } else {
      // Already on last tab, try to advance to next window:
      if ((this.state.selectedWindowIndex + 1) < this.props.filteredWindows.length) {
        this.setState({ selectedWindowIndex: this.state.selectedWindowIndex + 1, selectedTabIndex: 0 });
      }
    }
  },

  handleSelectionEnter: function() {
    if (this.props.filteredWindows.length==0)
      return;

    // TODO: deal with this.state.selectedTabIndex==-1

    const selectedWindow=this.props.filteredWindows[this.state.selectedWindowIndex];
    const selectedTabItem=selectedTab(selectedWindow,this.props.searchStr,this.state.selectedTabIndex);
    console.log("opening: ", selectedTabItem.toJS());
    actions.activateTab(selectedWindow.tabWindow,selectedTabItem,this.state.selectedTabIndex);
  },

  componentWillReceiveProps: function(nextProps) {
    var selectedWindowIndex = this.state.selectedWindowIndex;
    var selectedTabIndex = this.state.selectedTabIndex;
    var nextFilteredWindows = nextProps.filteredWindows;

    if (selectedWindowIndex >= nextFilteredWindows.length) {
      if (nextFilteredWindows.length==0) {
        this.setState({selectedWindowIndex: 0, selectedTabIndex: -1});
        console.log("resetting indices");
      } else {
        var lastWindow = nextFilteredWindows[nextFilteredWindows.length - 1];
        this.setState({selectedWindowIndex: nextFilteredWindows.length - 1, selectedTabIndex: tabCount(this.props.searchStr,lastWindow) - 1});
      }
    } else {
      var nextSelectedWindow = nextFilteredWindows[selectedWindowIndex];
      var nextTabIndex = Math.min(this.state.selectedTabIndex,tabCount(this.props.searchStr,nextSelectedWindow) - 1);
      this.setState({selectedTabIndex: nextTabIndex});
    }
  }, 

  render: function() {
    return (
      <div>
        <WindowListSection>
          <SearchBar onSearchInput={this.props.onSearchInput} 
                     onSearchUp={this.handlePrevSelection} 
                     onSearchDown={this.handleNextSelection}
                     onSearchEnter={this.handleSelectionEnter}
                     />
        </WindowListSection>        
        <TabWindowList winStore={this.props.winStore}
                         storeUpdateHandler={this.props.storeUpdateHandler} 
                         filteredWindows={this.props.filteredWindows} 
                         appComponent={this.props.appComponent}
                         searchStr={this.props.searchStr}
                         searchRE={this.props.searchRE}
                         selectedWindowIndex={this.state.selectedWindowIndex}
                         selectedTabIndex={this.state.selectedTabIndex}
                         />
      </div> 
    );
  }
});

var TabMan = React.createClass({  
  storeAsState: function(winStore) {
    var tabWindows = winStore.getAll();

    var sortedWindows = tabWindows.sort(windowCmpFn);

    return {
      winStore: winStore,
      sortedWindows
    };
  },

  getInitialState: function() {
    var st = this.storeAsState(this.props.initialWinStore);

    const w0 = st.sortedWindows[0];

    st.saveModalIsOpen = false;
    st.revertModalIsOpen = false;
    st.revertTabWindow = null;
    st.searchStr = '';
    st.searchRE = null;
    return st;
  },

  handleSearchInput(searchStr) {
    searchStr = searchStr.trim();

    var searchRE = null;
    if (searchStr.length > 0) {
      searchRE = new RegExp(searchStr,"i");
    }
    console.log("search input: '" + searchStr + "'");
    this.setState({ searchStr, searchRE });
  },

  openSaveModal(tabWindow) {
    const initialTitle = tabWindow.title;
    this.setState({saveModalIsOpen: true, saveInitialTitle: initialTitle, saveTabWindow: tabWindow} );
  },

  closeSaveModal() {
    this.setState({saveModalIsOpen: false});
  },

  openRevertModal(filteredTabWindow) {
    this.setState({revertModalIsOpen: true, revertTabWindow: filteredTabWindow.tabWindow} );
  },

  closeRevertModal() {
    this.setState({revertModalIsOpen: false, revertTabWindow: null});
  },


  /* handler for save modal */
  doSave(titleStr) {
    const storeRef = this.props.storeRef;
    const tabliFolderId = storeRef.getValue().folderId;
    actions.manageWindow(tabliFolderId,this.state.saveTabWindow,titleStr,refUpdater(storeRef));      
    this.closeSaveModal();
  },

  doRevert(tabWindow) {
    const updateHandler = refUpdater(this.props.storeRef);
    actions.revertWindow(this.state.revertTabWindow,updateHandler);
    this.closeRevertModal();    
  },

  /* render save modal (or not) based on this.state.saveModalIsOpen */
  renderSaveModal() {
    var modal = null;
    if (this.state.saveModalIsOpen) {
      modal = <SaveModal initialTitle={this.state.saveInitialTitle} 
                tabWindow={this.state.saveTabWindow}
                onClose={this.closeSaveModal} 
                onSubmit={this.doSave}
                appComponent={this}
                />;
    }
    return modal;
  },

  /* render revert modal (or not) based on this.state.revertModalIsOpen */
  renderRevertModal() {
    var modal = null;
    if (this.state.revertModalIsOpen) {
      modal = <RevertModal 
                tabWindow={this.state.revertTabWindow}
                onClose={this.closeRevertModal} 
                onSubmit={this.doRevert}
                appComponent={this}
                />;
    }
    return modal;
  },

  render: function() {
    try {
      const saveModal = this.renderSaveModal();
      const revertModal = this.renderRevertModal();
      const filteredWindows = searchOps.filterTabWindows(this.state.sortedWindows,this.state.searchRE);
      var ret = (
        <div>
          <SelectablePopup 
            onSearchInput={this.handleSearchInput}            
            winStore={this.state.winStore} 
            storeUpdateHandler={refUpdater(this.props.storeRef)}
            filteredWindows={filteredWindows} 
            appComponent={this}
            searchStr={this.state.searchStr}
            searchRE={this.state.searchRE}
          />
          {saveModal}
          {revertModal}
        </div>
      );
    } catch (e) {
      console.error( "App Component: caught exception during render: " );
      console.error( e.stack );
      throw e;      
    }
    return ret;
  },

  componentWillMount: function() {
    if (this.props.noListener)
      return;

    const storeRef=this.props.storeRef;
    /*
     * This listener is essential for triggering a (recursive) re-render
     * in response to a state change.
     */
    var listenerId = storeRef.addViewListener(() => {
      console.log("TabMan: viewListener: updating store from storeRef");
      this.setState(this.storeAsState(storeRef.getValue()));
    });
    // console.log("componentWillMount: added view listener: ", listenerId);
    sendHelperMessage({ listenerId });
  },
});

/**
 * send message to BGhelper
 */
function sendHelperMessage(msg) {
  var port = chrome.runtime.connect({name: "popup"});
  port.postMessage(msg);
  port.onMessage.addListener(function(msg) {
    console.log("Got response message: ", msg);
  });  
}

module.exports.TabMan = TabMan;