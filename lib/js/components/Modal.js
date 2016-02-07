'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Body = exports.Info = exports.Dialog = undefined;

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _styles = require('./styles');

var _styles2 = _interopRequireDefault(_styles);

var _util = require('./util');

var Util = _interopRequireWildcard(_util);

var _HeaderButton = require('./HeaderButton');

var _HeaderButton2 = _interopRequireDefault(_HeaderButton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/*
 * generic modal dialog component
 */

/* Allow multiple components in this file: */
/* eslint react/no-multi-comp:0 */

var Dialog = exports.Dialog = React.createClass({
  displayName: 'Dialog',
  handleClose: function handleClose(event) {
    console.log('Modal.handleClose: ', event, arguments);
    event.preventDefault();
    this.props.onClose(event);
  },
  render: function render() {
    var modalDiv = null;

    var titleStyle = Util.merge(_styles2.default.text, _styles2.default.noWrap, _styles2.default.modalTitle, _styles2.default.open);
    var closeStyle = Util.merge(_styles2.default.headerButton, _styles2.default.closeButton);
    var closeButton = React.createElement(_HeaderButton2.default, { baseStyle: closeStyle, visible: true,
      hoverStyle: _styles2.default.closeButtonHover, title: 'Close Window',
      onClick: this.handleClose
    });
    modalDiv = React.createElement(
      'div',
      { style: _styles2.default.modalOverlay },
      React.createElement(
        'div',
        { style: _styles2.default.modalContainer },
        React.createElement(
          'div',
          { style: Util.merge(_styles2.default.windowHeader, _styles2.default.noWrap) },
          React.createElement(
            'span',
            { style: titleStyle },
            this.props.title
          ),
          React.createElement('div', { style: _styles2.default.spacer }),
          closeButton
        ),
        this.props.children
      )
    );
    return modalDiv;
  },
  componentDidMount: function componentDidMount() {
    console.log('Modal: componentDidMount');
  }
});

var Info = exports.Info = React.createClass({
  displayName: 'Info',
  render: function render() {
    return React.createElement(
      'div',
      { style: _styles2.default.dialogInfo },
      React.createElement(
        'div',
        { style: _styles2.default.dialogInfoContents },
        this.props.children
      )
    );
  }
});

var Body = exports.Body = React.createClass({
  displayName: 'Body',
  render: function render() {
    return React.createElement(
      'div',
      { style: _styles2.default.modalBodyContainer },
      this.props.children
    );
  }
});