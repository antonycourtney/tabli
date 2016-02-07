'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _styles = require('./styles');

var _styles2 = _interopRequireDefault(_styles);

var _util = require('./util');

var Util = _interopRequireWildcard(_util);

var _actions = require('../actions');

var actions = _interopRequireWildcard(_actions);

var _SearchBar = require('./SearchBar');

var _SearchBar2 = _interopRequireDefault(_SearchBar);

var _TabTileList = require('./TabTileList');

var _TabTileList2 = _interopRequireDefault(_TabTileList);

var _WindowListSection = require('./WindowListSection');

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