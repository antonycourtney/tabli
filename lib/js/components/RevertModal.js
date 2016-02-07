'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _immutable = require('immutable');

var Immutable = _interopRequireWildcard(_immutable);

var _styles = require('./styles');

var _styles2 = _interopRequireDefault(_styles);

var _util = require('./util');

var Util = _interopRequireWildcard(_util);

var _constants = require('./constants');

var Constants = _interopRequireWildcard(_constants);

var _Modal = require('./Modal');

var Modal = _interopRequireWildcard(_Modal);

var _tabWindow = require('../tabWindow');

var TabWindow = _interopRequireWildcard(_tabWindow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/*
 * Modal dialog for reverting a bookmarked window
 */
var RevertModal = React.createClass({
  displayName: 'RevertModal',
  handleKeyDown: function handleKeyDown(e) {
    if (e.keyCode === Constants.KEY_ESC) {
      // ESC key
      e.preventDefault();
      this.props.onClose(e);
    } else if (e.keyCode === Constants.KEY_ENTER) {
      this.handleSubmit(e);
    }
  },
  handleSubmit: function handleSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.props.tabWindow);
  },
  renderItem: function renderItem(tabItem) {
    var fiSrc = tabItem.favIconUrl ? tabItem.favIconUrl : '';

    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
      fiSrc = '';
    }

    var tabFavIcon = React.createElement('img', { style: _styles2.default.favIcon, src: fiSrc });
    var tabOpenStyle = tabItem.open ? null : _styles2.default.closed;
    var tabActiveStyle = tabItem.active ? _styles2.default.activeSpan : null;
    var tabTitleStyles = Util.merge(_styles2.default.text, _styles2.default.tabTitle, _styles2.default.noWrap, tabOpenStyle, tabActiveStyle);
    return React.createElement(
      'div',
      { style: _styles2.default.noWrap },
      tabFavIcon,
      React.createElement(
        'span',
        { style: tabTitleStyles },
        tabItem.title
      ),
      React.createElement('div', { style: _styles2.default.spacer })
    );
  },
  renderTabItems: function renderTabItems(tabItems) {
    var itemElems = tabItems.map(this.renderItem);
    return React.createElement(
      'div',
      { style: _styles2.default.tabList },
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
          { style: _styles2.default.simpleTabContainer },
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
          { style: _styles2.default.dialogInfoContents },
          closeSection,
          React.createElement(
            'p',
            null,
            'The following tabs will be reloaded:'
          ),
          React.createElement(
            'div',
            { style: _styles2.default.simpleTabContainer },
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
          { style: Util.merge(_styles2.default.alignRight) },
          React.createElement(
            'div',
            { style: Util.merge(_styles2.default.dialogButton, _styles2.default.primaryButton),
              onClick: this.handleSubmit,
              ref: 'okButton',
              tabIndex: 0,
              onKeyDown: this.handleKeyDown
            },
            'OK'
          ),
          React.createElement(
            'div',
            { style: _styles2.default.dialogButton,
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
    console.log('revertModal: did mount');
    this.refs.okButton.focus();
  }
});

exports.default = RevertModal;