import * as Constants from './constants'
import * as React from 'react'
import * as styles from './cssStyles'
import { css, cx } from 'emotion'
import { ThemeContext } from './themeContext'
import HeaderButton from './HeaderButton'

/*
 * generic modal dialog component
 */

/* Allow multiple components in this file: */
/* eslint react/no-multi-comp:0 */

const modalOverlayStyle = css({
  position: 'fixed',
  top: 0,
  left: 0,
  background: 'rgba(0,0,0,0.6)',
  zIndex: 5,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column'
})
const selectedBorder = '2px solid #a0a0a0'
const modalContainerStyle = css({
  minWidth: 300,
  maxWidth: 480,
  maxHeight: '80%',
  position: 'relative',
  zIndex: 10,
  borderRadius: 3,
  background: '#fff',
  margin: 'auto',
  border: selectedBorder,
  flexGrow: 0,
  display: 'flex',
  flexDirection: 'column'
})
const modalBodyContainerStyle = css({
  display: 'flex',
  minHeight: 50,
  maxHeight: Constants.MODAL_BODY_MAX_HEIGHT,
  overflow: 'auto',
  flexDirection: 'column',
  margin: 8
})

const modalTitleBase = css({
  fontWeight: 'bold',
  paddingLeft: 7,
  maxWidth: 243
})

const titleStyle = cx(styles.text, styles.noWrap, modalTitleBase, styles.open)

const dialogInfoStyle = css({
  borderBottom: '1px solid #bababa',
  paddingLeft: 3
})

export class Dialog extends React.PureComponent {
  static contextType = ThemeContext
  handleClose = (event) => {
    event.preventDefault()
    this.props.onClose(event)
  };

  render () {
    let theme = this.context
    var modalDiv = null

    var closeButton = (
      <HeaderButton
        className={styles.modalCloseButton}
        visible
        title='Close Window'
        onClick={this.handleClose} />)
    // Note explicit global css class name windowHeaderHoverContainer here
    // Due to limitation of nested class selectors with composition;
    // see https://emotion.sh/docs/nested for more info.
    modalDiv = (
      <div className={modalOverlayStyle}>
        <div className={modalContainerStyle}>
          <div className={cx(styles.windowHeader(theme), styles.noWrap) + ' windowHeaderHoverContainer'} >
            <span className={titleStyle}>{this.props.title}</span>
            <div className={styles.spacer} />
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
      <div className={dialogInfoStyle}>
        <div className={styles.dialogInfoContents}>
          {this.props.children}
        </div>
      </div>
    )
  }
}

export class Body extends React.Component {
  render () {
    return (
      <div className={modalBodyContainerStyle}>
        {this.props.children}
      </div>
    )
  }
}
