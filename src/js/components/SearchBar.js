import * as log from 'loglevel' // eslint-disable-line no-unused-vars
import * as React from 'react'
import Button from 'reactstrap/lib/Button'
import ButtonDropdown from 'reactstrap/lib/ButtonDropdown'
import DropdownToggle from 'reactstrap/lib/DropdownToggle'
import DropdownMenu from 'reactstrap/lib/DropdownMenu'
import DropdownItem from 'reactstrap/lib/DropdownItem'
import Input from 'reactstrap/lib/Input'
import * as Constants from './constants'
import * as actions from '../actions'
import * as Util from './util'
import { ThemeContext } from './themeContext'

// The dreaded routine copied from SO
// http://stackoverflow.com/a/18455088/3272482
function copyTextToClipboard (text) {
  var copyFrom = document.createElement('textarea')
  copyFrom.textContent = text
  var body = document.getElementsByTagName('body')[0]
  body.appendChild(copyFrom)
  copyFrom.select()
  document.execCommand('copy')
  body.removeChild(copyFrom)
}

class SearchBar extends React.Component {
  constructor (props) {
    super(props)

    this.toggle = this.toggle.bind(this)
    this.state = {
      dropdownOpen: false
    }
  }

  toggle () {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }))
  }

  handleChange = () => {
    const searchStr = this.searchInputRef.value
    this.props.onSearchInput(searchStr)
  };

  handleKeyDown = (e) => {
    if ((e.keyCode === Constants.KEY_F1) ||
      (e.keyCode === Constants.KEY_QUESTION && e.ctrlKey && e.shiftKey)) {
      e.preventDefault()
      actions.showHelp()
    }

    const searchUp = (byPage) => {
      if (this.props.onSearchUp) {
        e.preventDefault()
        this.props.onSearchUp(byPage)
      }
    }

    const searchDown = (byPage) => {
      if (this.props.onSearchDown) {
        e.preventDefault()
        this.props.onSearchDown(byPage)
      }
    }

    if ((!e.ctrlKey && e.keyCode === Constants.KEY_UP) ||
      (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_P)) {
      searchUp(false)
    }
    if ((e.ctrlKey && e.keyCode === Constants.KEY_UP) ||
      (e.ctrlKey && e.shiftKey && e.keyCode === Constants.KEY_P)) {
      searchUp(true)
    }

    if ((!e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
      (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_N)) {
      searchDown(false)
    }

    if ((e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
      (e.ctrlKey && e.shiftKey && e.keyCode === Constants.KEY_N)) {
      searchDown(true)
    }

    if (e.keyCode === Constants.KEY_TAB) {
      // We need to determine if it was forward or backwards tab:
      // N.B. we still try and use e.ctrlKey to determine paged
      // nav, but that key combo consumed by Chrome before we see it...
      if (this.props.onSearchUp && this.props.onSearchDown) {
        e.preventDefault()
        if (e.shiftKey) {
          this.props.onSearchUp(e.ctrlKey)
        } else {
          this.props.onSearchDown(e.ctrlKey)
        }
      }
    }

    if (e.keyCode === Constants.KEY_ENTER) {
      if (this.props.onSearchEnter) {
        e.preventDefault()
        this.props.onSearchEnter(this.searchInputRef)
      }
    }

    // For some odd reason, semicolon gives a keyCode of 186 (?)
    // but key seems to work so use it
    if (e.key === ';') {
      if (this.props.onSearchExpandToggle) {
        e.preventDefault()
        this.props.onSearchExpandToggle()
      }
    }

    if (e.keyCode === Constants.KEY_ESC) {
      if (this.props.onSearchExit) {
        const searchStr = this.searchInputRef.value
        if (!searchStr || searchStr.length === 0) {
          e.preventDefault()
          this.props.onSearchExit()
        }
      }
    }
  };

  handleHelpClick = (e) => {
    e.preventDefault()
    actions.showHelp()
  };

  handleAboutClick = (e) => {
    e.preventDefault()
    actions.showAbout()
  };

  handlePopoutClick = (e) => {
    if (this.props.isPopout) {
      actions.hidePopout(this.props.winStore, this.props.storeRef)
    } else {
      actions.showPopout(this.props.winStore, this.props.storeRef)
    }
  };

  handleReviewClick = (e) => {
    e.preventDefault()
    actions.showReview(this.props.winStore, this.props.storeRef)
  };

  handleFeedbackClick = (e) => {
    e.preventDefault()
    actions.sendFeedback(this.props.winStore, this.props.storeRef)
  };

  handleRelNotesClick = (e) => {
    e.preventDefault()
    actions.showRelNotes(this.props.winStore, this.props.storeRef)
  };

  handleExpandToggleClick = () => {
    actions.toggleExpandAll(this.props.winStore, this.props.storeRef)
  };

  handlePreferencesClick = (e) => {
    e.preventDefault()
    actions.showPreferences()
  };

  handleReloadClick = (e) => {
    e.preventDefault()
    log.log('handleReloadClick')
    actions.reload()
  };

  handleCopyClick = () => {
    const openWindows = this.props.winStore.getTabWindowsByType('normal')

    var cmpFn = Util.windowCmp(this.props.winStore.currentWindowId)
    var sortedWindows = openWindows.sort(cmpFn)

    const s = sortedWindows.reduce((rs, tw) => rs + '\n\n' + tw.exportStr(), '')

    copyTextToClipboard(s)
  };

  setInputRef = (ref) => {
    this.searchInputRef = ref
    if (this.props.setInputRef) {
      this.props.setInputRef(ref)
    }
  };

  render () {
    let theme = this.context
    log.log('SearchBar: theme: ', theme)
    log.log('SearchBar: contextType: ', SearchBar.contextType)

    // We'll rotate 270 degrees to point upper left for popout,
    // 90 degrees to point lower right for pop-in:
    const popImgName = this.props.isPopout ? 'popin' : 'popout'
    const popImgPath = '../images/' + popImgName + '.png'
    const menuImgPath = '../images/hamburger-menu.png'
    const expandAllImgPath = '../images/triangle-small-1-01.png'

    const popVerb = this.props.isPopout ? 'Hide' : 'Show'
    const popDesc = popVerb + ' Tabli Popout Window'

    const popoutButton = (
      <Button
        className='btn-xs'
        outline
        color='dark'
        title={popDesc}
        onClick={this.handlePopoutClick}>
        <img className='popout-img' src={popImgPath} />
      </Button>
    )

    const expandAllButton = (
      <Button
        className='btn-xs'
        outline
        color='dark'
        title='Expand/Collapse All Window Summaries'
        onClick={this.handleExpandToggleClick}>
        <img className='expand-all-img' src={expandAllImgPath} />
      </Button>
    )

    const copyButton = (
      <Button
        className='btn-xs'
        outline
        color='dark'
        title='Copy All to Clipboard'
        onClick={this.handleCopyClick}>
        <i className='fa fa-clipboard' aria-hidden='true' />
      </Button>
    )

    const dropdownMenu = (
      <DropdownMenu className='tabli-menu'>
        <DropdownItem className='help-button' onClick={this.handleHelpClick}>Help (Manual)</DropdownItem>
        <DropdownItem onClick={this.handleAboutClick}>About Tabli</DropdownItem>
        <DropdownItem onClick={this.handleRelNotesClick}>Release Notes</DropdownItem>
        <DropdownItem divider />
        <DropdownItem onClick={this.handlePreferencesClick}>Preferences...</DropdownItem>
        <DropdownItem onClick={this.handleReloadClick}>Reload</DropdownItem>
        <DropdownItem divider />
        <DropdownItem onClick={this.handleReviewClick}>Review Tabli</DropdownItem>
        <DropdownItem onClick={this.handleFeedbackClick}>Send Feedback</DropdownItem>
      </DropdownMenu>
    )

    return (
      <div className='header-container'>
        <div className='header-toolbar'>
          <ButtonDropdown
            className='btn-group-xs'
            isOpen={this.state.dropdownOpen}
            toggle={this.toggle}>
            <DropdownToggle outline >
              <img src={menuImgPath} />
            </DropdownToggle>
            {dropdownMenu}
          </ButtonDropdown>
          {popoutButton}
          <Input
            bsSize='sm'
            className='search-input'
            type='search'
            tabIndex={1}
            innerRef={this.setInputRef}
            id='searchBox'
            placeholder='Search...'
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            title='Search Page Titles and URLs' />
          {expandAllButton}
          {copyButton}
        </div>
      </div>
    )
  }
}
SearchBar.contextType = ThemeContext

export default SearchBar
