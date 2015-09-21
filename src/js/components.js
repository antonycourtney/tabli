'use strict';

import * as $ from 'jquery';
import * as React from 'react';
import * as actions from './actions';
import * as Immutable from 'immutable';
import * as searchOps from './searchOps';

// import * as objectAssign from 'object-assign';
import 'babel/polyfill';

import * as TabWindowStore from './tabWindowStore';
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
    marginRight: 0 
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
    height: '100%'
  },
  modalContainer: {
    width: 300,
    position: 'relative',
    zIndex: 10,
    borderRadius: 3,
    background: '#fff',
    margin: '200px auto',
    border: '1px solid #bababa',   
    display: 'flex',
    flexDirection: 'column'     
  },
  modalBodyContainer: {
    display: 'flex',
    height: 50
  },
  modalBodyContents: {
    margin: 'auto'
  },
  dialogInfo: {
    borderBottom: '1px solid #bababa',
    paddingLeft: 3
  },
  dialogInfoContents: {
    marginLeft: 10,
    marginTop: 10,
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
      return <div style={styles.headerButton} />;
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

  contextTypes: {
    appComponent: React.PropTypes.object.isRequired
  },

  handleUnmanageClick: function(event) {
    console.log("unamange: ", this.props.tabWindow);
    actions.unmanageWindow(this.props.winStore,this.props.tabWindow);
    event.stopPropagation();
  },

  handleManageClick: function(event) {
    console.log("manage: ", this.props.tabWindow);
    event.preventDefault();
    var tabWindow = this.props.tabWindow;
    var appComponent = this.context.appComponent;
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
                          visible={this.state.hovering && managed && tabWindow.open} 
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

    actions.activateTab(this.props.winStore,tabWindow,tab,tabIndex);
  },

  handleClose: function() {
    if (!this.props.tabWindow.open)
      return;
    if (!this.props.tab.open)
      return;
    var tabId = this.props.tab.openTabId;
    actions.closeTab(this.props.winStore,this.props.tabWindow,tabId);
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
    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf("chrome://theme/")==0) {
      fiSrc="";
    }

    var tabFavIcon = <img style={styles.favIcon} src={fiSrc} />;

    var tabActiveStyle = tab.active ? styles.activeSpan : null;
    var tabTitleStyles = m(styles.text,styles.tabTitle,styles.noWrap,tabOpenStyle,tabActiveStyle);
    var hoverStyle = this.state.hovering ? styles.tabItemHover : null;
    var selectedStyle = this.props.isSelected ? styles.tabItemSelected : null;

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
        {closeButton}
      </div>);
  }

});

var FilteredTabWindow = React.createClass({
  mixins: [Hoverable],

  contextTypes: {
    appComponent: React.PropTypes.object.isRequired
  },

  getInitialState: function() {
    // Note:  We initialize this with null rather than false so that it will follow
    // open / closed state of window
    return ({expanded: null});
  },

  handleOpen: function() {
    console.log("handleOpen", this, this.props);
    actions.openWindow(this.props.winStore,this.props.filteredTabWindow.tabWindow);
  },

  handleClose: function(event) {
    // console.log("handleClose");
    actions.closeWindow(this.props.winStore,this.props.filteredTabWindow.tabWindow);
  },

  handleRevert: function(event) {
    actions.revertWindow(this.props.winStore,this.props.filteredTabWindow.tabWindow);
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
    var items = [];
    for (var i = 0; i < tabs.count(); i++ ) {
      var id = "tabItem-" + i;
      const isSelected = (i==this.props.selectedTabIndex);
      var tabItem = <TabItem winStore={this.props.winStore} 
                      tabWindow={tabWindow} 
                      tab={tabs.get(i)} 
                      key={id} 
                      tabIndex={i} 
                      isSelected={isSelected} />;
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
          tabWindow={tabWindow} 
          expanded={expanded} 
          onExpand={this.handleExpand} 
          onOpen={this.handleOpen}
          onRevert={this.handleRevert}
          onClose={this.handleClose}
        />;

    var selectedStyle=this.props.isSelected ? styles.tabWindowSelected : null;
    var windowStyles=m(styles.tabWindow,styles.expandablePanel,selectedStyle);

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

var SearchBar = React.createClass({
  handleChange() {
    const searchStr=this.refs.searchInput.getDOMNode().value;
    this.props.onSearchInput(searchStr);
  },

  handleKeyDown(e) {
    if (e.keyCode===KEY_UP) {
      if (this.props.onSearchUp) {
        e.preventDefault();
        this.props.onSearchUp();
      }
    }
    if (e.keyCode===KEY_DOWN) {
      if (this.props.onSearchDown) {
        e.preventDefault();
        this.props.onSearchDown();
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
        <input style={styles.searchInput} type="text" ref="searchInput" placeholder="Search..." 
          onChange={this.handleChange} onKeyDown={this.handleKeyDown} />
      </div>
    );  
  }
});

var TabWindowList = React.createClass({


  render: function() {
    console.log("TabWindowList: render");
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
                          filteredTabWindow={filteredTabWindow} key={id} 
                          searchStr={this.props.searchStr} 
                          searchRE={this.props.searchRE}
                          isSelected={isSelected}
                          selectedTabIndex={selectedTabIndex}
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
        <div style={styles.modalBodyContents}>
          {this.props.children}
        </div>
      </div>
    );
  }
});

/*
 * Modal dialog for saving a bookmarked window
 */
var SaveModal = React.createClass({
  /* The duplication of handleClose here and in Modal is hideous, but
   * not obvious how to avoid
   */
  handleClose(e) {
    e.preventDefault();
    var appComponent = this.context.appComponent;
    this.props.onClose();
    e.stopPropagation();    
  },
  handleKeyDown(e) {
    if (e.keyCode==27) {
      // ESC key
      e.preventDefault();
      this.handleClose(e);
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
      <Modal title="Save Tabs" focusRef="titleInput" onClose={this.handleClose} >
        <ModalInfo>
          <span>Save all tabs in this window</span> 
        </ModalInfo>
        <ModalBody>
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

  handlePrevSelection: function() {
    if (this.props.filteredWindows.length===0)
      return;
    const selectedWindow=this.props.filteredWindows[this.state.selectedWindowIndex];
    // const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count();

    if (this.state.selectedTabIndex > 0) {
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

  handleNextSelection: function() {
    if (this.props.filteredWindows.length===0)
      return;
    const selectedWindow=this.props.filteredWindows[this.state.selectedWindowIndex];
    const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count();

    if ((this.state.selectedTabIndex + 1) < tabCount) {
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
    actions.activateTab(this.props.winStore,selectedWindow.tabWindow,selectedTabItem,this.state.selectedTabIndex);
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
  getStateFromStore: function(winStore) {
    var tabWindows = winStore.getAll();

    var t_preSort = performance.now();
    var sortedWindows = tabWindows.sort(windowCmpFn);
    var t_postSort = performance.now();

    console.log("sorting windows took ", t_postSort - t_preSort, " ms");
    return {
      winStore: winStore,
      sortedWindows
    };
  },

  childContextTypes: {
     appComponent: React.PropTypes.object.isRequired
  },

  getChildContext: function() {
    return { appComponent: this };
  },

  getInitialState: function() {
    var st = this.getStateFromStore(this.props.winStore);

    const w0 = st.sortedWindows[0];

    st.modalIsOpen = false;
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

  /* handler for save modal */
  doSave(titleStr) {
    actions.manageWindow(this.state.winStore,this.state.saveTabWindow,titleStr,(w) => {
      console.log("finished saving: ", w);
      this.closeSaveModal();
    });
  },

  /* render modal (or not) based on this.state.modalIsOpen */
  renderModal() {
    var modal = null;
    if (this.state.saveModalIsOpen) {
      modal = <SaveModal initialTitle={this.state.saveInitialTitle} 
                tabWindow={this.state.saveTabWindow}
                onClose={this.closeSaveModal} 
                onSubmit={this.doSave}
                />;
    }
    return modal;
  },

  render: function() {
    try {
      const modal = this.renderModal();
      const filteredWindows = searchOps.filterTabWindows(this.state.sortedWindows,this.state.searchRE);
      var ret = (
        <div>
          <SelectablePopup 
            onSearchInput={this.handleSearchInput}
            winStore={this.state.winStore} 
            filteredWindows={filteredWindows} 
            appComponent={this}
            searchStr={this.state.searchStr}
            searchRE={this.state.searchRE}
          />
          {modal}
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
    var winStore = this.props.winStore;
    /*
     * This listener on the store is essential for triggering a (recursive) re-render
     * in response to a state change.
     */
    // Save viewListener so we can remove it in componentWillUnmount
    this.viewListener = () => {
      this.setState(this.getStateFromStore(winStore));      
    };
    // We used to just do:
    // winStore.on("change",this.viewListener);
    // but that leaked because unfortunately componentWillUnmount never gets called
    // when popup closes.
    // Now we use setViewListener, which ensures at most one view listener:
    // winStore.setViewListener(this.viewListener);

    var listenerId = winStore.addViewListener(this.viewListener);
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