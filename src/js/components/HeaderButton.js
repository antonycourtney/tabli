import * as React from 'react';
import { addons } from 'react/addons';
import Styles from './styles';
import * as Util from './util';
const { PureRenderMixin } = addons;

import Hoverable from './Hoverable';

const buttonSpacer = <div style={Styles.headerButton} />;

// A button that will merge in hoverStyle when hovered over
var HeaderButton = React.createClass({
  mixins: [Hoverable, PureRenderMixin],
  handleClick(event) {
    if (this.props.visible) {
      this.props.onClick(event);
      event.stopPropagation();
    }
  },

  render() {
    /* We render a LOT of these, and React profiler indicates we're spending a lot of time here
     * and mostly visible will be false (due to not hovering in parent component, so let's
     * try to fast path the non-visible case with a simple spacer
     */
    if (!this.props.visible) {
      return buttonSpacer;
    }

    // const visibilityStyle = this.props.visible ? Styles.visible : Styles.hidden;
    var hoverStyle = (this.state.hovering && this.props.hoverStyle) ? this.props.hoverStyle : null;
    var buttonStyle = Util.merge(this.props.baseStyle, hoverStyle);
    return (
      <button style={buttonStyle} title={this.props.title} onClick={this.handleClick}
        onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut}
      />);
  },
});

export default HeaderButton;
