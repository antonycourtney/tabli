'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _styles = require('./styles');

var _styles2 = _interopRequireDefault(_styles);

var _FilteredTabTile = require('./FilteredTabTile');

var _FilteredTabTile2 = _interopRequireDefault(_FilteredTabTile);

var _WindowListSection = require('./WindowListSection');

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