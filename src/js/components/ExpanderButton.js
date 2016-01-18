import * as React from 'react';
import * as PureRenderMixin from 'react-addons-pure-render-mixin';

import styles from './ExpanderButton.css';

// expand / contract button for a window
const ExpanderButton = React.createClass({
  mixins: [PureRenderMixin],
  handleClicked(event) {
    var nextState = !this.props.expanded;
    this.props.onClick(nextState);
    event.stopPropagation();
  },

  render() {
    var buttonStyle = this.props.expanded ? styles.expanded : styles.collapsed;
    return (
      <button className={buttonStyle} onClick={this.handleClicked} />
    );
  },
});

export default ExpanderButton;
