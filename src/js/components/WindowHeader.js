import * as React from 'react'
import OldStyles from './oldStyles'
import * as Util from './util'
import * as actions from '../actions'
import * as Constants from './constants'

import { cx } from 'emotion'
import * as styles from './cssStyles'

import HeaderButton from './HeaderButton'
import ExpanderButton from './ExpanderButton'

const titleBaseStyle = cx(styles.text, styles.noWrap, styles.windowTitle)
const titleOpenStyle = cx(titleBaseStyle, styles.open)
const titleClosedStyle = cx(titleBaseStyle, styles.closed)

class WindowHeader extends React.PureComponent {
  state = {
    editingTitle: false
  }

  handleUnmanageClick = (event) => {
    console.log('unamange: ', this.props.tabWindow)
    event.preventDefault()
    const archiveFolderId = this.props.winStore.archiveFolderId
    actions.unmanageWindow(archiveFolderId, this.props.tabWindow, this.props.storeRef)
    event.stopPropagation()
  };

  handleManageClick = (event) => {
    console.log('manage: ', this.props.tabWindow)
    event.preventDefault()
    var tabWindow = this.props.tabWindow
    var appComponent = this.props.appComponent
    appComponent.openSaveModal(tabWindow)

    event.stopPropagation()
  };

  handleTitleRename = (event) => {
    event.preventDefault()
    this.setState({editingTitle: true})
    event.stopPropagation()
  }

  handleTitleSubmit = (event) => {
    event.preventDefault()
    this.setState({editingTitle: false})
    const ic = this.titleInput
    if (ic) {
      const titleStr = ic.value
      if (titleStr !== this.props.tabWindow.title) {
        actions.setWindowTitle(titleStr, this.props.tabWindow, this.props.storeRef)
      }
    }
    event.stopPropagation()
  }

  handleTitleKeyDown = (e) => {
    if (e.keyCode === Constants.KEY_ESC) {
      // ESC key
      e.preventDefault()
      this.setState({editingTitle: false})
    }
  };

  render () {
    var tabWindow = this.props.tabWindow

    var managed = tabWindow.saved
    var windowTitle = tabWindow.title

    var windowCheckItem

    if (managed) {
      windowCheckItem = (
        <button className={cx(styles.headerButton, styles.windowManagedButton, styles.headerHoverVisible)} title='Stop managing this window' onClick={this.handleUnmanageClick} />)
    } else {
      windowCheckItem = (
        <input
          className={cx(styles.headerButton, styles.headerCheckBox, styles.headerHoverVisible)}
          type='checkbox'
          title='Save all tabs in this window'
          onClick={this.handleManageClick}
          value={false} />)
    }

    const titleStyle = tabWindow.open ? titleOpenStyle : titleClosedStyle

    const revertButton = (
      <HeaderButton
        baseStyle={Util.merge(OldStyles.headerButton, OldStyles.revertButton)}
        visible={managed && tabWindow.open}
        title='Revert to bookmarked tabs (Close other tabs)'
        onClick={this.props.onRevert} />)

    const editButton = (
      <HeaderButton
        className='headerButton editButton'
        visible={managed && !this.state.edititingTitle}
        title='Edit saved window title'
        onClick={this.handleTitleRename} />)

    var closeButton = (
      <HeaderButton
        className='closeButton'
        baseStyle={OldStyles.headerButton}
        visible={tabWindow.open}
        title='Close Window'
        onClick={this.props.onClose} />)

    // console.log("WindowHeader: ", windowTitle, openStyle, managed, this.props.expanded)
    let titleComponent = null
    if (this.state.editingTitle) {
      var titleInputStyle = Util.merge(OldStyles.text, OldStyles.noWrap, OldStyles.windowTitleInput)
      titleComponent = (
        <form onSubmit={this.handleTitleSubmit}>
          <input
            style={titleInputStyle}
            type='text'
            name='window-title'
            id='window-title'
            ref={(titleElem) => {
              this.titleInput = titleElem
              if (titleElem) {
                window.setTimeout(() => {
                  titleElem.setSelectionRange(0, windowTitle.length)
                }, 0)
              }
            }}
            autoFocus
            autoComplete='off'
            defaultValue={windowTitle}
            onKeyDown={this.handleTitleKeyDown}
            onClick={(e) => { e.stopPropagation() } }
          />
        </form>
      )
    } else {
      titleComponent = (
        <span>{windowTitle}</span>
      )
    }

    const titleSpan = (
      <div className={titleStyle}>
        {titleComponent}
      </div>
    )

    // Note explicit global css class name windowHeaderHoverContainer here
    // Due to limitation of nested class selectors with composition;
    // see https://emotion.sh/docs/nested for more info.
    return (
      <div
        className={cx(styles.windowHeader, styles.noWrap) + ' windowHeaderHoverContainer'}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        onClick={this.props.onOpen}>
        <div className='rowItems-fixed-width'>
          {windowCheckItem}
          <ExpanderButton
            winStore={this.props.winStore}
            expanded={this.props.expanded}
            onClick={this.props.onExpand} />
        </div>
        {titleSpan}
        <div className='rowItems-fixed-width'>
          {editButton}
          {revertButton}
          {closeButton}
        </div>
      </div>
    )
  }

  componentDidMount () {
    var titleElem = this.titleInput
    if (!titleElem) {
      return
    }
    /* titleElem.val(this.props.initialTitle); */
    const titleLen = this.props.initialTitle.length
    if (titleElem) {
      window.setTimeout(() => {
        console.log('timer func')
        titleElem.setSelectionRange(0, titleLen)
      }, 0)
    } else {
      console.warn('SaveModal: no titleInput element')
    }
  }
}

export default WindowHeader
