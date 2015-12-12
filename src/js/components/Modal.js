'use strict';

import * as React from 'react';
import * as Immutable from 'immutable';
import {addons} from 'react/addons'; 
import Styles from './styles';
import * as Util from './util';
const {PureRenderMixin, Perf} = addons;

import * as actions from '../actions';

import HeaderButton from './HeaderButton';

/*
 * generic modal dialog component
 */
export const Dialog = React.createClass({

  handleClose: function(event) {
    console.log("Modal.handleClose: ", event, arguments);
    event.preventDefault();
    this.props.onClose(event);
  },

  render() {
    var modalDiv = null;

    var titleStyle = Util.merge(Styles.text,Styles.noWrap,Styles.modalTitle,Styles.open);
    var closeStyle = Util.merge(Styles.headerButton,Styles.closeButton);
    var closeButton = <HeaderButton baseStyle={closeStyle} visible={true} 
                          hoverStyle={Styles.closeButtonHover} title="Close Window" 
                          onClick={this.handleClose} />
    modalDiv = (
      <div style={Styles.modalOverlay}>
        <div style={Styles.modalContainer}>
          <div style={Util.merge(Styles.windowHeader,Styles.noWrap)} >
            <span style={titleStyle}>{this.props.title}</span>
            <div style={Styles.spacer} />
            {closeButton}
          </div>
          {this.props.children}
        </div>
      </div> );
    return modalDiv;
  },

  componentDidMount() {
    console.log("Modal: componentDidMount");
  }
});

export const Info = React.createClass({
  render() {
    return (
      <div style={Styles.dialogInfo}>      
        <div style={Styles.dialogInfoContents}>
          {this.props.children}
        </div>
      </div>
    );
  }
});

export const Body = React.createClass({
  render() {
    return (
      <div style={Styles.modalBodyContainer}>
        {this.props.children}
      </div>
    );
  }
});
