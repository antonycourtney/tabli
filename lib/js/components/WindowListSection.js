'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _styles = require('./styles');

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var WindowListSection = React.createClass({
  displayName: 'WindowListSection',
  render: function render() {
    var header = null;
    if (this.props.title) {
      header = React.createElement(
        'div',
        { style: _styles2.default.windowListSectionHeader },
        React.createElement(
          'span',
          null,
          this.props.title
        )
      );
    }

    return React.createElement(
      'div',
      { style: _styles2.default.windowListSection },
      header,
      React.createElement(
        'div',
        null,
        this.props.children
      )
    );
  }
});

exports.default = WindowListSection;