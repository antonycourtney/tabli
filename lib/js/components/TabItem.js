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

var _Hoverable = require('./Hoverable');

var _Hoverable2 = _interopRequireDefault(_Hoverable);

var _HeaderButton = require('./HeaderButton');

var _HeaderButton2 = _interopRequireDefault(_HeaderButton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var TabItem = React.createClass({
  displayName: 'TabItem',

  mixins: [_Hoverable2.default],

  handleClick: function handleClick() {
    var tabWindow = this.props.tabWindow;
    var tab = this.props.tab;
    var tabIndex = this.props.tabIndex;

    // console.log("TabItem: handleClick: tab: ", tab);

    actions.activateTab(tabWindow, tab, tabIndex, this.props.storeUpdateHandler);
  },
  handleClose: function handleClose() {
    if (!this.props.tabWindow.open) {
      return;
    }
    if (!this.props.tab.open) {
      return;
    }
    var tabId = this.props.tab.openTabId;
    actions.closeTab(this.props.tabWindow, tabId, this.props.storeUpdateHandler);
  },
  handleBookmarkTabItem: function handleBookmarkTabItem(event) {
    event.stopPropagation();
    console.log('bookmark tab: ', this.props.tab.toJS());
    actions.saveTab(this.props.tabWindow, this.props.tab, this.props.storeUpdateHandler);
  },
  handleUnbookmarkTabItem: function handleUnbookmarkTabItem(event) {
    event.stopPropagation();
    console.log('unbookmark tab: ', this.props.tab.toJS());
    actions.unsaveTab(this.props.tabWindow, this.props.tab, this.props.storeUpdateHandler);
  },
  render: function render() {
    var tabWindow = this.props.tabWindow;
    var tab = this.props.tab;

    var managed = tabWindow.saved;

    var tabTitle = tab.title;

    // span style depending on whether open or closed window
    var tabOpenStyle = null;

    var tabCheckItem;

    if (managed) {
      if (!tab.open) {
        tabOpenStyle = _styles2.default.closed;
      }

      var hoverVisible = this.state.hovering ? _styles2.default.visible : _styles2.default.hidden;

      if (tab.saved) {
        tabCheckItem = React.createElement('button', { style: Util.merge(_styles2.default.headerButton, _styles2.default.tabManagedButton),
          title: 'Remove bookmark for this tab',
          onClick: this.handleUnbookmarkTabItem
        });

        // TODO: callback
      } else {
          // We used to include headerCheckbox, but that only set width and height
          // to something to 13x13; we want 16x16 from headerButton
          tabCheckItem = React.createElement('input', { style: Util.merge(_styles2.default.headerButton, hoverVisible, _styles2.default.tabCheckItem),
            type: 'checkbox',
            title: 'Bookmark this tab',
            onClick: this.handleBookmarkTabItem
          });
        }
    } else {
      // insert a spacer:
      tabCheckItem = React.createElement('div', { style: _styles2.default.headerButton });
    }

    var fiSrc = tab.favIconUrl ? tab.favIconUrl : '';

    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
      fiSrc = '';
    }

    var emptyFavIcon = React.createElement('div', { style: Util.merge(_styles2.default.headerButton, _styles2.default.emptyFavIcon) });

    var tabFavIcon = fiSrc.length > 0 ? React.createElement('img', { style: _styles2.default.favIcon, src: fiSrc }) : emptyFavIcon;

    var tabActiveStyle = tab.active ? _styles2.default.activeSpan : null;
    var tabTitleStyles = Util.merge(_styles2.default.text, _styles2.default.tabTitle, _styles2.default.noWrap, tabOpenStyle, tabActiveStyle);
    var hoverStyle = this.state.hovering ? _styles2.default.tabItemHover : null;
    var selectedStyle = this.props.isSelected ? _styles2.default.tabItemSelected : null;

    var audibleIcon = tab.audible ? React.createElement('div', { style: Util.merge(_styles2.default.headerButton, _styles2.default.audibleIcon) }) : null;

    var closeStyle = Util.merge(_styles2.default.headerButton, _styles2.default.closeButton);
    var closeButton = React.createElement(_HeaderButton2.default, { baseStyle: closeStyle, visible: tab.open && this.state.hovering,
      hoverStyle: _styles2.default.closeButtonHover, title: 'Close Tab',
      onClick: this.handleClose
    });

    return React.createElement(
      'div',
      { style: Util.merge(_styles2.default.noWrap, _styles2.default.tabItem, hoverStyle, selectedStyle),
        onMouseOut: this.handleMouseOut,
        onMouseOver: this.handleMouseOver,
        onClick: this.handleClick
      },
      tabCheckItem,
      tabFavIcon,
      React.createElement(
        'span',
        { style: tabTitleStyles },
        tabTitle
      ),
      React.createElement('div', { style: _styles2.default.spacer }),
      audibleIcon,
      closeButton
    );
  }
});

exports.default = TabItem;