import * as React from 'react';
import Styles from './styles';
import * as Util from './util';
import * as actions from '../actions';

import * as PureRenderMixin from 'react-addons-pure-render-mixin';
import HeaderButton from './HeaderButton';
import ExpanderButton from './ExpanderButton';

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

    var windowCheckItem;

    if (managed) {
      windowCheckItem = (
        <button style={Util.merge(Styles.headerButton, Styles.windowManagedButton)}
          title="Stop managing this window" onClick={this.handleUnmanageClick}
        />);
    } else {
      var checkStyle = Util.merge(Styles.headerButton,Styles.headerCheckBox);
      windowCheckItem = (
        <input className="windowCheck" style={checkStyle} type="checkbox"
          title="Save all tabs in this window"
          onClick={this.handleManageClick}
          ref="managedCheckbox"
          value={false}
        />);
    }

    var openStyle = tabWindow.open ? Styles.open : Styles.closed;
    var titleStyle = Util.merge(Styles.text, Styles.noWrap, Styles.windowTitle, openStyle);

    // We use hovering in the window header (this.state.hovering) to determine
    // visibility of both the revert button and close button appearing after the window title.

    var revertButton = (
      <HeaderButton baseStyle={Util.merge(Styles.headerButton, Styles.revertButton)}
        visible={managed && tabWindow.open}
        title="Revert to bookmarked tabs (Close other tabs)"
        onClick={this.props.onRevert}
      />);

    var closeButton = (
      <HeaderButton className="closeButton" baseStyle={Styles.headerButton}
        visible={tabWindow.open}
        title="Close Window"
        onClick={this.props.onClose}
      />);

    // console.log("WindowHeader: ", windowTitle, openStyle, managed, this.props.expanded);

    return (
      <div className="windowHeader" style={Util.merge(Styles.windowHeader, Styles.noWrap)}
          onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut}
          onClick={this.props.onOpen}
      >
        {windowCheckItem}
        <ExpanderButton winStore={this.props.winStore} expanded={this.props.expanded} onClick={this.props.onExpand} />
        <span style={titleStyle}>{windowTitle}</span>
        {revertButton}
        {closeButton}
      </div>
    );
  },
});

export default WindowHeader;
