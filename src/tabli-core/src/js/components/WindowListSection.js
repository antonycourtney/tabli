import * as React from 'react';
import Styles from './styles';

const WindowListSection = React.createClass({
  render() {
    var header = null;
    if (this.props.title) {
      header = (
        <div style={Styles.windowListSectionHeader}>
          <span>{this.props.title}</span>
        </div>
      );
    }

    return (
      <div style={Styles.windowListSection}>
        {header}
        <div>
          {this.props.children}
        </div>
      </div>
    );
  },
});

export default WindowListSection;
