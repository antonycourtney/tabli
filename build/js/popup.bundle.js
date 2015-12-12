webpackJsonp([2],{

/***/ 0:
/*!*************************!*\
  !*** ./src/js/popup.js ***!
  \*************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _actions = __webpack_require__(/*! ./actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _utils = __webpack_require__(/*! ./utils */ 7);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _componentsTabliPopup = __webpack_require__(/*! ./components/TabliPopup */ 417);
	
	var _componentsTabliPopup2 = _interopRequireDefault(_componentsTabliPopup);
	
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	
	function logHTML(labelStr, htmlStr) {
	  var fullLogStr = labelStr + ":\n%o";
	
	  var div = document.createElement('div');
	  div.innerHTML = htmlStr;
	  console.log(fullLogStr, div.firstChild);
	}
	
	/**
	 * Main entry point to rendering the popup window
	 */
	function renderPopup(currentWindowId) {
	  var t_preRender = performance.now();
	  var bgPage = chrome.extension.getBackgroundPage();
	
	  var storeRef = bgPage.storeRef;
	  var savedStore = bgPage.savedStore;
	  var savedHTML = bgPage.savedHTML;
	
	  var parentNode = document.getElementById('windowList-region');
	
	  /*
	   * We do a quick immediate render using saved HTML and then use setTimeout()
	   * to initate a more complete sync operation
	   */
	
	  if (savedHTML) {
	    parentNode.innerHTML = savedHTML;
	    var t_postSet = performance.now();
	    console.log("time to set initial HTML: ", t_postSet - t_preRender);
	    // logHTML("loaded HTML", savedHTML);
	  }
	
	  /*
	   * We make our initial call to create and render the React component tree on a zero timeout
	   * to give this handler a chance to complete and allow Chrome to render the initial
	   * HTML set from savedHTML
	   */
	
	  function doRender() {
	    /* First:let's render *before* sync'ing so that we match the pre-rendered HTML... */
	    /* Note (!!): We use savedStore here to ensured that the store state exactly matches savedHTML; we'll simply ignore
	     * any possible store updates that happened since last save
	     */
	    // console.log("doRender: About to render using savedStore: ", savedStore.toJS());
	    var appElement = React.createElement(_componentsTabliPopup2['default'], { storeRef: storeRef, initialWinStore: savedStore });
	    var appComponent = React.render(appElement, parentNode);
	    var t_postRender = performance.now();
	    console.log("full render complete. render time: (", t_postRender - t_preRender, " ms)");
	
	    // And sync our window state, which may update the UI...
	    actions.syncChromeWindows((0, _utils.logWrap)(function (uf) {
	      // console.log("postLoadRender: window sync complete");
	      var syncStore = uf(savedStore);
	
	      // And set current focused window:
	      var nextStore = syncStore.setCurrentWindow(currentWindowId);
	      storeRef.setValue(nextStore);
	
	      // logHTML("Updated savedHTML", renderedString);
	      var t_postSyncUpdate = performance.now();
	      console.log("syncChromeWindows and update complete: ", t_postSyncUpdate - t_preRender, " ms");
	      document.getElementById("searchBox").focus();
	    }));
	  }
	
	  setTimeout(doRender, 0);
	}
	
	function getFocusedAndRender() {
	  chrome.windows.getCurrent(null, function (currentWindow) {
	    renderPopup(currentWindow.id);
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

/***/ 412:
/*!************************************!*\
  !*** ./src/js/components/Modal.js ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _styles = __webpack_require__(/*! ./styles */ 400);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 402);
	
	var Util = _interopRequireWildcard(_util);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _HeaderButton = __webpack_require__(/*! ./HeaderButton */ 405);
	
	var _HeaderButton2 = _interopRequireDefault(_HeaderButton);
	
	/*
	 * generic modal dialog component
	 */
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	var Dialog = React.createClass({
	  displayName: 'Dialog',
	
	  handleClose: function handleClose(event) {
	    console.log("Modal.handleClose: ", event, arguments);
	    event.preventDefault();
	    this.props.onClose(event);
	  },
	
	  render: function render() {
	    var modalDiv = null;
	
	    var titleStyle = Util.merge(_styles2['default'].text, _styles2['default'].noWrap, _styles2['default'].modalTitle, _styles2['default'].open);
	    var closeStyle = Util.merge(_styles2['default'].headerButton, _styles2['default'].closeButton);
	    var closeButton = React.createElement(_HeaderButton2['default'], { baseStyle: closeStyle, visible: true,
	      hoverStyle: _styles2['default'].closeButtonHover, title: 'Close Window',
	      onClick: this.handleClose });
	    modalDiv = React.createElement(
	      'div',
	      { style: _styles2['default'].modalOverlay },
	      React.createElement(
	        'div',
	        { style: _styles2['default'].modalContainer },
	        React.createElement(
	          'div',
	          { style: Util.merge(_styles2['default'].windowHeader, _styles2['default'].noWrap) },
	          React.createElement(
	            'span',
	            { style: titleStyle },
	            this.props.title
	          ),
	          React.createElement('div', { style: _styles2['default'].spacer }),
	          closeButton
	        ),
	        this.props.children
	      )
	    );
	    return modalDiv;
	  },
	
	  componentDidMount: function componentDidMount() {
	    console.log("Modal: componentDidMount");
	  }
	});
	
	exports.Dialog = Dialog;
	var Info = React.createClass({
	  displayName: 'Info',
	
	  render: function render() {
	    return React.createElement(
	      'div',
	      { style: _styles2['default'].dialogInfo },
	      React.createElement(
	        'div',
	        { style: _styles2['default'].dialogInfoContents },
	        this.props.children
	      )
	    );
	  }
	});
	
	exports.Info = Info;
	var Body = React.createClass({
	  displayName: 'Body',
	
	  render: function render() {
	    return React.createElement(
	      'div',
	      { style: _styles2['default'].modalBodyContainer },
	      this.props.children
	    );
	  }
	});
	exports.Body = Body;

/***/ },

/***/ 413:
/*!******************************************!*\
  !*** ./src/js/components/RevertModal.js ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _styles = __webpack_require__(/*! ./styles */ 400);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 402);
	
	var Util = _interopRequireWildcard(_util);
	
	var _constants = __webpack_require__(/*! ./constants */ 401);
	
	var Constants = _interopRequireWildcard(_constants);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _Modal = __webpack_require__(/*! ./Modal */ 412);
	
	var Modal = _interopRequireWildcard(_Modal);
	
	/*
	 * Modal dialog for reverting a bookmarked window
	 */
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	var RevertModal = React.createClass({
	  displayName: 'RevertModal',
	
	  handleKeyDown: function handleKeyDown(e) {
	    if (e.keyCode == Constants.KEY_ESC) {
	      // ESC key
	      e.preventDefault();
	      this.props.onClose(e);
	    } else if (e.keyCode == Constants.KEY_ENTER) {
	      this.handleSubmit(e);
	    }
	  },
	  handleSubmit: function handleSubmit(e) {
	    e.preventDefault();
	    this.props.onSubmit(this.props.tabWindow);
	  },
	  renderItem: function renderItem(tabItem) {
	    var fiSrc = tabItem.favIconUrl ? tabItem.favIconUrl : "";
	    // Skip the chrome FAVICONs; they just throw when accessed.
	    if (fiSrc.indexOf("chrome://theme/") == 0) {
	      fiSrc = "";
	    }
	    var tabFavIcon = React.createElement('img', { style: _styles2['default'].favIcon, src: fiSrc });
	    var tabOpenStyle = tabItem.open ? null : _styles2['default'].closed;
	    var tabActiveStyle = tabItem.active ? _styles2['default'].activeSpan : null;
	    var tabTitleStyles = Util.merge(_styles2['default'].text, _styles2['default'].tabTitle, _styles2['default'].noWrap, tabOpenStyle, tabActiveStyle);
	    return React.createElement(
	      'div',
	      { style: _styles2['default'].noWrap },
	      tabFavIcon,
	      React.createElement(
	        'span',
	        { style: tabTitleStyles },
	        tabItem.title
	      ),
	      React.createElement('div', { style: _styles2['default'].spacer })
	    );
	  },
	  renderTabItems: function renderTabItems(tabItems) {
	    var itemElems = tabItems.map(this.renderItem);
	    return React.createElement(
	      'div',
	      { style: _styles2['default'].tabList },
	      itemElems
	    );
	  },
	  render: function render() {
	    var tabWindow = this.props.tabWindow;
	    var revertedTabWindow = TabWindow.removeOpenWindowState(tabWindow);
	    var savedUrlsSet = Immutable.Set(revertedTabWindow.tabItems.map(function (ti) {
	      return ti.url;
	    }));
	
	    var itemsToClose = tabWindow.tabItems.filter(function (ti) {
	      return !savedUrlsSet.has(ti.url);
	    });
	    var closeItemsElem = this.renderTabItems(itemsToClose);
	
	    var itemsToReload = tabWindow.tabItems.filter(function (ti) {
	      return savedUrlsSet.has(ti.url);
	    });
	    var reloadItemsElem = this.renderTabItems(itemsToReload);
	
	    var closeSection = null;
	    if (itemsToClose.count() > 0) {
	      closeSection = React.createElement(
	        'div',
	        null,
	        React.createElement(
	          'p',
	          null,
	          'The following tabs will be closed:'
	        ),
	        React.createElement(
	          'div',
	          { style: _styles2['default'].simpleTabContainer },
	          closeItemsElem
	        ),
	        React.createElement('br', null)
	      );
	    }
	    return React.createElement(
	      Modal.Dialog,
	      { title: 'Revert Saved Window?', onClose: this.props.onClose },
	      React.createElement(
	        Modal.Body,
	        null,
	        React.createElement(
	          'div',
	          { style: _styles2['default'].dialogInfoContents },
	          closeSection,
	          React.createElement(
	            'p',
	            null,
	            'The following tabs will be reloaded:'
	          ),
	          React.createElement(
	            'div',
	            { style: _styles2['default'].simpleTabContainer },
	            reloadItemsElem
	          ),
	          React.createElement('br', null),
	          React.createElement(
	            'p',
	            null,
	            'This action can not be undone.'
	          )
	        ),
	        React.createElement(
	          'div',
	          { style: Util.merge(_styles2['default'].alignRight) },
	          React.createElement(
	            'div',
	            { style: Util.merge(_styles2['default'].dialogButton, _styles2['default'].primaryButton),
	              onClick: this.handleSubmit,
	              ref: 'okButton',
	              tabIndex: 0,
	              onKeyDown: this.handleKeyDown },
	            'OK'
	          ),
	          React.createElement(
	            'div',
	            { style: _styles2['default'].dialogButton,
	              onClick: this.props.onClose,
	              tabIndex: 0
	            },
	            'Cancel'
	          )
	        )
	      )
	    );
	  },
	
	  /* HACK - get focus to the OK button, because tabIndex getting ignored. */
	  componentDidMount: function componentDidMount() {
	    console.log("revertModal: did mount");
	    this.refs.okButton.getDOMNode().focus();
	  }
	});
	
	exports['default'] = RevertModal;
	module.exports = exports['default'];

/***/ },

/***/ 414:
/*!****************************************!*\
  !*** ./src/js/components/SaveModal.js ***!
  \****************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _styles = __webpack_require__(/*! ./styles */ 400);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 402);
	
	var Util = _interopRequireWildcard(_util);
	
	var _constants = __webpack_require__(/*! ./constants */ 401);
	
	var Constants = _interopRequireWildcard(_constants);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _Modal = __webpack_require__(/*! ./Modal */ 412);
	
	var Modal = _interopRequireWildcard(_Modal);
	
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	
	var SaveModal = React.createClass({
	  displayName: 'SaveModal',
	
	  handleKeyDown: function handleKeyDown(e) {
	    if (e.keyCode == Constants.KEY_ESC) {
	      // ESC key
	      e.preventDefault();
	      this.props.onClose(e);
	    }
	  },
	  handleSubmit: function handleSubmit(e) {
	    e.preventDefault();
	    var titleStr = this.refs.titleInput.getDOMNode().value;
	    console.log("handleSubmit: title: ", titleStr);
	    this.props.onSubmit(titleStr);
	  },
	  render: function render() {
	    return React.createElement(
	      Modal.Dialog,
	      { title: 'Save Tabs', focusRef: 'titleInput', onClose: this.props.onClose },
	      React.createElement(
	        Modal.Info,
	        null,
	        React.createElement(
	          'span',
	          null,
	          'Save all tabs in this window'
	        )
	      ),
	      React.createElement(
	        Modal.Body,
	        null,
	        React.createElement(
	          'div',
	          { style: _styles2['default'].centerContents },
	          React.createElement(
	            'form',
	            { className: 'dialog-form', onSubmit: this.handleSubmit },
	            React.createElement(
	              'fieldset',
	              null,
	              React.createElement(
	                'label',
	                { htmlFor: 'title' },
	                'Window Title'
	              ),
	              React.createElement('input', { type: 'text', name: 'title', id: 'title', ref: 'titleInput',
	                autoFocus: true,
	                defaultValue: this.props.initialTitle,
	                onKeyDown: this.handleKeyDown
	              })
	            )
	          )
	        )
	      )
	    );
	  },
	
	  componentDidMount: function componentDidMount() {
	    console.log("SaveModal: did mount");
	    var titleElem = this.refs.titleInput.getDOMNode();
	    /* titleElem.val(this.props.initialTitle); */
	    var titleLen = this.props.initialTitle.length;
	    window.setTimeout(function () {
	      console.log("timer func");
	      titleElem.setSelectionRange(0, titleLen);
	    }, 0);
	  }
	});
	
	exports['default'] = SaveModal;
	module.exports = exports['default'];

/***/ },

/***/ 416:
/*!**********************************************!*\
  !*** ./src/js/components/SelectablePopup.js ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _immutable = __webpack_require__(/*! immutable */ 4);
	
	var Immutable = _interopRequireWildcard(_immutable);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _styles = __webpack_require__(/*! ./styles */ 400);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 402);
	
	var Util = _interopRequireWildcard(_util);
	
	var _SearchBar = __webpack_require__(/*! ./SearchBar */ 410);
	
	var _SearchBar2 = _interopRequireDefault(_SearchBar);
	
	var _TabWindowList = __webpack_require__(/*! ./TabWindowList */ 411);
	
	var _TabWindowList2 = _interopRequireDefault(_TabWindowList);
	
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	
	function tabCount(searchStr, filteredTabWindow) {
	  var ret = searchStr.length > 0 ? filteredTabWindow.itemMatches.count() : filteredTabWindow.tabWindow.tabItems.count();
	  return ret;
	}
	
	function selectedTab(filteredTabWindow, searchStr, tabIndex) {
	  if (searchStr.length == 0) {
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
	  displayName: 'SelectablePopup',
	
	  getInitialState: function getInitialState() {
	    return {
	      selectedWindowIndex: 0,
	      selectedTabIndex: 0
	    };
	  },
	
	  handlePrevSelection: function handlePrevSelection(byPage) {
	    if (this.props.filteredWindows.length === 0) return;
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
	    if (this.props.filteredWindows.length === 0) return;
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
	    if (this.props.filteredWindows.length == 0) return;
	
	    // TODO: deal with this.state.selectedTabIndex==-1
	
	    var selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex];
	    var selectedTabItem = selectedTab(selectedWindow, this.props.searchStr, this.state.selectedTabIndex);
	    console.log("opening: ", selectedTabItem.toJS());
	    actions.activateTab(selectedWindow.tabWindow, selectedTabItem, this.state.selectedTabIndex, this.props.storeUpdateHandler);
	  },
	
	  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
	    var selectedWindowIndex = this.state.selectedWindowIndex;
	    var selectedTabIndex = this.state.selectedTabIndex;
	    var nextFilteredWindows = nextProps.filteredWindows;
	
	    if (selectedWindowIndex >= nextFilteredWindows.length) {
	      if (nextFilteredWindows.length == 0) {
	        this.setState({ selectedWindowIndex: 0, selectedTabIndex: -1 });
	        console.log("resetting indices");
	      } else {
	        var lastWindow = nextFilteredWindows[nextFilteredWindows.length - 1];
	        this.setState({ selectedWindowIndex: nextFilteredWindows.length - 1, selectedTabIndex: tabCount(this.props.searchStr, lastWindow) - 1 });
	      }
	    } else {
	      var nextSelectedWindow = nextFilteredWindows[selectedWindowIndex];
	      var nextTabIndex = Math.min(this.state.selectedTabIndex, tabCount(this.props.searchStr, nextSelectedWindow) - 1);
	      this.setState({ selectedTabIndex: nextTabIndex });
	    }
	  },
	
	  render: function render() {
	    var winStore = this.props.winStore;
	    var openTabCount = winStore.countOpenTabs();
	    var openWinCount = winStore.countOpenWindows();
	    var savedCount = winStore.countSavedWindows();
	
	    // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
	    var summarySentence = "Tabs: " + openTabCount + " Open. Windows: " + openWinCount + " Open, " + savedCount + " Saved.";
	
	    return React.createElement(
	      'div',
	      null,
	      React.createElement(
	        'div',
	        { style: _styles2['default'].popupHeader },
	        React.createElement(_SearchBar2['default'], { onSearchInput: this.props.onSearchInput,
	          onSearchUp: this.handlePrevSelection,
	          onSearchDown: this.handleNextSelection,
	          onSearchEnter: this.handleSelectionEnter
	        })
	      ),
	      React.createElement(
	        'div',
	        { style: _styles2['default'].popupBody },
	        React.createElement(_TabWindowList2['default'], { winStore: this.props.winStore,
	          storeUpdateHandler: this.props.storeUpdateHandler,
	          filteredWindows: this.props.filteredWindows,
	          appComponent: this.props.appComponent,
	          searchStr: this.props.searchStr,
	          searchRE: this.props.searchRE,
	          selectedWindowIndex: this.state.selectedWindowIndex,
	          selectedTabIndex: this.state.selectedTabIndex
	        })
	      ),
	      React.createElement(
	        'div',
	        { style: _styles2['default'].popupFooter },
	        React.createElement(
	          'span',
	          { style: Util.merge(_styles2['default'].closed, _styles2['default'].summarySpan) },
	          summarySentence
	        )
	      )
	    );
	  }
	});
	
	exports['default'] = SelectablePopup;
	module.exports = exports['default'];

/***/ },

/***/ 417:
/*!*****************************************!*\
  !*** ./src/js/components/TabliPopup.js ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _react = __webpack_require__(/*! react */ 8);
	
	var React = _interopRequireWildcard(_react);
	
	var _reactAddons = __webpack_require__(/*! react/addons */ 164);
	
	var _styles = __webpack_require__(/*! ./styles */ 400);
	
	var _styles2 = _interopRequireDefault(_styles);
	
	var _util = __webpack_require__(/*! ./util */ 402);
	
	var Util = _interopRequireWildcard(_util);
	
	var _actions = __webpack_require__(/*! ../actions */ 6);
	
	var actions = _interopRequireWildcard(_actions);
	
	var _searchOps = __webpack_require__(/*! ../searchOps */ 184);
	
	var searchOps = _interopRequireWildcard(_searchOps);
	
	var _oneref = __webpack_require__(/*! oneref */ 185);
	
	var _tabWindow = __webpack_require__(/*! ../tabWindow */ 5);
	
	var TabWindow = _interopRequireWildcard(_tabWindow);
	
	__webpack_require__(/*! babel/polyfill */ 217);
	
	var _Modal = __webpack_require__(/*! ./Modal */ 412);
	
	var Modal = _interopRequireWildcard(_Modal);
	
	var _RevertModal = __webpack_require__(/*! ./RevertModal */ 413);
	
	var _RevertModal2 = _interopRequireDefault(_RevertModal);
	
	var _SaveModal = __webpack_require__(/*! ./SaveModal */ 414);
	
	var _SaveModal2 = _interopRequireDefault(_SaveModal);
	
	var _SelectablePopup = __webpack_require__(/*! ./SelectablePopup */ 416);
	
	var _SelectablePopup2 = _interopRequireDefault(_SelectablePopup);
	
	/*
	 * sort criteria for window list:
	 *   open windows first, then alpha by title
	 */
	var PureRenderMixin = _reactAddons.addons.PureRenderMixin;
	var Perf = _reactAddons.addons.Perf;
	function windowCmpFn(tabWindowA, tabWindowB) {
	  // focused window very first:
	  var fA = tabWindowA.focused;
	  var fB = tabWindowB.focused;
	  if (fA != fB) {
	    if (fA) return -1;else return 1;
	  }
	
	  // open windows first:
	  if (tabWindowA.open != tabWindowB.open) {
	    if (tabWindowA.open) return -1;else return 1;
	  }
	  var tA = tabWindowA.title;
	  var tB = tabWindowB.title;
	  return tA.localeCompare(tB);
	}
	
	var TabliPopup = React.createClass({
	  displayName: 'TabliPopup',
	
	  storeAsState: function storeAsState(winStore) {
	    var tabWindows = winStore.getAll();
	
	    var sortedWindows = tabWindows.sort(windowCmpFn);
	
	    return {
	      winStore: winStore,
	      sortedWindows: sortedWindows
	    };
	  },
	
	  getInitialState: function getInitialState() {
	    var st = this.storeAsState(this.props.initialWinStore);
	
	    var w0 = st.sortedWindows[0];
	
	    st.saveModalIsOpen = false;
	    st.revertModalIsOpen = false;
	    st.revertTabWindow = null;
	    st.searchStr = '';
	    st.searchRE = null;
	    return st;
	  },
	
	  handleSearchInput: function handleSearchInput(searchStr) {
	    searchStr = searchStr.trim();
	
	    var searchRE = null;
	    if (searchStr.length > 0) {
	      searchRE = new RegExp(searchStr, "i");
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
	    var updateHandler = (0, _oneref.refUpdater)(this.props.storeRef);
	    actions.revertWindow(this.state.revertTabWindow, updateHandler);
	    this.closeRevertModal();
	  },
	
	  /* render save modal (or not) based on this.state.saveModalIsOpen */
	  renderSaveModal: function renderSaveModal() {
	    var modal = null;
	    if (this.state.saveModalIsOpen) {
	      modal = React.createElement(_SaveModal2['default'], { initialTitle: this.state.saveInitialTitle,
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
	      modal = React.createElement(_RevertModal2['default'], {
	        tabWindow: this.state.revertTabWindow,
	        onClose: this.closeRevertModal,
	        onSubmit: this.doRevert,
	        appComponent: this
	      });
	    }
	    return modal;
	  },
	
	  render: function render() {
	    try {
	      var saveModal = this.renderSaveModal();
	      var revertModal = this.renderRevertModal();
	      var filteredWindows = searchOps.filterTabWindows(this.state.sortedWindows, this.state.searchRE);
	      var ret = React.createElement(
	        'div',
	        null,
	        React.createElement(_SelectablePopup2['default'], {
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
	      console.error("App Component: caught exception during render: ");
	      console.error(e.stack);
	      throw e;
	    }
	    return ret;
	  },
	
	  componentWillMount: function componentWillMount() {
	    var _this = this;
	
	    if (this.props.noListener) return;
	
	    var storeRef = this.props.storeRef;
	    /*
	     * This listener is essential for triggering a (recursive) re-render
	     * in response to a state change.
	     */
	    var listenerId = storeRef.addViewListener(function () {
	      console.log("TabliPopup: viewListener: updating store from storeRef");
	      _this.setState(_this.storeAsState(storeRef.getValue()));
	    });
	    // console.log("componentWillMount: added view listener: ", listenerId);
	    sendHelperMessage({ listenerId: listenerId });
	  }
	});
	
	/**
	 * send message to BGhelper
	 */
	function sendHelperMessage(msg) {
	  var port = chrome.runtime.connect({ name: "popup" });
	  port.postMessage(msg);
	  port.onMessage.addListener(function (msg) {
	    console.log("Got response message: ", msg);
	  });
	}
	
	exports['default'] = TabliPopup;
	module.exports = exports['default'];

/***/ }

});
//# sourceMappingURL=popup.bundle.js.map