import * as React from 'react';
import Styles from './styles';
import * as Util from './util';

import HeaderButton from './HeaderButton';

/*
 * generic modal dialog component
 */

/* Allow multiple components in this file: */
/* eslint react/no-multi-comp:0 */

export const Dialog = React.createClass({

  handleClose(event) {
    console.log('Modal.handleClose: ', event, arguments);
    event.preventDefault();
    this.props.onClose(event);
  },

  render() {
    var modalDiv = null;

    var titleStyle = Util.merge(Styles.text, Styles.noWrap, Styles.modalTitle, Styles.open);
    var closeButton = (
      <HeaderButton className="closeButton" baseStyle={Styles.headerButton} visible
        title="Close Window"
        onClick={this.handleClose}
      />);
    modalDiv = (
      <div style={Styles.modalOverlay}>
        <div style={Styles.modalContainer}>
          <div style={Util.merge(Styles.windowHeader, Styles.noWrap)} >
            <span style={titleStyle}>{this.props.title}</span>
            <div style={Styles.spacer} />
            {closeButton}
          </div>
          {this.props.children}
        </div>
      </div>);
    return modalDiv;
  },
});

export const Info = React.createClass({
  render() {
    return (
      <div style={Styles.dialogInfo}>                                                                                                                                                                                                                                                              <div style={Styles.dialogInfoContents}>
          {this.props.children}
        </div>
      </div>
    );
  },
});

export const Body = React.createClass({
  render() {
    return (
      <div style={Styles.modalBodyContainer} >
        {this.props.children}
      </div>
    );
  },
});
