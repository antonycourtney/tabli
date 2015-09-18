'use strict';

import * as $ from 'jquery';
import * as React from 'react';
import * as actions from './actions';
import * as Immutable from 'immutable';

// import * as objectAssign from 'object-assign';
import 'babel/polyfill';

import * as TabWindowStore from './tabWindowStore';
import {addons} from 'react/addons'; 
const {PureRenderMixin} = addons;

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
    backgroundColor: 'MistyRose',
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
    var visibilityStyle = this.props.visible ? styles.visible : styles.hidden;
    var hoverStyle = (this.state.hovering && this.props.hoverStyle) ? this.props.hoverStyle : null;
    var buttonStyle = m(this.props.baseStyle,visibilityStyle,hoverStyle);
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

    var windowTitle = tabWindow.title;   
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

    var closeStyle = m(styles.headerButton,styles.closeButton);
    var closeButton = <HeaderButton baseStyle={closeStyle} visible={tab.open && this.state.hovering} 
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
        <div style={styles.spacer} />
        {closeButton}
      </div>);
  }

});

var TabWindow = React.createClass({
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
    actions.openWindow(this.props.winStore,this.props.tabWindow);
  },

  handleClose: function(event) {
    // console.log("handleClose");
    actions.closeWindow(this.props.winStore,this.props.tabWindow);
  },

  handleRevert: function(event) {
    actions.revertWindow(this.props.winStore,this.props.tabWindow);
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
    for (var i = 0; i < tabs.count(); i++ ) {
      var id = "tabItem-" + i;
      var tabItem = <TabItem winStore={this.props.winStore} tabWindow={tabWindow} tab={tabs.get(i)} key={id} tabIndex={i} />;
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
    var tabs = tabWindow.tabItems;

    // TODO: This was part of old hacky search impl to hide windows w/ no match; should probably go
    if (tabs.count()==0)
      return null;

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

var SearchBar = React.createClass({
  handleChange() {
    const searchStr=this.refs.searchInput.getDOMNode().value;
    this.props.onSearchInput(searchStr);
  },

  render() {
    return (
      <div style={styles.searchBar}>
        <input style={styles.searchInput} type="text" ref="searchInput" placeholder="Search..." 
          onChange={this.handleChange} />
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

    var tabWindows = this.props.sortedWindows;    
    for (var i=0; i < tabWindows.length; i++) {
      var tabWindow = tabWindows[i];
      var id = "tabWindow" + i;
      if (tabWindow) {
          var isOpen = tabWindow.open;
          var isFocused = tabWindow.focused;
          var isSelected = tabWindow === this.props.selectedWindow;
          var selectedTab = null;
          if (isSelected) {
            selectedTab = this.props.selectedTab;
          }
          var windowElem = <TabWindow winStore={this.props.winStore} 
                              tabWindow={tabWindow} key={id} 
                              searchStr={this.props.searchStr} 
                              searchRE={this.props.searchRE}
                              isSelected={isSelected}
                              selectedTab={selectedTab}
                              />;
          if (isFocused) {
            focusedWindowElem = windowElem;
          } else if (isOpen) {
            openWindows.push(windowElem);
          } else {
            savedWindows.push(windowElem);
          }
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

var TabMan = React.createClass({
  getStateFromStore: function(winStore) {
    var tabWindows = winStore.getAll();


    var sortedWindows = tabWindows.sort(windowCmpFn);

    // var w0Title = sortedWindows[0].title;
    // console.log("TabMan: window 0 title: '" + w0Title + "'");

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

    st.modalIsOpen = false;
    st.searchStr = '';
    st.searchRE = null;
    const w0 = st.sortedWindows[0];

    console.log("getInitialState: w0: ", w0.toJS());

    st.selectedWindow = w0;
    st.selectedTab = null;
    return st;
  },

  handleSearchInput(searchStr) {
    searchStr = searchStr.trim();

    var searchRE = null;
    if (searchStr.length > 0) {
      searchRE = new RegExp(searchStr,"i");
    }
    console.log("search input: '",searchStr,"'");
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
      var ret = (
        <div>
          <WindowListSection>
            <SearchBar onSearchInput={this.handleSearchInput}/>
          </WindowListSection>        
          <TabWindowList winStore={this.state.winStore} 
                           sortedWindows={this.state.sortedWindows} 
                           appComponent={this}
                           searchStr={this.state.searchStr}
                           searchRE={this.state.searchRE}
                           selectedWindow={this.state.selectedWindow}
                           selectedTab={this.state.selectedTab}
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
    console.log("added view listener: ", listenerId);
    sendHelperMessage({ listenerId });
  },
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
 * Main entry point to rendering the popup window
 */ 
function renderPopup() {
  var bgw = chrome.extension.getBackgroundPage();
  var winStore = bgw.winStore;

  actions.syncChromeWindows(winStore,logWrap( () => {
    console.log("postLoadRender: window sync complete");

    var t_preRender = performance.now();
    var elemId = document.getElementById('windowList-region');
    var windowListComponent = <TabMan winStore={winStore} />;
    React.render( windowListComponent, elemId ); 
    var t_postRender = performance.now();
    console.log("initial render complete. render time: (", t_postRender - t_preRender, " ms)");    
  }));
}

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

/*
 * Perform our React rendering *after* the load event for the popup
 * (rather than the more traditional ondocumentready event)
 * because we observe that Chrome's http cache will not attempt to
 * re-validate cached resources accessed after the load event, and this
 * is essential for reasonable performance when loading favicons.
 *
 * See https://code.google.com/p/chromium/issues/detail?id=511699
 *
 */
function main() {
  window.onload = renderPopup;
}

main();