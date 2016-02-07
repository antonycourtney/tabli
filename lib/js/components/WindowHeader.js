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

var _reactAddonsPureRenderMixin = require('react-addons-pure-render-mixin');

var PureRenderMixin = _interopRequireWildcard(_reactAddonsPureRenderMixin);

var _Hoverable = require('./Hoverable');

var _Hoverable2 = _interopRequireDefault(_Hoverable);

var _HeaderButton = require('./HeaderButton');

var _HeaderButton2 = _interopRequireDefault(_HeaderButton);

var _ExpanderButton = require('./ExpanderButton');

var _ExpanderButton2 = _interopRequireDefault(_ExpanderButton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var WindowHeader = React.createClass({
  displayName: 'WindowHeader',

  mixins: [_Hoverable2.default, PureRenderMixin],

  handleUnmanageClick: function handleUnmanageClick(event) {
    console.log('unamange: ', this.props.tabWindow);
    event.preventDefault();
    var archiveFolderId = this.props.winStore.archiveFolderId;
    actions.unmanageWindow(archiveFolderId, this.props.tabWindow, this.props.storeUpdateHandler);
    event.stopPropagation();
  },
  handleManageClick: function handleManageClick(event) {
    console.log('manage: ', this.props.tabWindow);
    event.preventDefault();
    var tabWindow = this.props.tabWindow;
    var appComponent = this.props.appComponent;
    appComponent.openSaveModal(tabWindow);

    event.stopPropagation();
  },
  render: function render() {
    var tabWindow = this.props.tabWindow;

    var managed = tabWindow.saved;
    var windowTitle = tabWindow.title;

    var hoverStyle = this.state.hovering ? _styles2.default.visible : _styles2.default.hidden;

    var windowCheckItem;

    if (managed) {
      windowCheckItem = React.createElement('button', { style: Util.merge(_styles2.default.headerButton, _styles2.default.windowManagedButton),
        title: 'Stop managing this window', onClick: this.handleUnmanageClick
      });
    } else {
      var checkStyle = Util.merge(_styles2.default.headerButton, hoverStyle, _styles2.default.headerCheckBox);
      windowCheckItem = React.createElement('input', { style: checkStyle, type: 'checkbox',
        title: 'Save all tabs in this window',
        onClick: this.handleManageClick,
        ref: 'managedCheckbox',
        value: false
      });
    }

    var openStyle = tabWindow.open ? _styles2.default.open : _styles2.default.closed;
    var titleStyle = Util.merge(_styles2.default.text, _styles2.default.noWrap, _styles2.default.windowTitle, openStyle);
    var closeStyle = Util.merge(_styles2.default.headerButton, _styles2.default.closeButton);

    // We use hovering in the window header (this.state.hovering) to determine
    // visibility of both the revert button and close button appearing after the window title.

    var revertButton = React.createElement(_HeaderButton2.default, { baseStyle: Util.merge(_styles2.default.headerButton, _styles2.default.revertButton)
      // visible={this.state.hovering && managed && tabWindow.open}
      , visible: managed && tabWindow.open,
      title: 'Revert to bookmarked tabs (Close other tabs)',
      onClick: this.props.onRevert
    });

    var closeButton = React.createElement(_HeaderButton2.default, { baseStyle: closeStyle,
      visible: this.state.hovering && tabWindow.open,
      hoverStyle: _styles2.default.closeButtonHover, title: 'Close Window',
      onClick: this.props.onClose
    });

    // console.log("WindowHeader: ", windowTitle, openStyle, managed, this.props.expanded);

    return React.createElement(
      'div',
      { style: Util.merge(_styles2.default.windowHeader, _styles2.default.noWrap),
        onMouseOver: this.handleMouseOver, onMouseOut: this.handleMouseOut,
        onClick: this.props.onOpen
      },
      windowCheckItem,
      React.createElement(_ExpanderButton2.default, { winStore: this.props.winStore, expanded: this.props.expanded, onClick: this.props.onExpand }),
      React.createElement(
        'span',
        { style: titleStyle },
        windowTitle
      ),
      revertButton,
      React.createElement('div', { style: _styles2.default.spacer }),
      closeButton
    );
  }
});

exports.default = WindowHeader;