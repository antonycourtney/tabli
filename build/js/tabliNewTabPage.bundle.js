webpackJsonp([2],{

/***/ 0:
/*!***********************************!*\
  !*** ./src/js/tabliNewTabPage.js ***!
  \***********************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _reactDom = __webpack_require__(/*! react-dom */ 189);
	
	var ReactDOM = _interopRequireWildcard(_reactDom);
	
	var _actions = __webpack_require__(/*! ./actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _utils = __webpack_require__(/*! ./utils */ 7);
	
	var _NewTabPage = __webpack_require__(/*! ./components/NewTabPage */ 195);
	
	var _NewTabPage2 = _interopRequireDefault(_NewTabPage);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	/**
	 * Main entry point to rendering the new tab page
	 */
	function renderNewTabPage(currentWindowId) {
	  var t_preRender = performance.now();
	  var bgPage = chrome.extension.getBackgroundPage();
	
	  var storeRef = bgPage.storeRef;
	  var savedStore = bgPage.savedStore;
	
	  var parentNode = document.getElementById('windowList-region');
	
	  /* First:let's render *before* sync'ing so that we match the pre-rendered HTML... */
	  /* Note (!!): We use savedStore here to ensured that the store state exactly matches savedHTML; we'll simply ignore
	   * any possible store updates that happened since last save
	   */
	
	  // console.log("doRender: About to render using savedStore: ", savedStore.toJS());
	  var appElement = React.createElement(_NewTabPage2.default, { storeRef: storeRef, initialWinStore: savedStore });
	  var appComponent = ReactDOM.render(appElement, parentNode); // eslint-disable-line no-unused-vars
	  var t_postRender = performance.now();
	  console.log('full render complete. render time: (', t_postRender - t_preRender, ' ms)');
	
	  // And sync our window state, which may update the UI...
	  actions.syncChromeWindows((0, _utils.logWrap)(function (uf) {
	    // console.log("postLoadRender: window sync complete");
	    var syncStore = uf(savedStore);
	
	    // And set current focused window:
	    var nextStore = syncStore.setCurrentWindow(currentWindowId);
	    storeRef.setValue(nextStore);
	
	    // logHTML("Updated savedHTML", renderedString);
	    var t_postSyncUpdate = performance.now();
	    console.log('syncChromeWindows and update complete: ', t_postSyncUpdate - t_preRender, ' ms');
	    document.getElementById('searchBox').focus();
	  }));
	}
	
	function getFocusedAndRender() {
	  chrome.windows.getCurrent(null, function (currentWindow) {
	    renderNewTabPage(currentWindow.id);
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
	  window.onload = getFocusedAndRender;
	}
	
	main();

/***/ },

/***/ 195:
/*!*****************************************!*\
  !*** ./src/js/components/NewTabPage.js ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _searchOps = __webpack_require__(/*! ../searchOps */ 172);
	
	var searchOps = _interopRequireWildcard(_searchOps);
	
	var _oneref = __webpack_require__(/*! oneref */ 166);
	
	var _RevertModal = __webpack_require__(/*! ./RevertModal */ 176);
	
	var _RevertModal2 = _interopRequireDefault(_RevertModal);
	
	var _SaveModal = __webpack_require__(/*! ./SaveModal */ 184);
	
	var _SaveModal2 = _interopRequireDefault(_SaveModal);
	
	var _SelectableTabPage = __webpack_require__(/*! ./SelectableTabPage */ 196);
	
	var _SelectableTabPage2 = _interopRequireDefault(_SelectableTabPage);
	
	var _util = __webpack_require__(/*! ./util */ 177);
	
	var Util = _interopRequireWildcard(_util);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	/**
	 * send message to BGhelper
	 */
	function sendHelperMessage(msg) {
	  var port = chrome.runtime.connect({ name: 'popup' });
	  port.postMessage(msg);
	  port.onMessage.addListener(function (response) {
	    console.log('Got response message: ', response);
	  });
	}
	
	var NewTabPage = React.createClass({
	  displayName: 'NewTabPage',
	  storeAsState: function storeAsState(winStore) {
	    var tabWindows = winStore.getAll();
	
	    var sortedWindows = tabWindows.sort(Util.windowCmp);
	
	    return {
	      winStore: winStore,
	      sortedWindows: sortedWindows
	    };
	  },
	  getInitialState: function getInitialState() {
	    var st = this.storeAsState(this.props.initialWinStore);
	
	    st.saveModalIsOpen = false;
	    st.revertModalIsOpen = false;
	    st.revertTabWindow = null;
	    st.searchStr = '';
	    st.searchRE = null;
	    return st;
	  },
	  handleSearchInput: function handleSearchInput(rawSearchStr) {
	    var searchStr = rawSearchStr.trim();
	
	    var searchRE = null;
	    if (searchStr.length > 0) {
	      searchRE = new RegExp(searchStr, 'i');
	    }
	
	    console.log("search input: '" + searchStr + "'");
	    this.setState({ searchStr: searchStr, searchRE: searchRE });
	  },
	  openSaveModal: function openSaveModal(tabWindow) {
	    var initialTitle = tabWindow.title;
	    this.setState({ saveModalIsOpen: true, saveInitialTitle: initialTitle, saveTabWindow: tabWindow });
	  },
	  closeSaveModal: function closeSaveModal() {
	    this.setState({ saveModalIsOpen: false });
	  },
	  openRevertModal: function openRevertModal(filteredTabWindow) {
	    this.setState({ revertModalIsOpen: true, revertTabWindow: filteredTabWindow.tabWindow });
	  },
	  closeRevertModal: function closeRevertModal() {
	    this.setState({ revertModalIsOpen: false, revertTabWindow: null });
	  },
	
	
	  /* handler for save modal */
	  doSave: function doSave(titleStr) {
	    var storeRef = this.props.storeRef;
	    var tabliFolderId = storeRef.getValue().folderId;
	    actions.manageWindow(tabliFolderId, this.state.saveTabWindow, titleStr, (0, _oneref.refUpdater)(storeRef));
	    this.closeSaveModal();
	  },
	  doRevert: function doRevert(tabWindow) {
	    // eslint-disable-line no-unused-vars
	    var updateHandler = (0, _oneref.refUpdater)(this.props.storeRef);
	    actions.revertWindow(this.state.revertTabWindow, updateHandler);
	    this.closeRevertModal();
	  },
	
	
	  /* render save modal (or not) based on this.state.saveModalIsOpen */
	  renderSaveModal: function renderSaveModal() {
	    var modal = null;
	    if (this.state.saveModalIsOpen) {
	      modal = React.createElement(_SaveModal2.default, { initialTitle: this.state.saveInitialTitle,
	        tabWindow: this.state.saveTabWindow,
	        onClose: this.closeSaveModal,
	        onSubmit: this.doSave,
	        appComponent: this
	      });
	    }
	
	    return modal;
	  },
	
	
	  /* render revert modal (or not) based on this.state.revertModalIsOpen */
	  renderRevertModal: function renderRevertModal() {
	    var modal = null;
	    if (this.state.revertModalIsOpen) {
	      modal = React.createElement(_RevertModal2.default, {
	        tabWindow: this.state.revertTabWindow,
	        onClose: this.closeRevertModal,
	        onSubmit: this.doRevert,
	        appComponent: this
	      });
	    }
	
	    return modal;
	  },
	  render: function render() {
	    var ret;
	    try {
	      var saveModal = this.renderSaveModal();
	      var revertModal = this.renderRevertModal();
	      var filteredWindows = searchOps.filterTabWindows(this.state.sortedWindows, this.state.searchRE);
	      ret = React.createElement(
	        'div',
	        null,
	        React.createElement(_SelectableTabPage2.default, {
	          onSearchInput: this.handleSearchInput,
	          winStore: this.state.winStore,
	          storeUpdateHandler: (0, _oneref.refUpdater)(this.props.storeRef),
	          filteredWindows: filteredWindows,
	          appComponent: this,
	          searchStr: this.state.searchStr,
	          searchRE: this.state.searchRE
	        }),
	        saveModal,
	        revertModal
	      );
	    } catch (e) {
	      console.error('App Component: caught exception during render: ');
	      console.error(e.stack);
	      throw e;
	    }
	
	    return ret;
	  },
	  componentWillMount: function componentWillMount() {
	    var _this = this;
	
	    if (this.props.noListener) {
	      return;
	    }
	
	    var storeRef = this.props.storeRef;
	    /*
	     * This listener is essential for triggering a (recursive) re-render
	     * in response to a state change.
	     */
	    var listenerId = storeRef.addViewListener(function () {
	      console.log('TabliPopup: viewListener: updating store from storeRef');
	      _this.setState(_this.storeAsState(storeRef.getValue()));
	    });
	
	    // console.log("componentWillMount: added view listener: ", listenerId);
	    sendHelperMessage({ listenerId: listenerId });
	  }
	});
	
	exports.default = NewTabPage;

/***/ },

/***/ 196:
/*!************************************************!*\
  !*** ./src/js/components/SelectableTabPage.js ***!
  \************************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _styles = __webpack_require__(/*! ./styles */ 173);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 177);
	
	var Util = _interopRequireWildcard(_util);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _SearchBar = __webpack_require__(/*! ./SearchBar */ 186);
	
	var _SearchBar2 = _interopRequireDefault(_SearchBar);
	
	var _TabTileList = __webpack_require__(/*! ./TabTileList */ 197);
	
	var _TabTileList2 = _interopRequireDefault(_TabTileList);
	
	var _WindowListSection = __webpack_require__(/*! ./WindowListSection */ 193);
	
	var _WindowListSection2 = _interopRequireDefault(_WindowListSection);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function matchingTabCount(searchStr, filteredTabWindow) {
	  var ret = searchStr.length > 0 ? filteredTabWindow.itemMatches.count() : filteredTabWindow.tabWindow.tabItems.count();
	  return ret;
	}
	
	function selectedTab(filteredTabWindow, searchStr, tabIndex) {
	  if (searchStr.length === 0) {
	    var tabWindow = filteredTabWindow.tabWindow;
	    var tabItem = tabWindow.tabItems.get(tabIndex);
	    return tabItem;
	  }
	  var filteredItem = filteredTabWindow.itemMatches.get(tabIndex);
	  return filteredItem.tabItem;
	}
	
	/**
	 * An element that manages the selection.
	 *
	 * We want this as a distinct element from its parent TabMan, because it does local state management
	 * and validation that should happen with respect to the (already calculated) props containing
	 * filtered windows that we receive from above
	 */
	var SelectableTabPage = React.createClass({
	  displayName: 'SelectableTabPage',
	  getInitialState: function getInitialState() {
	    return {
	      selectedWindowIndex: 0,
	      selectedTabIndex: 0
	    };
	  },
	  handlePrevSelection: function handlePrevSelection(byPage) {
	    if (this.props.filteredWindows.length === 0) {
	      return;
	    }
	    var selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex];
	
	    // const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count();
	
	    if (selectedWindow.tabWindow.open && this.state.selectedTabIndex > 0 && !byPage) {
	      this.setState({ selectedTabIndex: this.state.selectedTabIndex - 1 });
	    } else {
	      // Already on first tab, try to back up to previous window:
	      if (this.state.selectedWindowIndex > 0) {
	        var prevWindowIndex = this.state.selectedWindowIndex - 1;
	        var prevWindow = this.props.filteredWindows[prevWindowIndex];
	        var prevTabCount = this.props.searchStr.length > 0 ? prevWindow.itemMatches.count() : prevWindow.tabWindow.tabItems.count();
	
	        this.setState({ selectedWindowIndex: prevWindowIndex, selectedTabIndex: prevTabCount - 1 });
	      }
	    }
	  },
	  handleNextSelection: function handleNextSelection(byPage) {
	    if (this.props.filteredWindows.length === 0) {
	      return;
	    }
	    var selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex];
	    var tabCount = this.props.searchStr.length > 0 ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count();
	
	    // We'd prefer to use expanded state of window rather then open/closed state,
	    // but that's hidden in the component...
	    if (selectedWindow.tabWindow.open && this.state.selectedTabIndex + 1 < tabCount && !byPage) {
	      this.setState({ selectedTabIndex: this.state.selectedTabIndex + 1 });
	    } else {
	      // Already on last tab, try to advance to next window:
	      if (this.state.selectedWindowIndex + 1 < this.props.filteredWindows.length) {
	        this.setState({ selectedWindowIndex: this.state.selectedWindowIndex + 1, selectedTabIndex: 0 });
	      }
	    }
	  },
	  handleSelectionEnter: function handleSelectionEnter() {
	    if (this.props.filteredWindows.length === 0) {
	      return;
	    }
	
	    // TODO: deal with this.state.selectedTabIndex==-1
	
	    var selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex];
	    var selectedTabItem = selectedTab(selectedWindow, this.props.searchStr, this.state.selectedTabIndex);
	    console.log('opening: ', selectedTabItem.toJS());
	    actions.activateTab(selectedWindow.tabWindow, selectedTabItem, this.state.selectedTabIndex, this.props.storeUpdateHandler);
	  },
	  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
	    var selectedWindowIndex = this.state.selectedWindowIndex;
	    var nextFilteredWindows = nextProps.filteredWindows;
	
	    if (selectedWindowIndex >= nextFilteredWindows.length) {
	      if (nextFilteredWindows.length === 0) {
	        this.setState({ selectedWindowIndex: 0, selectedTabIndex: -1 });
	        console.log('resetting indices');
	      } else {
	        var lastWindow = nextFilteredWindows[nextFilteredWindows.length - 1];
	        this.setState({ selectedWindowIndex: nextFilteredWindows.length - 1, selectedTabIndex: matchingTabCount(this.props.searchStr, lastWindow) - 1 });
	      }
	    } else {
	      var nextSelectedWindow = nextFilteredWindows[selectedWindowIndex];
	      var nextTabIndex = Math.min(this.state.selectedTabIndex, matchingTabCount(this.props.searchStr, nextSelectedWindow) - 1);
	      this.setState({ selectedTabIndex: nextTabIndex });
	    }
	  },
	  render: function render() {
	    var winStore = this.props.winStore;
	    var openTabCount = winStore.countOpenTabs();
	    var openWinCount = winStore.countOpenWindows();
	    var savedCount = winStore.countSavedWindows();
	
	    // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
	    var summarySentence = 'Tabs: ' + openTabCount + ' Open. Windows: ' + openWinCount + ' Open, ' + savedCount + ' Saved.';
	
	    return React.createElement(
	      'div',
	      null,
	      React.createElement(
	        'div',
	        { className: 'container' },
	        React.createElement(
	          'div',
	          { className: 'row' },
	          React.createElement('div', { className: 'com-sm-1' }),
	          React.createElement(
	            'div',
	            { className: 'col-sm-10' },
	            React.createElement('img', { src: '../images/popout-icon-1.png' }),
	            React.createElement(_SearchBar2.default, { onSearchInput: this.props.onSearchInput,
	              onSearchUp: this.handlePrevSelection,
	              onSearchDown: this.handleNextSelection,
	              onSearchEnter: this.handleSelectionEnter
	            })
	          )
	        ),
	        React.createElement(
	          'div',
	          { className: 'container-fluid' },
	          React.createElement(_TabTileList2.default, { winStore: this.props.winStore,
	            storeUpdateHandler: this.props.storeUpdateHandler,
	            filteredWindows: this.props.filteredWindows,
	            appComponent: this.props.appComponent,
	            searchStr: this.props.searchStr,
	            searchRE: this.props.searchRE,
	            selectedWindowIndex: this.state.selectedWindowIndex,
	            selectedTabIndex: this.state.selectedTabIndex
	          })
	        )
	      ),
	      React.createElement(
	        'div',
	        { style: _styles2.default.tabPageFooter },
	        React.createElement(
	          'span',
	          { style: Util.merge(_styles2.default.closed, _styles2.default.summarySpan) },
	          summarySentence
	        )
	      )
	    );
	  }
	});
	
	exports.default = SelectableTabPage;

/***/ },

/***/ 197:
/*!******************************************!*\
  !*** ./src/js/components/TabTileList.js ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _styles = __webpack_require__(/*! ./styles */ 173);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _FilteredTabTile = __webpack_require__(/*! ./FilteredTabTile */ 198);
	
	var _FilteredTabTile2 = _interopRequireDefault(_FilteredTabTile);
	
	var _WindowListSection = __webpack_require__(/*! ./WindowListSection */ 193);
	
	var _WindowListSection2 = _interopRequireDefault(_WindowListSection);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	var TabTileList = React.createClass({
	  displayName: 'TabTileList',
	  render: function render() {
	    var focusedWindowElem = [];
	    var openWindows = [];
	    var savedWindows = [];
	
	    var filteredWindows = this.props.filteredWindows;
	    for (var i = 0; i < filteredWindows.length; i++) {
	      var filteredTabWindow = filteredWindows[i];
	      var tabWindow = filteredTabWindow.tabWindow;
	      var id = 'tabWindow' + i;
	      var isOpen = tabWindow.open;
	      var isFocused = tabWindow.focused;
	      var isSelected = i === this.props.selectedWindowIndex;
	      var selectedTabIndex = isSelected ? this.props.selectedTabIndex : -1;
	
	      var initialExpandedState = isOpen ? null : true;
	      var windowElem = React.createElement(_FilteredTabTile2.default, { winStore: this.props.winStore,
	        storeUpdateHandler: this.props.storeUpdateHandler,
	        filteredTabWindow: filteredTabWindow, key: id,
	        searchStr: this.props.searchStr,
	        searchRE: this.props.searchRE,
	        isSelected: isSelected,
	        selectedTabIndex: selectedTabIndex,
	        appComponent: this.props.appComponent,
	        initialExpandedState: true
	      });
	      if (isFocused) {
	        focusedWindowElem = windowElem;
	      } else if (isOpen) {
	        openWindows.push(windowElem);
	      } else {
	        savedWindows.push(windowElem);
	      }
	    }
	    return React.createElement(
	      'div',
	      null,
	      React.createElement(
	        _WindowListSection2.default,
	        { title: 'Open Windows' },
	        React.createElement(
	          'div',
	          { style: _styles2.default.tabTileContainer },
	          focusedWindowElem,
	          openWindows
	        )
	      ),
	      React.createElement(
	        _WindowListSection2.default,
	        { title: 'Closed, Saved Windows' },
	        React.createElement(
	          'div',
	          { style: _styles2.default.tabTileContainer },
	          savedWindows
	        )
	      )
	    );
	  }
	});
	
	exports.default = TabTileList;

/***/ },

/***/ 198:
/*!**********************************************!*\
  !*** ./src/js/components/FilteredTabTile.js ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _reactDom = __webpack_require__(/*! react-dom */ 189);
	
	var ReactDOM = _interopRequireWildcard(_reactDom);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _styles = __webpack_require__(/*! ./styles */ 173);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 177);
	
	var Util = _interopRequireWildcard(_util);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _Hoverable = __webpack_require__(/*! ./Hoverable */ 183);
	
	var _Hoverable2 = _interopRequireDefault(_Hoverable);
	
	var _WindowHeader = __webpack_require__(/*! ./WindowHeader */ 190);
	
	var _WindowHeader2 = _interopRequireDefault(_WindowHeader);
	
	var _TabItem = __webpack_require__(/*! ./TabItem */ 192);
	
	var _TabItem2 = _interopRequireDefault(_TabItem);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	var FilteredTabTile = React.createClass({
	  displayName: 'FilteredTabTile',
	
	  mixins: [_Hoverable2.default],
	
	  getInitialState: function getInitialState() {
	    // Note:  We initialize this with null rather than false so that it will follow
	    // open / closed state of window
	    return { expanded: this.props.initialExpandedState };
	  },
	  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
	    if (nextProps.isSelected && !this.props.isSelected) {
	      // scroll div for this window into view:
	      ReactDOM.findDOMNode(this.refs.windowDiv).scrollIntoViewIfNeeded();
	    }
	  },
	  handleOpen: function handleOpen() {
	    console.log('handleOpen', this, this.props);
	    actions.openWindow(this.props.filteredTabWindow.tabWindow, this.props.storeUpdateHandler);
	  },
	  handleClose: function handleClose(event) {
	    // eslint-disable-line no-unused-vars
	    // console.log("handleClose");
	    actions.closeWindow(this.props.filteredTabWindow.tabWindow, this.props.storeUpdateHandler);
	  },
	  handleRevert: function handleRevert(event) {
	    // eslint-disable-line no-unused-vars
	    var appComponent = this.props.appComponent;
	    appComponent.openRevertModal(this.props.filteredTabWindow);
	  },
	
	
	  /* expanded state follows window open/closed state unless it is
	   * explicitly set interactively by the user
	   */
	  getExpandedState: function getExpandedState() {
	    if (this.state.expanded === null) {
	      return this.props.filteredTabWindow.tabWindow.open;
	    }
	    return this.state.expanded;
	  },
	  renderTabItems: function renderTabItems(tabWindow, tabs) {
	    /*
	     * We tried explicitly checking for expanded state and
	     * returning null if not expanded, but (somewhat surprisingly) it
	     * was no faster, even with dozens of hidden tabs
	     */
	    var items = [];
	    for (var i = 0; i < tabs.count(); i++) {
	      var id = 'tabItem-' + i;
	      var isSelected = i === this.props.selectedTabIndex;
	      var tabItem = React.createElement(_TabItem2.default, { winStore: this.props.winStore,
	        storeUpdateHandler: this.props.storeUpdateHandler,
	        tabWindow: tabWindow,
	        tab: tabs.get(i),
	        key: id,
	        tabIndex: i,
	        isSelected: isSelected,
	        appComponent: this.props.appComponent
	      });
	      items.push(tabItem);
	    }
	
	    var expanded = this.getExpandedState();
	    var expandableContentStyle = expanded ? _styles2.default.expandablePanelContentOpen : _styles2.default.expandablePanelContentClosed;
	    var tabListStyle = Util.merge(_styles2.default.tabList, expandableContentStyle, _styles2.default.tileTabContainer);
	    return React.createElement(
	      'div',
	      { style: tabListStyle },
	      items
	    );
	  },
	  handleExpand: function handleExpand(expand) {
	    this.setState({ expanded: expand });
	  },
	  render: function render() {
	    var filteredTabWindow = this.props.filteredTabWindow;
	    var tabWindow = filteredTabWindow.tabWindow;
	    var tabs;
	    if (this.props.searchStr.length === 0) {
	      tabs = tabWindow.tabItems;
	    } else {
	      tabs = filteredTabWindow.itemMatches.map(function (fti) {
	        return fti.tabItem;
	      });
	    }
	
	    /*
	     * optimization:  Let's only render tabItems if expanded
	     */
	    var expanded = this.getExpandedState();
	    var tabItems = null;
	    if (expanded) {
	      tabItems = this.renderTabItems(tabWindow, tabs);
	    } else {
	      // render empty list of tab items to get -ve margin rollup layout right...
	      tabItems = this.renderTabItems(tabWindow, Immutable.Seq());
	    }
	
	    var windowHeader = React.createElement(_WindowHeader2.default, { winStore: this.props.winStore,
	      storeUpdateHandler: this.props.storeUpdateHandler,
	      tabWindow: tabWindow,
	      expanded: expanded,
	      onExpand: this.handleExpand,
	      onOpen: this.handleOpen,
	      onRevert: this.handleRevert,
	      onClose: this.handleClose,
	      appComponent: this.props.appComponent
	    });
	
	    var selectedStyle = this.props.isSelected ? _styles2.default.tabWindowSelected : null;
	    var windowStyles = Util.merge(_styles2.default.tabWindow, _styles2.default.expandablePanel, selectedStyle, _styles2.default.tabWindowTile);
	
	    return React.createElement(
	      'div',
	      { ref: 'windowDiv', style: windowStyles, onMouseOver: this.handleMouseOver, onMouseOut: this.handleMouseOut },
	      windowHeader,
	      tabItems
	    );
	  }
	});
	
	exports.default = FilteredTabTile;

/***/ }

});
//# sourceMappingURL=tabliNewTabPage.bundle.js.map