import * as React from 'react'
import * as Immutable from 'immutable'
import OldStyles from './oldStyles'
import * as styles from './cssStyles'
import * as Util from './util'

import * as Constants from './constants'

import * as Modal from './Modal'

import * as TabWindow from '../tabWindow'

/*
 * Modal dialog for reverting a bookmarked window
 */
class RevertModal extends React.Component {
  handleKeyDown = (e) => {
    if (e.keyCode === Constants.KEY_ESC) {
      // ESC key
      e.preventDefault()
      this.props.onClose(e)
    } else if (e.keyCode === Constants.KEY_ENTER) {
      this.handleSubmit(e)
    }
  };

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.onSubmit(this.props.tabWindow)
  };

  renderItem = (tabItem, idx) => {
    const favIconUrl = tabItem.open ? tabItem.openState.favIconUrl : null
    var fiSrc = favIconUrl || ''

    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
      fiSrc = ''
    }

    var tabFavIcon = <img style={OldStyles.favIcon} src={fiSrc} />
    const tabOpenStyle = tabItem.open ? null : OldStyles.closed
    var tabActiveStyle = tabItem.active ? OldStyles.activeSpan : null
    var tabTitleStyles = Util.merge(OldStyles.text, OldStyles.simpleTabTitle, OldStyles.noWrap, tabOpenStyle, tabActiveStyle)
    const id = 'tabItem-' + idx
    return (
      <div key={id} style={Util.merge(OldStyles.noWrap, OldStyles.tabItem)}>
        {tabFavIcon}
        <span style={tabTitleStyles}>{tabItem.title}</span>
        <div style={OldStyles.spacer} />
      </div>
    )
  };

  renderTabItems = (tabItems) => {
    const itemElems = tabItems.map(this.renderItem)
    return (
      <div style={OldStyles.tabList}>
        {itemElems}
      </div>
    )
  };

  render () {
    const tabWindow = this.props.tabWindow
    // Call removeOpenWindowState with snapshot=false to obtain tentative
    // reverted state
    const revertedTabWindow = TabWindow.removeOpenWindowState(tabWindow, false)
    const savedUrlsSet = Immutable.Set(revertedTabWindow.tabItems.map((ti) => ti.url))

    const itemsToClose = tabWindow.tabItems.filter((ti) => !(savedUrlsSet.has(ti.url)))
    const closeItemsElem = this.renderTabItems(itemsToClose)

    const itemsToReload = tabWindow.tabItems.filter((ti) => savedUrlsSet.has(ti.url))
    const reloadItemsElem = this.renderTabItems(itemsToReload)

    var closeSection = null
    if (itemsToClose.count() > 0) {
      closeSection = (
        <div>
          <p>
            The following tabs will be closed:
          </p>
          <div style={OldStyles.simpleTabContainer}>
            {closeItemsElem}
          </div>
          <br />
        </div>
      )
    }

    /*             style={Util.merge(OldStyles.dialogButton, OldStyles.primaryButton)}
    style={OldStyles.dialogButton}
    */
    return (
      <Modal.Dialog title='Revert Saved Window?' onClose={this.props.onClose}>
        <Modal.Body>
          <div style={OldStyles.dialogInfoContents}>
            {closeSection}
            <p>
              The following tabs will be reloaded:
            </p>
            <div style={OldStyles.simpleTabContainer}>
              {reloadItemsElem}
            </div>
            <br />
            <p>
              This action can not be undone.
            </p>
          </div>
          <div className={styles.dialogButtonRow} >
            <button
              type='button'
              className='btn btn-primary btn-sm tabli-dialog-button'
              onClick={this.handleSubmit}
              ref={(c) => { this.okButton = c }}
              tabIndex={0}
              onKeyDown={this.handleKeyDown}>
              OK
            </button>
            <button
              type='button'
              className='btn btn-default btn-light btn-sm tabli-dialog-button'
              onClick={this.props.onClose}
              tabIndex={0}>
              Cancel
            </button>
          </div>
        </Modal.Body>
      </Modal.Dialog>
    )
  }

  /* HACK - get focus to the OK button, because tabIndex getting ignored. */
  componentDidMount () {
    if (this.okButton) {
      this.okButton.focus()
    }
  }
}

export default RevertModal
