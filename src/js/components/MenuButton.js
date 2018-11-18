import * as log from 'loglevel' // eslint-disable-line no-unused-vars
import * as React from 'react'
import * as styles from './cssStyles'
import { ThemeContext } from './themeContext'
import { Manager, Reference, Popper } from 'react-popper'
import { css, cx } from 'emotion'
import { mkUrl } from './util'
import * as actions from '../actions'

const popperBaseStyle = (theme: Object) => css({
  backgroundColor: theme.background,
  zIndex: 1000,
  border: '1px solid ' + theme.lightBorder,
  borderRadius: '.25rem'
})

const menuItemStyle = theme => css({
  flex: 1,
  borderStyle: 'none',
  backgroundColor: theme.background,
  textAlign: 'left',
  fontSize: 14,
  padding: '4px 24px 4px 24px',
  '&:hover': {
    backgroundColor: theme.menuItemHover,
  }
})

const menuIconStyle = css({
  WebkitMaskImage: mkUrl('images/hamburger-menu.png')
})

class MenuButton extends React.Component {
  static contextType = ThemeContext

  constructor (props) {
    super(props)
    this.state = {
      dropdownOpen: false
    }
  }

  toggleDropDown (e) {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }))
  }

  handleHelpClick = (e) => {
    e.preventDefault()
    actions.showHelp()
  }

  handleAboutClick = (e) => {
    e.preventDefault()
    actions.showAbout()
  }

  handleReviewClick = (e) => {
    e.preventDefault()
    actions.showReview(this.props.winStore, this.props.storeRef)
  }

  handleFeedbackClick = (e) => {
    e.preventDefault()
    actions.sendFeedback(this.props.winStore, this.props.storeRef)
  }

  handleRelNotesClick = (e) => {
    e.preventDefault()
    actions.showRelNotes(this.props.winStore, this.props.storeRef)
  }

  handlePreferencesClick = (e) => {
    e.preventDefault()
    actions.showPreferences()
  };

  handleReloadClick = (e) => {
    e.preventDefault()
    log.log('handleReloadClick')
    actions.reload()
  };

  renderMenuItem (handler, label) {
    let theme = this.context
    const wrapItemHandler = handler => e => {
      this.setState({ dropdownOpen: false })
      return handler(e)
    }
    return (
      <button className={menuItemStyle(theme)} onClick={wrapItemHandler(handler)}>{label}</button>
    )
  }

  renderMenu () {
    const menuStyle = css({
      display: 'flex',
      flexDirection: 'column',
      width: 160,
      minWidth: '10rem',
      padding: '.5rem 0',
      margin: '.125rem 0 0'
    })
    return (
      <div className={menuStyle}>
        {this.renderMenuItem(this.handleHelpClick, 'Help (Manual)')}
        {this.renderMenuItem(this.handleAboutClick, 'About Tabli')}
        {this.renderMenuItem(this.handleRelNotesClick, 'Release Notes')}
        <hr/>
        {this.renderMenuItem(this.handlePreferencesClick, 'Preferences...')}
        {this.renderMenuItem(this.handleReloadClick, 'Reload')}
        <hr/>
        {this.renderMenuItem(this.handleReviewClick, 'Review Tabli')}
        {this.renderMenuItem(this.handleFeedbackClick, 'Send Feedback')}
      </div>
    )
  }

  render () {
    let theme = this.context
    const popperVisStyle = this.state.dropdownOpen ? styles.visible : styles.hidden
    const popperStyle = cx(popperVisStyle, popperBaseStyle(theme))
    const menu = this.renderMenu()
    if (window.isTesting) {
      return (
        <div/>
      )
    }
    return (
      <Manager>
        <Reference>
          {({ ref }) => (
            <button
              type="button"
              className={styles.toolbarButton(theme)}
              ref={ref}
              title='Tabli Menu'
              onClick={e => this.toggleDropDown(e)}>
              <div className={cx(styles.toolbarButtonIcon(theme), menuIconStyle)}/>
            </button>
          )}
        </Reference>
        <Popper placement="bottom-end">
          {({ ref, style, placement, arrowProps }) => {
            return (
              <div className={popperStyle} ref={ref} style={style} data-placement={placement}>
                {menu}
              </div>)
          }}
        </Popper>
      </Manager>)
  }
}

export default MenuButton
