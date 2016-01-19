import * as React from 'react';
import * as actions from '../actions';

import * as PureRenderMixin from 'react-addons-pure-render-mixin';

import HeaderButton from './HeaderButton';
import ExpanderButton from './ExpanderButton';

import styles from './WindowHeader.css';

import closeStyles from './CloseButton.css';

const WindowHeader = React.createClass({
  mixins: [PureRenderMixin],

  handleUnmanageClick(event) {
    console.log('unamange: ', this.props.tabWindow);
    event.preventDefault();
    const archiveFolderId = this.props.winStore.archiveFolderId;
    actions.unmanageWindow(archiveFolderId, this.props.tabWindow, this.props.storeUpdateHandler);
    event.stopPropagation();
  },

  handleManageClick(event) {
    console.log('manage: ', this.props.tabWindow);
    event.preventDefault();
    var tabWindow = this.props.tabWindow;
    var appComponent = this.props.appComponent;
    appComponent.openSaveModal(tabWindow);

    event.stopPropagation();
  },

  render() {
    var tabWindow = this.props.tabWindow;

    var managed = tabWindow.saved;
    var windowTitle = tabWindow.title;

    // var hoverStyle = this.state.hovering ? Styles.visible : Styles.hidden;

    var windowCheckItem;

    if (managed) {
      windowCheckItem = (
        <button className={styles.windowManagedButton}
          title="Stop managing this window" onClick={this.handleUnmanageClick}
        />);
    } else {
      windowCheckItem = (
        <input className={styles.headerCheckBox} type="checkbox"
          title="Save all tabs in this window"
          onClick={this.handleManageClick}
          ref="managedCheckbox"
          value={false}
        />);
    }

    var openStyle = tabWindow.open ? styles.open : styles.closed;
    var titleStyle = styles.windowTitle + ' ' + openStyle;

    // We use hovering in the window header (this.state.hovering) to determine
    // visibility of both the revert button and close button appearing after the window title.

    var revertButton = (
      <HeaderButton className={styles.revertButton}
        visible={managed && tabWindow.open}
        title="Revert to bookmarked tabs (Close other tabs)"
        onClick={this.props.onRevert}
      />);

    var closeButton = (
      <HeaderButton className={closeStyles.close}
        visible={tabWindow.open}
        title="Close Window"
        onClick={this.props.onClose}
      />);

    // console.log("WindowHeader: ", windowTitle, openStyle, managed, this.props.expanded);

    return (
      <div className={styles.titleBar}
          onMouseOver={this.handleMouseOver}
          onMouseOut={this.handleMouseOut}
          onClick={this.props.onOpen}
      >
        {windowCheckItem}
        <ExpanderButton winStore={this.props.winStore} expanded={this.props.expanded} onClick={this.props.onExpand} />
        <span className={titleStyle}>{windowTitle}</span>
        {revertButton}
        <div className={styles.spacer} />
        {closeButton}
      </div>
    );
  },
});

export default WindowHeader;
