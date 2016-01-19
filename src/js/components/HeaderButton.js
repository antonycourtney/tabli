import * as React from 'react';
import * as PureRenderMixin from 'react-addons-pure-render-mixin';

import styles from './HeaderButton.css';

const buttonSpacer = <div className={styles.common} />;

// A button that will merge in hoverStyle when hovered over
var HeaderButton = React.createClass({
  mixins: [PureRenderMixin],
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

    return (
      <button className={this.props.className} title={this.props.title} onClick={this.handleClick}
        onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut}
      />);
  },
});

export default HeaderButton;
