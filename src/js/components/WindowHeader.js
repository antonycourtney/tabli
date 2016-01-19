import * as React from 'react';
import Styles from './styles';
import * as Util from './util';
import * as actions from '../actions';

import * as PureRenderMixin from 'react-addons-pure-render-mixin';
import Hoverable from './Hoverable';
import HeaderButton from './HeaderButton';
import ExpanderButton from './ExpanderButton';

const WindowHeader = React.createClass({
  mixins: [Hoverable, PureRenderMixin],

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

    var hoverStyle = this.state.hovering ? Styles.visible : Styles.hidden;

    var windowCheckItem;

    if (managed) {
      windowCheckItem = (
        <button style={Util.merge(Styles.headerButton, Styles.windowManagedButton)}
          title="Stop managing this window" onClick={this.handleUnmanageClick}
        />);
    } else {
      var checkStyle = Util.merge(Styles.headerButton, hoverStyle, Styles.headerCheckBox);
      windowCheckItem = (
        <input style={checkStyle} type="checkbox"
          title="Save all tabs in this window"
          onClick={this.handleManageClick}
          ref="managedCheckbox"
          value={false}
        />);
    }

    var openStyle = tabWindow.open ? Styles.open : Styles.closed;
    var titleStyle = Util.merge(Styles.text, Styles.noWrap, Styles.windowTitle, openStyle);
    var closeStyle = Util.merge(Styles.headerButton, Styles.closeButton);

    // We use hovering in the window header (this.state.hovering) to determine
    // visibility of both the revert button and close button appearing after the window title.

    var revertButton = (
      <HeaderButton baseStyle={Util.merge(Styles.headerButton, Styles.revertButton)}
        // visible={this.state.hovering && managed && tabWindow.open}
        visible={managed && tabWindow.open}
        title="Revert to bookmarked tabs (Close other tabs)"
        onClick={this.props.onRevert}
      />);

    var closeButton = (
      <HeaderButton baseStyle={closeStyle}
        visible={this.state.hovering && tabWindow.open}
        hoverStyle={Styles.closeButtonHover} title="Close Window"
        onClick={this.props.onClose}
      />);

    // console.log("WindowHeader: ", windowTitle, openStyle, managed, this.props.expanded);

    return (
      <div style={Util.merge(Styles.windowHeader, Styles.noWrap)}
          onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut}
          onClick={this.props.onOpen}
      >
        {windowCheckItem}
        <ExpanderButton winStore={this.props.winStore} expanded={this.props.expanded} onClick={this.props.onExpand} />
        <span style={titleStyle}>{windowTitle}</span>
        {revertButton}
        <div style={Styles.spacer} />
                                                                                                                                                                                                                                                                {closeButton}
      </div>
    );
  },
});

export default WindowHeader;
