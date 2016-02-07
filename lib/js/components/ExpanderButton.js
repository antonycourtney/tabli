'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _reactAddonsPureRenderMixin = require('react-addons-pure-render-mixin');

var PureRenderMixin = _interopRequireWildcard(_reactAddonsPureRenderMixin);

var _styles = require('./styles');

var _styles2 = _interopRequireDefault(_styles);

var _util = require('./util');

var Util = _interopRequireWildcard(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// expand / contract button for a window
var ExpanderButton = React.createClass({
  displayName: 'ExpanderButton',

  mixins: [PureRenderMixin],

  handleClicked: function handleClicked(event) {
    var nextState = !this.props.expanded;
    this.props.onClick(nextState);
    event.stopPropagation();
  },
  render: function render() {
    var expandStyle = this.props.expanded ? _styles2.default.windowCollapse : _styles2.default.windowExpand;
    var buttonStyle = Util.merge(_styles2.default.headerButton, expandStyle);
    return React.createElement('button', { style: buttonStyle, onClick: this.handleClicked });
  }
});

exports.default = ExpanderButton;