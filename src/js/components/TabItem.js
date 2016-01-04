'use strict';

import * as React from 'react';
import {addons} from 'react/addons';
import Styles from './styles';
import * as Util from './util';
import * as actions from '../actions';
const {PureRenderMixin, Perf} = addons;

import Hoverable from './Hoverable';
import HeaderButton from './HeaderButton';

const TabItem = React.createClass({
  mixins:[Hoverable],

  handleClick: function() {
    var tabWindow = this.props.tabWindow;
    var tab = this.props.tab;
    var tabIndex = this.props.tabIndex;

    // console.log("TabItem: handleClick: tab: ", tab);

    actions.activateTab(tabWindow, tab, tabIndex, this.props.storeUpdateHandler);
  },

  handleClose: function() {
    if (!this.props.tabWindow.open)
      return;
    if (!this.props.tab.open)
      return;
    var tabId = this.props.tab.openTabId;
    actions.closeTab(this.props.tabWindow, tabId, this.props.storeUpdateHandler);
  },

  handleBookmarkTabItem: function(event) {
    event.stopPropagation();
    console.log('bookmark tab: ', this.props.tab.toJS());
    actions.saveTab(this.props.tabWindow, this.props.tab, this.props.storeUpdateHandler);
  },

  handleUnbookmarkTabItem: function(event) {
    event.stopPropagation();
    console.log('unbookmark tab: ', this.props.tab.toJS());
    actions.unsaveTab(this.props.tabWindow, this.props.tab, this.props.storeUpdateHandler);
  },

  render: function() {
    var tabWindow = this.props.tabWindow;
    var tab = this.props.tab;

    var managed = tabWindow.saved;

    var tabTitle = tab.title;

    // span style depending on whether open or closed window
    var tabOpenStyle = null;

    var tabCheckItem;

    if (managed) {
      if (!tab.open)
        tabOpenStyle = Styles.closed;

      var hoverVisible = this.state.hovering ? Styles.visible : Styles.hidden;

      if (tab.saved) {
        tabCheckItem = <button style={Util.merge(Styles.headerButton, Styles.tabManagedButton)}
                              title="Remove bookmark for this tab"
                              onClick={this.handleUnbookmarkTabItem}
                              />;

        // TODO: callback
      } else {
        // We used to include headerCheckbox, but that only set width and height
        // to something to 13x13; we want 16x16 from headerButton
        tabCheckItem = <input style={Util.merge(Styles.headerButton, hoverVisible, Styles.tabCheckItem)}
                              type="checkbox"
                              title="Bookmark this tab"
                              onClick={this.handleBookmarkTabItem}
                              />;
      }
    } else {
      // insert a spacer:
      tabCheckItem = <div style={Styles.headerButton} />;
    }

    var fiSrc = tab.favIconUrl ? tab.favIconUrl : '';

    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') == 0) {
      fiSrc = '';
    }

    const emptyFavIcon = <div style={Util.merge(Styles.headerButton, Styles.emptyFavIcon)} />;

    var tabFavIcon = (fiSrc.length > 0) ? <img style={Styles.favIcon} src={fiSrc} /> : emptyFavIcon;

    var tabActiveStyle = tab.active ? Styles.activeSpan : null;
    var tabTitleStyles = Util.merge(Styles.text, Styles.tabTitle, Styles.noWrap, tabOpenStyle, tabActiveStyle);
    var hoverStyle = this.state.hovering ? Styles.tabItemHover : null;
    var selectedStyle = this.props.isSelected ? Styles.tabItemSelected : null;

    const audibleIcon = tab.audible ? <div style={Util.merge(Styles.headerButton, Styles.audibleIcon)} /> : null;

    var closeStyle = Util.merge(Styles.headerButton, Styles.closeButton);
    var closeButton = <HeaderButton baseStyle={closeStyle} visible={tab.open && this.state.hovering}
                          hoverStyle={Styles.closeButtonHover} title="Close Tab"
                          onClick={this.handleClose} />;

    return (
      <div style={Util.merge(Styles.noWrap, Styles.tabItem, hoverStyle, selectedStyle)}
          onMouseOut={this.handleMouseOut}
          onMouseOver={this.handleMouseOver}
          onClick={this.handleClick} >
        {tabCheckItem}
        {tabFavIcon}
        <span style={tabTitleStyles}>{tabTitle}</span>
        <div style={Styles.spacer} />
        {audibleIcon}
        {closeButton}
      </div>);
  },

});

export default TabItem;
