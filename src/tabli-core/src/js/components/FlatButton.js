import * as React from 'react';
import * as PureRenderMixin from 'react-addons-pure-render-mixin';
import Styles from './styles';
import * as Util from './util';

var FlatButton = React.createClass({
  mixins: [PureRenderMixin],
  handleClick(event) {
    if (this.props.visible) {
      this.props.onClick(event);
      event.stopPropagation();
    }
  },

  render() {
    return (
      <a style={Styles.flatButton}  onClick={this.handleClick} >
        {this.props.label}
      </a>
    );
  },
});

export default FlatButton;
