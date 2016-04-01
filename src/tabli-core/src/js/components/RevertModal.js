import * as React from 'react';
import * as Immutable from 'immutable';
import Styles from './styles';
import * as Util from './util';

import * as Constants from './constants';

import * as Modal from './Modal';

import * as TabWindow from '../tabWindow';

/*
 * Modal dialog for reverting a bookmarked window
 */
const RevertModal = React.createClass({
  handleKeyDown(e) {
    if (e.keyCode === Constants.KEY_ESC) {
      // ESC key
      e.preventDefault();
      this.props.onClose(e);
    } else if (e.keyCode === Constants.KEY_ENTER) {
      this.handleSubmit(e);
    }
  },

  handleSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.props.tabWindow);
  },

  renderItem(tabItem) {
    var fiSrc = tabItem.openState.favIconUrl ? tabItem.openState.favIconUrl : '';

    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
      fiSrc = '';
    }

    var tabFavIcon = <img style={Styles.favIcon} src={fiSrc} />;
    const tabOpenStyle = tabItem.open ? null : Styles.closed;
    var tabActiveStyle = tabItem.active ? Styles.activeSpan : null;
    var tabTitleStyles = Util.merge(Styles.text, Styles.tabTitle, Styles.noWrap, tabOpenStyle, tabActiveStyle);
    const id = 'tabItem-' + tabItem.openState.openTabId;
    return (
        <div key={id} style={Util.merge(Styles.noWrap, Styles.tabItem)} >
          {tabFavIcon}
          <span style={tabTitleStyles}>{tabItem.title}</span>
          <div style={Styles.spacer} />
        </div>
      );
  },

  renderTabItems(tabItems) {
    const itemElems = tabItems.map(this.renderItem);
    return (
      <div style={Styles.tabList}>
        {itemElems}
      </div>
    );
  },

  render() {
    const tabWindow = this.props.tabWindow;
    const revertedTabWindow = TabWindow.removeOpenWindowState(tabWindow);
    const savedUrlsSet = Immutable.Set(revertedTabWindow.tabItems.map((ti) => ti.url));

    const itemsToClose = tabWindow.tabItems.filter((ti) => !(savedUrlsSet.has(ti.url)));
    const closeItemsElem = this.renderTabItems(itemsToClose);

    const itemsToReload = tabWindow.tabItems.filter((ti) => savedUrlsSet.has(ti.url));
    const reloadItemsElem = this.renderTabItems(itemsToReload);

    var closeSection = null;
    if (itemsToClose.count() > 0) {
      closeSection = (
        <div>
          <p>The following tabs will be closed:</p>
          <div style={Styles.simpleTabContainer}>
            {closeItemsElem}
          </div>
          <br/>
        </div>
        );
    }

    return (
      <Modal.Dialog title="Revert Saved Window?" onClose={this.props.onClose} >
        <Modal.Body>
          <div style={Styles.dialogInfoContents}>
            {closeSection}
            <p>The following tabs will be reloaded:</p>
              <div style={Styles.simpleTabContainer}>
                {reloadItemsElem}
              </div>
            <br/>
            <p>This action can not be undone.</p>
          </div>
          <div style={Util.merge(Styles.alignRight)}>
            <div style={Util.merge(Styles.dialogButton, Styles.primaryButton)}
              onClick={this.handleSubmit}
              ref="okButton"
              tabIndex={0}
              onKeyDown={this.handleKeyDown}
            >
              OK
            </div>
            <div style={Styles.dialogButton}
              onClick={this.props.onClose}
              tabIndex={0}
            >
              Cancel
            </div>
          </div>
        </Modal.Body>
      </Modal.Dialog>
    );
  },

  /* HACK - get focus to the OK button, because tabIndex getting ignored. */
  componentDidMount() {
    console.log('revertModal: did mount');
    this.refs.okButton.focus();
  },
});

export default RevertModal;
