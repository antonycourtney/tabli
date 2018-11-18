import * as log from 'loglevel' // eslint-disable-line no-unused-vars
import * as React from 'react'
import * as Constants from './constants'
import * as actions from '../actions'
import * as Util from './util'
import * as styles from './cssStyles'
import { ThemeContext } from './themeContext'
import { css } from 'emotion'
import MenuButton from './menuButton'

const toolbarOuterContainerStyle = css`
  display: flex;
  align-items: center;
  margin-top: 8px;
  margin-bottom: 8px;
  min-width: 340px;
  justify: center;
`
const toolbarInnerContainerStyle = css`
  display: flex;
  justify-content: space-around;
  width: 340px;
`
const searchInputStyle = css`
  border: 1px solid #ccc;
  border-radius: 3px;
  width: 200px;
  max-width: 200px;
  margin-left: 8px;
  margin-right: 12px;
  flex: 0 0 auto;
  height: 22px;
  line-height: 1.42;
  padding: 1px;
  font-size: 12px;
`

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
  static contextType = ThemeContext

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

  handlePopoutClick = (e) => {
    if (this.props.isPopout) {
      actions.hidePopout(this.props.winStore, this.props.storeRef)
    } else {
      actions.showPopout(this.props.winStore, this.props.storeRef)
    }
  };

  handleExpandToggleClick = () => {
    actions.toggleExpandAll(this.props.winStore, this.props.storeRef)
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

    // We'll rotate 270 degrees to point upper left for popout,
    // 90 degrees to point lower right for pop-in:
    const popImgName = this.props.isPopout ? 'popin' : 'popout'
    const popImgPath = '../images/' + popImgName + '.png'
    const expandAllImgPath = '../images/triangle-small-1-01.png'

    const popVerb = this.props.isPopout ? 'Hide' : 'Show'
    const popDesc = popVerb + ' Tabli Popout Window'

    const popoutButton = (
      <button
        className={styles.toolbarButton(theme)}
        title={popDesc}
        onClick={this.handlePopoutClick}>
        <img className={styles.toolbarButtonImg(theme)} src={popImgPath} />
      </button>
    )

    const expandAllButton = (
      <button
        className={styles.toolbarButton(theme)}
        title='Expand/Collapse All Window Summaries'
        onClick={this.handleExpandToggleClick}>
        <img className={styles.toolbarButtonImg(theme)} src={expandAllImgPath} />
      </button>
    )

    const copyButton = (
      <button
        className={styles.toolbarButton(theme)}
        title='Copy All to Clipboard'
        onClick={this.handleCopyClick}>
        <i className='fa fa-clipboard' aria-hidden='true' />
      </button>
    )

    return (
      <div className={toolbarOuterContainerStyle}>
        <div className={toolbarInnerContainerStyle}>
          <MenuButton winStore={this.props.winStore} storeRef={this.props.storeRef} />
          {popoutButton}
          <input
            className={searchInputStyle}
            type='search'
            tabIndex={1}
            ref={this.setInputRef}
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

export default SearchBar
