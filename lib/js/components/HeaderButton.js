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

var _Hoverable = require('./Hoverable');

var _Hoverable2 = _interopRequireDefault(_Hoverable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var buttonSpacer = React.createElement('div', { style: _styles2.default.headerButton });

// A button that will merge in hoverStyle when hovered over
var HeaderButton = React.createClass({
  displayName: 'HeaderButton',

  mixins: [_Hoverable2.default, PureRenderMixin],
  handleClick: function handleClick(event) {
    if (this.props.visible) {
      this.props.onClick(event);
      event.stopPropagation();
    }
  },
  render: function render() {
    /* We render a LOT of these, and React profiler indicates we're spending a lot of time here
     * and mostly visible will be false (due to not hovering in parent component, so let's
     * try to fast path the non-visible case with a simple spacer
     */
    if (!this.props.visible) {
      return buttonSpacer;
    }

    // const visibilityStyle = this.props.visible ? Styles.visible : Styles.hidden;
    var hoverStyle = this.state.hovering && this.props.hoverStyle ? this.props.hoverStyle : null;
    var buttonStyle = Util.merge(this.props.baseStyle, hoverStyle);
    return React.createElement('button', { style: buttonStyle, title: this.props.title, onClick: this.handleClick,
      onMouseOver: this.handleMouseOver, onMouseOut: this.handleMouseOut
    });
  }
});

exports.default = HeaderButton;