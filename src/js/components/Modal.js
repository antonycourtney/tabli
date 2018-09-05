import * as React from 'react'
import OldStyles from './oldStyles'
import * as Util from './util'

import HeaderButton from './HeaderButton'

/*
 * generic modal dialog component
 */

/* Allow multiple components in this file: */
/* eslint react/no-multi-comp:0 */

export class Dialog extends React.PureComponent {
  handleClose = (event) => {
    event.preventDefault()
    this.props.onClose(event)
  };

  render () {
    var modalDiv = null

    var titleStyle = Util.merge(OldStyles.text, OldStyles.noWrap, OldStyles.modalTitle, OldStyles.open)
    var closeButton = (
      <HeaderButton
        className='closeButton'
        baseStyle={OldStyles.headerButton}
        visible
        title='Close Window'
        onClick={this.handleClose} />)
    modalDiv = (
      <div style={OldStyles.modalOverlay}>
        <div style={OldStyles.modalContainer}>
          <div style={Util.merge(OldStyles.windowHeader, OldStyles.noWrap)}>
            <span style={titleStyle}>{this.props.title}</span>
            <div style={OldStyles.spacer} />
            {closeButton}
          </div>
          {this.props.children}
        </div>
      </div>)
    return modalDiv
  }
}

export class Info extends React.Component {
  render () {
    return (
      <div style={OldStyles.dialogInfo}>
        <div style={OldStyles.dialogInfoContents}>
          {this.props.children}
        </div>
      </div>
    )
  }
}

export class Body extends React.Component {
  render () {
    return (
      <div style={OldStyles.modalBodyContainer}>
        {this.props.children}
      </div>
    )
  }
}
